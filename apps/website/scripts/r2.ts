// R2 transfers for the Cloudflare deployment (run from anywhere):
//   node apps/website/scripts/r2.ts sync [--local]        upload dataset + _app/immutable, manifest last
//   node apps/website/scripts/r2.ts data-pull [--local]   download the published snapshot to static/data
//   node apps/website/scripts/r2.ts state-pull [--local]  restore .data/state from R2
//   node apps/website/scripts/r2.ts state-push [--local]  save .data/state to R2
// Remote mode reaches the real bucket through a Wrangler remote binding (`wrangler login`
// locally, CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in CI); --local writes the bucket
// `wrangler dev` serves.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { getPlatformProxy } from "wrangler";

const WEBSITE = fileURLToPath(new URL("..", import.meta.url));
const ROOT = join(WEBSITE, "..", "..");
const CONFIG = join(WEBSITE, "wrangler.jsonc");
const DATA_DIR = join(WEBSITE, "static", "data");
const IMMUTABLE_DIR = join(WEBSITE, "build", "_app", "immutable");
const STATE_DIR = join(ROOT, ".data", "state");
// Never served: the Worker only exposes data/manifest.json, data/revisions/* and _app/immutable/*.
const STATE_KEY = "state/state.tar.gz";
const CONCURRENCY = 16;

const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

interface Store {
  /** Byte size of an existing object, or null. */
  size(key: string): Promise<number | null>;
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, body: Uint8Array<ArrayBuffer>, contentType: string): Promise<void>;
  close(): Promise<void>;
}

// The subset of the Workers R2Bucket binding used here (Node has no Workers globals).
interface Bucket {
  head(key: string): Promise<{ size: number } | null>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  put(
    key: string,
    body: Uint8Array,
    options: { httpMetadata: { contentType: string } },
  ): Promise<unknown>;
}

async function openStore(local: boolean): Promise<Store> {
  const { env, dispose } = await getPlatformProxy<{ DATA: Bucket }>({
    configPath: CONFIG,
    ...(local
      ? // The directory `wrangler dev --config apps/website/wrangler.jsonc` uses.
        { persist: { path: join(WEBSITE, ".wrangler", "state", "v3") } }
      : { environment: "r2sync", remoteBindings: true }),
  });
  return {
    size: async (key) => (await env.DATA.head(key))?.size ?? null,
    async get(key) {
      const object = await env.DATA.get(key);
      return object ? new Uint8Array(await object.arrayBuffer()) : null;
    },
    async put(key, body, contentType) {
      await env.DATA.put(key, body, { httpMetadata: { contentType } });
    },
    close: dispose,
  };
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

async function pool<T>(items: readonly T[], run: (item: T) => Promise<void>) {
  let next = 0;
  async function worker() {
    while (next < items.length) await run(items[next++]!);
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

/** Uploads files missing remotely; content-addressed keys are never overwritten. */
async function uploadImmutable(store: Store, files: { key: string; path: string }[]) {
  let uploaded = 0;
  await pool(files, async ({ key, path }) => {
    const body = await readFile(path);
    const existing = await store.size(key);
    if (existing === body.byteLength) return;
    if (existing !== null)
      throw new Error(`Immutable object ${key} differs in size; refusing to overwrite`);
    await store.put(key, body, CONTENT_TYPES[extname(key)] ?? "application/octet-stream");
    uploaded++;
  });
  return uploaded;
}

async function sync(store: Store) {
  const manifest = await readFile(join(DATA_DIR, "manifest.json"));
  const files = [];
  for (const [dir, prefix] of [
    [join(DATA_DIR, "revisions"), "data/revisions/"],
    [IMMUTABLE_DIR, "_app/immutable/"],
  ] as const) {
    for (const path of await listFiles(dir))
      files.push({ key: prefix + relative(dir, path).split(sep).join("/"), path });
  }
  const uploaded = await uploadImmutable(store, files);
  // Publish the mutable pointer only after every file it references exists.
  await store.put("data/manifest.json", manifest, "application/json");
  console.log(`Uploaded ${uploaded} of ${files.length} immutable files, then data/manifest.json.`);
}

/** Downloads the published snapshot into static/data so CI builds need no ingestion state. */
async function dataPull(store: Store) {
  const manifest = await store.get("data/manifest.json");
  if (!manifest) throw new Error("data/manifest.json is not in the bucket; run sync once first");
  const assets: { path: string; sha256: string }[] = [];
  const collect = (value: unknown): void => {
    if (typeof value !== "object" || value === null) return;
    if ("path" in value && "sha256" in value) {
      if (typeof value.path !== "string" || typeof value.sha256 !== "string")
        throw new Error("Manifest asset has a non-string path or sha256");
      assets.push({ path: value.path, sha256: value.sha256 });
    } else Object.values(value).forEach(collect);
  };
  const parsed: unknown = JSON.parse(new TextDecoder().decode(manifest));
  if (typeof parsed !== "object" || parsed === null || !("files" in parsed))
    throw new Error("data/manifest.json has no files");
  collect(parsed.files);
  await pool(assets, async ({ path, sha256 }) => {
    const body = await store.get(`data/${path}`);
    if (!body) throw new Error(`Manifest asset data/${path} is missing from the bucket`);
    if (createHash("sha256").update(body).digest("hex") !== sha256)
      throw new Error(`Manifest asset data/${path} does not match its SHA-256`);
    await mkdir(dirname(join(DATA_DIR, path)), { recursive: true });
    await writeFile(join(DATA_DIR, path), body);
  });
  await writeFile(join(DATA_DIR, "manifest.json"), manifest);
  console.log(`Downloaded ${assets.length} dataset files and manifest.json.`);
}

function tar(args: string[]) {
  const result = spawnSync("tar", args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`tar ${args.join(" ")} failed`);
}

async function statePull(store: Store) {
  const archive = await store.get(STATE_KEY);
  if (!archive) throw new Error(`${STATE_KEY} is not in the bucket; run state-push once first`);
  const temp = await mkdtemp(join(tmpdir(), "pokemouille-state-"));
  try {
    await writeFile(join(temp, "state.tar.gz"), archive);
    await rm(STATE_DIR, { recursive: true, force: true });
    await mkdir(STATE_DIR, { recursive: true });
    tar(["-xzf", join(temp, "state.tar.gz"), "-C", STATE_DIR]);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log(`Restored ${STATE_DIR} (${archive.byteLength} compressed bytes).`);
}

async function statePush(store: Store) {
  const temp = await mkdtemp(join(tmpdir(), "pokemouille-state-"));
  try {
    tar(["-czf", join(temp, "state.tar.gz"), "-C", STATE_DIR, "."]);
    const archive = await readFile(join(temp, "state.tar.gz"));
    await store.put(STATE_KEY, archive, "application/gzip");
    console.log(`Saved ${STATE_DIR} (${archive.byteLength} compressed bytes).`);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { local: { type: "boolean", default: false } },
});
const commands = {
  sync,
  "data-pull": dataPull,
  "state-pull": statePull,
  "state-push": statePush,
};
const command = commands[positionals[0] as keyof typeof commands];
if (!command) {
  console.error(
    `Usage: node apps/website/scripts/r2.ts <${Object.keys(commands).join("|")}> [--local]`,
  );
  process.exit(1);
}
const store = await openStore(values.local);
try {
  await command(store);
} finally {
  await store.close();
}
