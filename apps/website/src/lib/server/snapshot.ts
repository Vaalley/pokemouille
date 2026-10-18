import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type {
  DatasetManifest,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";

// Like the prerender route loaders, the server runs with apps/website as cwd.
export const DATA_DIR = join(process.cwd(), "static", "data");
export const MANIFEST_PATH = join(DATA_DIR, "manifest.json");
const READ_CONCURRENCY = 4;

/** Read one published asset by its manifest path (relative to the data directory). */
export async function readDataJson<T>(path: string, dataDir = DATA_DIR): Promise<T> {
  return JSON.parse(await readFile(join(dataDir, path), "utf8")) as T;
}

/** Run `task` over every item with at most `concurrency` tasks in flight. */
export async function forEachBounded<T>(
  items: readonly T[],
  task: (item: T) => Promise<void>,
  concurrency = READ_CONCURRENCY,
): Promise<void> {
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) await task(items[next++]!);
  }
  const workers = Math.max(1, Math.min(Math.floor(concurrency), items.length));
  await Promise.all(Array.from({ length: items.length ? workers : 0 }, () => worker()));
}

/**
 * One bounded pass over the published species assets. At most `concurrency` full
 * records are read/parsed at once; visitors must keep compact projections only,
 * never the records themselves. Visit order follows read completion, not species ID.
 */
export function forEachSpecies(
  manifest: DatasetManifest,
  visit: (record: SpeciesRecord) => void,
  concurrency = READ_CONCURRENCY,
  dataDir = DATA_DIR,
): Promise<void> {
  return forEachBounded(
    Object.values(manifest.files.pokemon),
    async (asset) => visit(await readDataJson<SpeciesRecord>(asset.path, dataDir)),
    concurrency,
  );
}

/**
 * One build-time projection per immutable dataset revision, shared by every route and
 * locale. The mutable manifest is stat-ed for each new request batch (including in dev);
 * a replaced or edited manifest invalidates the projection, while an unchanged revision
 * key only refreshes the stamp. Concurrent callers share one check and one build, and a
 * failed build is evicted so the next call retries.
 */
export function createSnapshotCache<T>(
  build: (manifest: DatasetManifest) => Promise<T>,
  manifestPath = MANIFEST_PATH,
): () => Promise<T> {
  let cached: { manifestStamp: string; revisionKey: string; promise: Promise<T> } | undefined;
  let checking: Promise<T> | undefined;

  async function current(): Promise<T> {
    const info = await stat(manifestPath, { bigint: true });
    const manifestStamp = `${info.mtimeNs}:${info.ctimeNs}:${info.size}:${info.ino}`;
    if (cached?.manifestStamp === manifestStamp) return cached.promise;
    const source = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(source) as DatasetManifest;
    const revisionKey = `${manifest.datasetRevision}:${createHash("sha256").update(source).digest("hex")}`;
    if (cached?.revisionKey === revisionKey) {
      cached.manifestStamp = manifestStamp;
      return cached.promise;
    }
    const promise = build(manifest);
    // Retain only the current revision. Existing in-flight consumers can finish on
    // their old immutable snapshot, which becomes collectable after those requests.
    cached = { manifestStamp, revisionKey, promise };
    void promise.catch(() => {
      if (cached?.promise === promise) cached = undefined;
    });
    return promise;
  }

  return () => {
    if (!checking) {
      const attempt = current();
      checking = attempt;
      const clear = () => {
        if (checking === attempt) checking = undefined;
      };
      void attempt.then(clear, clear);
    }
    return checking;
  };
}
