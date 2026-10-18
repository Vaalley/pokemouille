import { join } from "node:path";
import {
  CACHE_VERSION,
  OUTPUT_VERSION,
  QUERY_VERSION,
  canonicalJson,
  digest,
  readJson,
  writeJson,
} from "./state.ts";

const HOUR = 3_600_000;
const HOURLY_LIMIT = 60;
export interface RateLedger {
  version: number;
  attempts: number[];
  cooldownUntil: number;
  lastObservedAt: number;
}
export class IncompleteRefresh extends Error {
  readonly reason: "max-requests" | "hourly-budget" | "cooldown" | "cache-miss";
  readonly retryAt: number | null;
  constructor(reason: IncompleteRefresh["reason"], retryAt: number | null = null) {
    super(
      `Refresh incomplete: ${reason}${retryAt === null ? "" : `; resume after ${new Date(retryAt).toISOString()}`}`,
    );
    this.name = "IncompleteRefresh";
    this.reason = reason;
    this.retryAt = retryAt;
  }
}
export interface Operation<T, V extends object> {
  name: string;
  document: string;
  // GraphQL Code Generator supplies T and V at each operation definition.
  validate: (data: T, variables: V) => void;
}
export interface CachedResponse<T> {
  retrievedAt: string;
  data: T;
  dataHash: string;
}
interface ClientOptions {
  stateDir: string;
  refreshId: string;
  endpoint: string;
  schemaRevision: string;
  maxRequests: number;
  cacheOnly?: boolean;
  fetch?: typeof globalThis.fetch;
  now?: () => number;
}

export class GraphqlClient {
  readonly options: ClientOptions;
  requests = 0;
  private inflight = new Map<string, Promise<CachedResponse<unknown>>>();
  private serial: Promise<unknown> = Promise.resolve();
  constructor(options: ClientOptions) {
    if (
      !Number.isSafeInteger(options.maxRequests) ||
      options.maxRequests < 0 ||
      options.maxRequests > HOURLY_LIMIT
    ) {
      throw new Error("--max-requests must be an integer from 0 to 60");
    }
    this.options = options;
  }

  request<T, V extends object>(
    operation: Operation<T, V>,
    variables: V,
  ): Promise<CachedResponse<T>> {
    const key = digest(
      canonicalJson({
        cache: CACHE_VERSION,
        query: QUERY_VERSION,
        output: OUTPUT_VERSION,
        schema: this.options.schemaRevision,
        endpoint: this.options.endpoint,
        operation: operation.document,
        operationName: operation.name,
        variables,
      }),
    );
    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<CachedResponse<T>>;
    const pending = this.serial.then(() => this.execute(operation, variables, key));
    this.serial = pending.catch(() => undefined);
    this.inflight.set(key, pending);
    void pending.finally(() => this.inflight.delete(key)).catch(() => undefined);
    return pending;
  }

  private async execute<T, V extends object>(
    operation: Operation<T, V>,
    variables: V,
    key: string,
  ): Promise<CachedResponse<T>> {
    const path = join(this.options.stateDir, "responses", this.options.refreshId, `${key}.json`);
    const cached = await readJson<CachedResponse<T>>(path);
    if (cached) {
      if (!cached.retrievedAt || cached.dataHash !== digest(canonicalJson(cached.data)))
        throw new Error(`Corrupt cached response for ${operation.name}`);
      operation.validate(cached.data, variables);
      return cached;
    }
    if (this.options.cacheOnly) throw new IncompleteRefresh("cache-miss");
    if (this.requests >= this.options.maxRequests) throw new IncompleteRefresh("max-requests");
    const ledgerPath = join(this.options.stateDir, "rate.json");
    const ledger = (await readJson<RateLedger>(ledgerPath)) ?? {
      version: 1,
      attempts: [],
      cooldownUntil: 0,
      lastObservedAt: 0,
    };
    if (
      ledger.version !== 1 ||
      !Array.isArray(ledger.attempts) ||
      !ledger.attempts.every(Number.isFinite) ||
      !Number.isFinite(ledger.cooldownUntil) ||
      !Number.isFinite(ledger.lastObservedAt)
    ) {
      throw new Error("Invalid persisted request ledger; refusing to discard the hourly budget");
    }
    const now = Math.max((this.options.now ?? Date.now)(), ledger.lastObservedAt);
    ledger.attempts = ledger.attempts.filter((time) => time > now - HOUR);
    if (ledger.cooldownUntil > now) throw new IncompleteRefresh("cooldown", ledger.cooldownUntil);
    if (ledger.attempts.length >= HOURLY_LIMIT)
      throw new IncompleteRefresh("hourly-budget", Math.min(...ledger.attempts) + HOUR);
    ledger.attempts.push(now);
    ledger.lastObservedAt = now;
    // Persist the reservation before touching the network: crashes and errors consume budget too.
    await writeJson(ledgerPath, ledger);
    this.requests++;
    // The upstream proxy can reuse a response for different large POST bodies.
    // Include the complete request identity in the URL, not just in our local cache.
    const requestUrl = new URL(this.options.endpoint);
    requestUrl.searchParams.set("queryHash", key);
    const response = await (this.options.fetch ?? globalThis.fetch)(requestUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query: operation.document, operationName: operation.name, variables }),
      signal: AbortSignal.timeout(120_000),
    });
    if (response.status === 429 || response.headers.has("retry-after")) {
      const value = response.headers.get("retry-after");
      const seconds = value === null ? NaN : Number(value);
      const parsed = value === null ? NaN : Date.parse(value);
      const until =
        Number.isFinite(seconds) && seconds >= 0
          ? now + seconds * 1000
          : Number.isFinite(parsed)
            ? parsed
            : now + HOUR;
      ledger.cooldownUntil = Math.max(ledger.cooldownUntil, now + 1000, until);
      await writeJson(ledgerPath, ledger);
      if (!response.ok) throw new IncompleteRefresh("cooldown", ledger.cooldownUntil);
    }
    if (!response.ok) throw new Error(`${operation.name}: HTTP ${response.status}`);
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > 64 * 1024 * 1024)
      throw new Error(`${operation.name}: response exceeds 64 MiB bound`);
    const body: { data?: T; errors?: unknown } = JSON.parse(text);
    if (body.errors && (!Array.isArray(body.errors) || body.errors.length > 0))
      throw new Error(
        `${operation.name}: GraphQL errors: ${JSON.stringify(body.errors).slice(0, 2000)}`,
      );
    if (!body.data || typeof body.data !== "object")
      throw new Error(`${operation.name}: missing GraphQL data`);
    operation.validate(body.data, variables);
    const result: CachedResponse<T> = {
      retrievedAt: new Date(now).toISOString(),
      data: body.data,
      dataHash: digest(canonicalJson(body.data)),
    };
    await writeJson(path, result);
    return result;
  }
}
