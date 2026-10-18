import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import lockfile from "proper-lockfile";

export const OUTPUT_VERSION = 3;
export const CACHE_VERSION = 1;
export const QUERY_VERSION = 1;
export const PUBLIC_ENDPOINT = "https://graphql.pokeapi.co/v1beta2";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const result = JSON.stringify(value);
    if (result === undefined) throw new Error("Cannot serialize undefined JSON value");
    return result;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

export function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function readJson<T>(path: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (isFileError(error, "ENOENT")) return undefined;
    throw error;
  }
}

export function isFileError(error: unknown, code: string): boolean {
  return error instanceof Error && "code" in error && error.code === code;
}

// The temporary file is on the same volume. Never truncate the published target.
export async function atomicWrite(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  const file = await open(temporary, "wx");
  try {
    await file.writeFile(contents, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  try {
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await atomicWrite(path, `${canonicalJson(value)}\n`);
}

export async function withWriterLock<T>(directory: string, work: () => Promise<T>): Promise<T> {
  await mkdir(directory, { recursive: true });
  const release = await lockfile.lock(directory, {
    realpath: true,
    stale: 30_000,
    update: 10_000,
    retries: 0,
  });
  try {
    return await work();
  } finally {
    await release();
  }
}

export interface RefreshRun {
  formatVersion: number;
  id: string;
  endpoint: string;
  operationRevision: string;
  startedAt: string;
  completedAt: string | null;
  phase: "extracting" | "complete";
  speciesCursor: number;
  speciesPages: number[];
}

export async function openRun(
  stateDir: string,
  endpoint: string,
  operationRevision: string,
  fresh: boolean,
): Promise<RefreshRun> {
  const path = join(stateDir, "active.json");
  const existing = await readJson<RefreshRun>(path);
  if (existing && !fresh) {
    if (
      existing.formatVersion !== CACHE_VERSION ||
      existing.endpoint !== endpoint ||
      existing.operationRevision !== operationRevision
    ) {
      throw new Error(
        "Active refresh uses a different endpoint/schema/query version; use --fresh to start a new refresh",
      );
    }
    return existing;
  }
  const run: RefreshRun = {
    formatVersion: CACHE_VERSION,
    id: randomUUID(),
    endpoint,
    operationRevision,
    startedAt: new Date().toISOString(),
    completedAt: null,
    phase: "extracting",
    speciesCursor: 0,
    speciesPages: [],
  };
  await writeJson(path, run);
  return run;
}

export async function saveRun(stateDir: string, run: RefreshRun): Promise<void> {
  await writeJson(join(stateDir, "active.json"), run);
}
