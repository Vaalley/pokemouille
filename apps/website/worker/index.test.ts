import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import worker from "./index.ts";

const REVISION = "a".repeat(64);
const LEARNER = `learners/${REVISION}/85.json`;
const BREEDING = `breeding/${REVISION}/1.json`;
const IMMUTABLE = "public, max-age=31536000, immutable";

function object(key: string, body = '{"moveId":85}'): R2ObjectBody {
  const response = new Response(body);
  if (!response.body) throw new Error("Fixture body is missing");
  return {
    key,
    version: "1",
    size: body.length,
    etag: "learner-etag",
    httpEtag: '"learner-etag"',
    uploaded: new Date(0),
    storageClass: "Standard",
    checksums: { toJSON: () => ({}) },
    body: response.body,
    get bodyUsed() {
      return response.bodyUsed;
    },
    arrayBuffer: () => response.arrayBuffer(),
    bytes: async () => new Uint8Array(await response.arrayBuffer()),
    text: () => response.text(),
    json: () => response.json(),
    blob: () => response.blob(),
    writeHttpMetadata: (headers) => headers.set("content-type", "application/json"),
  };
}

function host(key = LEARNER, body = '{"moveId":85}') {
  const get = vi.fn<R2Bucket["get"]>().mockResolvedValue(object(key, body));
  const assets = vi
    .fn<Fetcher["fetch"]>()
    .mockResolvedValue(new Response("static", { status: 404 }));
  const match = vi
    .fn<(request: Request) => Promise<Response | undefined>>()
    .mockResolvedValue(undefined);
  const put = vi.fn<(request: Request, response: Response) => Promise<void>>().mockResolvedValue();
  const pending: Promise<unknown>[] = [];
  const waitUntil = vi.fn((promise: Promise<unknown>) => {
    pending.push(promise);
  });
  vi.stubGlobal("caches", { default: { match, put } });
  return {
    get,
    assets,
    match,
    put,
    waitUntil,
    pending,
    fetch: (path: string, init?: RequestInit) =>
      worker.fetch(
        new Request(`https://example.test/${path}`, init),
        { DATA: { get }, ASSETS: { fetch: assets } },
        { waitUntil },
      ),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe.each([
  { key: LEARNER, prefix: "learners", body: '{"moveId":85}', payload: { moveId: 85 } },
  { key: BREEDING, prefix: "breeding", body: '{"speciesId":1}', payload: { speciesId: 1 } },
])("retained $prefix assets", ({ key, prefix, body, payload }) => {
  it("serves an old revision from R2 when the new deployment has no static match", async () => {
    const server = host(key, body);
    const response = await server.fetch(key);
    await Promise.all(server.pending);
    expect(server.assets).not.toHaveBeenCalled();
    expect(server.get).toHaveBeenCalledWith(key, { onlyIf: expect.any(Headers) });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(IMMUTABLE);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("etag")).toBe('"learner-etag"');
    expect(await response.json()).toEqual(payload);
    expect(server.put).toHaveBeenCalledOnce();
    expect(server.waitUntil).toHaveBeenCalledOnce();
  });

  it("reuses cached derived responses without an R2 read", async () => {
    const server = host();
    const cached = new Response("cached", { headers: { "cache-control": IMMUTABLE } });
    server.match.mockResolvedValue(cached);
    expect(await server.fetch(key)).toBe(cached);
    expect(server.get).not.toHaveBeenCalled();
    expect(server.put).not.toHaveBeenCalled();
  });

  it("answers HEAD without a body or an edge cache write", async () => {
    const server = host();
    const response = await server.fetch(key, { method: "HEAD" });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe(IMMUTABLE);
    expect(server.match).not.toHaveBeenCalled();
    expect(server.put).not.toHaveBeenCalled();
  });

  it("does not cache a missing retained projection", async () => {
    const server = host();
    server.get.mockResolvedValue(null);
    expect((await server.fetch(key)).status).toBe(404);
    expect(server.put).not.toHaveBeenCalled();
  });

  it("leaves the manifest mutable and earlier app chunks immutable", async () => {
    const server = host();
    const manifest = await server.fetch("data/manifest.json");
    expect(manifest.headers.get("cache-control")).toBe("no-cache");
    expect(server.match).not.toHaveBeenCalled();
    expect(server.put).not.toHaveBeenCalled();
    const chunk = await server.fetch("_app/immutable/chunks/old.js");
    expect(chunk.headers.get("cache-control")).toBe(IMMUTABLE);
    expect(server.get).toHaveBeenLastCalledWith("_app/immutable/chunks/old.js", {
      onlyIf: expect.any(Headers),
    });
    await Promise.all(server.pending);
  });

  it.each([
    `${prefix}/${"a".repeat(63)}/85.json`,
    `${prefix}/${"g".repeat(64)}/85.json`,
    `${prefix}/${"A".repeat(64)}/85.json`,
    `${prefix}/${REVISION}/0.json`,
    `${prefix}/${REVISION}/085.json`,
    `${prefix}/${REVISION}/-1.json`,
    `${prefix}/${REVISION}/1.5.json`,
    `${prefix}/${REVISION}/85.json/extra`,
    `${prefix}/${REVISION}/85.js`,
    `${prefix}/${REVISION}/%2e%2e%2fstate.json`,
    `${prefix}/${REVISION}/%5c85.json`,
    `${prefix}/${REVISION}/%252e%252e%252fstate.json`,
    "state/state.tar.gz",
  ])("does not expose invalid or private R2 paths: %s", async (path) => {
    const server = host();
    expect((await server.fetch(path)).status).toBe(404);
    expect(server.get).not.toHaveBeenCalled();
    expect(server.match).not.toHaveBeenCalled();
    expect(server.assets).toHaveBeenCalledOnce();
  });

  it("rejects malformed percent escapes without throwing", async () => {
    const server = host();
    expect((await server.fetch(`${prefix}/${REVISION}/%ZZ.json`)).status).toBe(404);
    expect(server.get).not.toHaveBeenCalled();
  });

  it("never handles writes to retained assets", async () => {
    const server = host();
    await server.fetch(key, { method: "POST" });
    expect(server.get).not.toHaveBeenCalled();
    expect(server.assets).toHaveBeenCalledOnce();
  });
});
