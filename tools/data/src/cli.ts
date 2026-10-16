import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { IncompleteRefresh } from "./client.ts";
import type { RateLedger } from "./client.ts";
import { extractSnapshot } from "./extract.ts";
import { publishSnapshot } from "./publish.ts";
import type { DatasetManifest } from "../../../packages/pokemon-data/src/index.ts";
import { fetchSchema } from "./schema.ts";
import { PUBLIC_ENDPOINT, readJson, withWriterLock } from "./state.ts";
import type { RefreshRun } from "./state.ts";

const HELP = `Pokémouille data pipeline

Usage: node tools/data/src/cli.ts <command> [options]

Commands:
  refresh   Resume the active refresh; validate and publish only when complete.
  publish   Validate cached complete input and publish offline (no requests).
  status    Show durable refresh, hourly request budget and publication status.
  schema    Fetch full GraphQL introspection using the same durable budget.
  help      Show this help.

Options:
  --state-dir PATH      Durable cache/budget/lock directory. Default:
                        ${join(homedir(), ".cache", "pokemouille", "data")}
  --out-dir PATH        Static assets directory (default: .data/published).
  --endpoint URL        GraphQL POST endpoint; public v1beta2 by default.
                        Resume/publish infer the active run's endpoint.
  --max-requests N      At most N new requests this invocation, 0..60 (default 60).
                        The persisted rolling-hour limit is always <=60.
  --fresh               Start a NEW refresh without reusing prior-run responses.
                        Required for another upstream refresh after completion.
  --schema-file PATH    schema output for schema command (default:
                        tools/data/graphql/schema.json).
  --help, -h            Show help without touching the network or state.

Exit status: 0 success; 2 incomplete/resumable (max-requests, hourly budget,
cooldown, or missing offline pages); 1 failure. No automatic retry or waiting.
429/Retry-After persists cooldown. Resume the SAME state directory after it ends.
Incomplete, invalid, or changed-census inputs never replace the root manifest.
Prior immutable revision assets are retained; state caches may be retained too.

Initial setup (from repository root):
  node tools/data/src/cli.ts schema --state-dir <durable-path>
  node node_modules/@graphql-codegen/cli/cjs/bin.js --config tools/data/codegen.ts
  node tools/data/src/cli.ts refresh --state-dir <durable-path> --out-dir <static-path>
Weekly/manual new refresh: add --fresh ONCE, then resume without --fresh if stopped.
Website builds read published assets; they must not invoke refresh or schema.
`;

export async function main(args = process.argv.slice(2)): Promise<number> {
  try {
    const { values, positionals } = parseArgs({
      args,
      allowPositionals: true,
      strict: true,
      options: {
        "state-dir": { type: "string" },
        "out-dir": { type: "string" },
        endpoint: { type: "string" },
        "max-requests": { type: "string" },
        fresh: { type: "boolean", default: false },
        "schema-file": { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
    });
    const command = positionals[0] ?? "help";
    if (values.help || command === "help") {
      console.log(HELP);
      return 0;
    }
    if (!["refresh", "publish", "status", "schema"].includes(command) || positionals.length !== 1)
      throw new Error(`Unknown command: ${positionals.join(" ")}; use --help`);
    if (values.fresh && command !== "refresh") throw new Error("--fresh is only valid for refresh");
    const stateDir = resolve(
      values["state-dir"] ?? join(homedir(), ".cache", "pokemouille", "data"),
    );
    const outDir = resolve(values["out-dir"] ?? ".data/published");
    if (stateDir === outDir)
      throw new Error("--state-dir and --out-dir must be different directories");
    const maxRequests = values["max-requests"] === undefined ? 60 : Number(values["max-requests"]);
    if (
      !Number.isSafeInteger(maxRequests) ||
      maxRequests < 0 ||
      maxRequests > 60 ||
      values["max-requests"] === ""
    )
      throw new Error("--max-requests must be an integer from 0 to 60");
    const active = await readJson<RefreshRun>(join(stateDir, "active.json"));
    const endpoint = values.endpoint ?? active?.endpoint ?? PUBLIC_ENDPOINT;
    const url = new URL(endpoint);
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("--endpoint must use HTTP or HTTPS");
    if (command === "status") {
      const ledger = await readJson<RateLedger>(join(stateDir, "rate.json"));
      const now = Math.max(Date.now(), ledger?.lastObservedAt ?? 0);
      const attempts = ledger?.attempts.filter((time) => time > now - 3_600_000) ?? [];
      const manifest = await readJson<DatasetManifest>(join(outDir, "manifest.json"));
      console.log(
        JSON.stringify(
          {
            stateDir,
            outDir,
            active: active ?? null,
            budget: {
              rollingHourLimit: 60,
              used: attempts.length,
              remaining: Math.max(0, 60 - attempts.length),
              cooldownUntil:
                ledger && ledger.cooldownUntil > now
                  ? new Date(ledger.cooldownUntil).toISOString()
                  : null,
              nextBudgetAt:
                attempts.length >= 60
                  ? new Date(Math.min(...attempts) + 3_600_000).toISOString()
                  : null,
            },
            published: manifest
              ? {
                  datasetRevision: manifest.datasetRevision,
                  source: manifest.source,
                  counts: manifest.counts,
                }
              : null,
          },
          null,
          2,
        ),
      );
      return 0;
    }
    await withWriterLock(stateDir, async () => {
      if (command === "schema") {
        const schemaFile = resolve(
          values["schema-file"] ??
            fileURLToPath(new URL("../graphql/schema.json", import.meta.url)),
        );
        await fetchSchema({ stateDir, endpoint, maxRequests, schemaFile });
        console.log(
          JSON.stringify({
            status: "schema-saved",
            schemaFile,
            endpoint,
            next: "node node_modules/@graphql-codegen/cli/cjs/bin.js --config tools/data/codegen.ts",
          }),
        );
        return;
      }
      const result = await extractSnapshot({
        stateDir,
        endpoint,
        maxRequests: command === "publish" ? 0 : maxRequests,
        fresh: values.fresh ?? false,
        cacheOnly: command === "publish",
      });
      const manifest = await publishSnapshot(outDir, result.input, result.provenance);
      console.log(
        JSON.stringify({
          status: "published",
          datasetRevision: manifest.datasetRevision,
          newRequests: result.requests,
          counts: manifest.counts,
          manifest: join(outDir, "manifest.json"),
        }),
      );
    });
    return 0;
  } catch (error) {
    if (error instanceof IncompleteRefresh) {
      console.error(
        JSON.stringify({
          status: "incomplete",
          reason: error.reason,
          retryAt: error.retryAt === null ? null : new Date(error.retryAt).toISOString(),
          message: error.message,
        }),
      );
      return 2;
    }
    console.error(
      JSON.stringify({
        status: "failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  process.exitCode = await main();
