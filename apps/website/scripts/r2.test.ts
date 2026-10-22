import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { sync, withRetry } from "./r2.ts";

vi.mock("wrangler", () => ({ getPlatformProxy: vi.fn() }));

const temporary: string[] = [];
const A = "a".repeat(64);
const B = "b".repeat(64);

afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function build(revision: string) {
  const root = await mkdtemp(join(tmpdir(), "pokemouille-retained-assets-"));
  temporary.push(root);
  const directories = {
    data: join(root, "data"),
    immutable: join(root, "_app", "immutable"),
    learners: join(root, "learners"),
    breeding: join(root, "breeding"),
  };
  await mkdir(join(directories.data, "revisions", revision), { recursive: true });
  await mkdir(directories.immutable, { recursive: true });
  await mkdir(join(directories.learners, revision), { recursive: true });
  await mkdir(join(directories.breeding, revision), { recursive: true });
  await writeFile(
    join(directories.data, "manifest.json"),
    JSON.stringify({ datasetRevision: revision }),
  );
  await writeFile(join(directories.data, "revisions", revision, "reference.json"), "{}");
  await writeFile(join(directories.immutable, `${revision}.js`), "export {};");
  await writeFile(join(directories.learners, revision, "85.json"), '{"moveId":85}');
  await writeFile(join(directories.breeding, revision, "1.json"), '{"speciesId":1}');
  return directories;
}

function bucket() {
  const objects = new Map<string, Uint8Array<ArrayBuffer>>();
  const writes: { key: string; contentType: string }[] = [];
  const store = {
    size: async (key: string) => objects.get(key)?.byteLength ?? null,
    get: async (key: string) => objects.get(key) ?? null,
    put: vi.fn(async (key: string, body: Uint8Array<ArrayBuffer>, contentType: string) => {
      objects.set(key, body);
      writes.push({ key, contentType });
    }),
    close: vi.fn(async () => {}),
  };
  return { store, objects, writes };
}

describe("retained asset sync", () => {
  it("uploads derived files as JSON before switching the manifest", async () => {
    const directories = await build(A);
    const { store, writes } = bucket();
    await sync(store, directories);
    expect(writes).toContainEqual({
      key: `learners/${A}/85.json`,
      contentType: "application/json",
    });
    expect(writes).toContainEqual({
      key: `breeding/${A}/1.json`,
      contentType: "application/json",
    });
    expect(writes.map(({ key }) => key).sort()).toEqual(
      [
        `_app/immutable/${A}.js`,
        "data/manifest.json",
        `data/revisions/${A}/reference.json`,
        `learners/${A}/85.json`,
        `breeding/${A}/1.json`,
      ].sort(),
    );
    expect(writes.at(-1)?.key).toBe("data/manifest.json");
  });

  it("retains earlier derived and app assets across a deployment with a different revision", async () => {
    const { store, objects, writes } = bucket();
    await sync(store, await build(A));
    const oldLearner = objects.get(`learners/${A}/85.json`);
    const oldBreeding = objects.get(`breeding/${A}/1.json`);
    writes.length = 0;
    await sync(store, await build(B));
    expect(objects.get(`learners/${A}/85.json`)).toBe(oldLearner);
    expect(objects.get(`breeding/${A}/1.json`)).toBe(oldBreeding);
    expect(objects.has(`breeding/${B}/1.json`)).toBe(true);
    expect(objects.has(`_app/immutable/${A}.js`)).toBe(true);
    expect(objects.has(`learners/${B}/85.json`)).toBe(true);
    expect(writes.some(({ key }) => key.includes(A))).toBe(false);
    expect(writes.at(-1)?.key).toBe("data/manifest.json");
    expect(JSON.parse(new TextDecoder().decode(objects.get("data/manifest.json")))).toEqual({
      datasetRevision: B,
    });
  });

  it("skips identical immutable derived files rather than overwriting them", async () => {
    const directories = await build(A);
    const { store, writes } = bucket();
    await sync(store, directories);
    writes.length = 0;
    await sync(store, directories);
    expect(writes).toEqual([{ key: "data/manifest.json", contentType: "application/json" }]);
  });

  it.each(["learners", "breeding"] as const)(
    "refuses conflicting immutable %s without publishing the manifest",
    async (prefix) => {
      const directories = await build(A);
      const { store, objects, writes } = bucket();
      const oldBody = new TextEncoder().encode("previous immutable content");
      const key = `${prefix}/${A}/${prefix === "learners" ? 85 : 1}.json`;
      objects.set(key, oldBody);
      await expect(sync(store, directories)).rejects.toThrow("refusing to overwrite");
      expect(objects.get(key)).toBe(oldBody);
      expect(writes.some(({ key }) => key === "data/manifest.json")).toBe(false);
    },
  );

  it.each(["learners", "breeding"] as const)(
    "does not publish the manifest when %s upload fails",
    async (prefix) => {
      const directories = await build(A);
      const { store, writes } = bucket();
      store.put.mockImplementation(async (key, _body, contentType) => {
        if (key.startsWith(`${prefix}/`)) throw new Error("derived upload failed");
        writes.push({ key, contentType });
      });
      await expect(sync(store, directories)).rejects.toThrow("derived upload failed");
      expect(writes.some(({ key }) => key === "data/manifest.json")).toBe(false);
    },
  );

  it.each(
    (["learners", "breeding"] as const).flatMap((prefix) =>
      ["085.json", "0.json", "85.js", "extra/85.json"].map((name) => ({ prefix, name })),
    ),
  )("rejects invalid $prefix upload paths: $name", async ({ prefix, name }) => {
    const directories = await build(A);
    const path = join(directories[prefix], A, name);
    if (name.includes("/")) await mkdir(join(directories[prefix], A, "extra"));
    await writeFile(path, "{}");
    const { store, writes } = bucket();
    await expect(sync(store, directories)).rejects.toThrow("Invalid immutable derived asset");
    expect(writes).toEqual([]);
  });

  it.each(["learners", "breeding"])(
    "gives current static %s assets immutable cache policy",
    async (prefix) => {
      const headers = await readFile(new URL("../static/_headers", import.meta.url), "utf8");
      expect(headers).toMatch(
        new RegExp(`/${prefix}/\\*\\r?\\n\\s+Cache-Control: public, max-age=31536000, immutable`),
      );
    },
  );

  it("rejects same-size breeding content changes instead of silently keeping stale data", async () => {
    const directories = await build(A);
    const { store, objects, writes } = bucket();
    const key = `breeding/${A}/1.json`;
    const oldBody = new TextEncoder().encode('{"speciesId":2}');
    objects.set(key, oldBody);
    await expect(sync(store, directories)).rejects.toThrow("refusing to overwrite");
    expect(objects.get(key)).toBe(oldBody);
    expect(writes.some(({ key }) => key === "data/manifest.json")).toBe(false);
  });
});

describe("withRetry", () => {
  it("retries transient failures and returns the eventual result", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const run = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("get: Unspecified error (0)"))
      .mockResolvedValueOnce("ok");
    await expect(withRetry("get key", run, 3, 0)).resolves.toBe("ok");
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("rethrows the last error once attempts are exhausted", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const run = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("boom"));
    await expect(withRetry("get key", run, 3, 0)).rejects.toThrow("boom");
    expect(run).toHaveBeenCalledTimes(3);
  });
});
