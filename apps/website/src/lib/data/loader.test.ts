import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type * as LoaderModule from "./loader.ts";

vi.mock("$app/env", () => ({ browser: false }));
vi.mock("$app/paths", () => ({ asset: (path: string) => `/${path}` }));

// Dynamic import is required: module-level state (pinned manifest, promise caches) must be
// fresh per test, so the module is re-evaluated after vi.resetModules().
let loader: typeof LoaderModule;
beforeEach(async () => {
  vi.resetModules();
  loader = await import("./loader.ts");
});

const MANIFEST = "/data/manifest.json";

function manifest(revision: string) {
  const asset = (path: string) => ({ path: `${revision}/${path}`, sha256: "", bytes: 0 });
  return {
    datasetRevision: revision,
    files: {
      references: asset("references.json"),
      pokemonReferences: asset("pokemon-references.json"),
      searchReferences: asset("search/references.json"),
      games: asset("games.json"),
      search: { en: asset("search/en.json") },
      pokemon: { "25": asset("pokemon/25.json"), "26": asset("pokemon/26.json") },
      evolution: {},
    },
  };
}

const json = (value: unknown) => new Response(JSON.stringify(value));
const species = (id: number) => json({ id, varieties: [] });

const referenceAssets = [
  {
    load: "getPokemonReferences" as const,
    path: "pokemon-references.json",
    value: { versions: [], versionGroups: [], moves: [], items: [] },
  },
  {
    load: "getSearchReferences" as const,
    path: "search/references.json",
    value: { moves: [], abilities: [], items: [] },
  },
];

/** Fake static host: each route answers a request; unknown URLs are 404. */
function host(routes: Record<string, () => Response | Promise<Response>>) {
  const calls: string[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(url);
    const route = routes[url];
    return route ? route() : new Response(null, { status: 404 });
  }) as typeof fetch;
  return { fetchImpl, count: (url: string) => calls.filter((call) => call === url).length };
}

describe("snapshot loader", () => {
  it("shares one in-flight fetch between concurrent identical requests", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { fetchImpl, count } = host({
      [MANIFEST]: () => json(manifest("a")),
      "/data/a/pokemon/25.json": async () => {
        await gate;
        return species(25);
      },
    });
    const first = loader.getSpecies(25, fetchImpl);
    const second = loader.getSpecies(25, fetchImpl);
    await vi.waitFor(() => expect(count("/data/a/pokemon/25.json")).toBe(1));
    release();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    expect(count(MANIFEST)).toBe(1);
    expect(count("/data/a/pokemon/25.json")).toBe(1);
  });

  it("evicts a rejected asset load so a retry fetches again", async () => {
    let attempts = 0;
    const { fetchImpl, count } = host({
      [MANIFEST]: () => json(manifest("a")),
      "/data/a/pokemon/25.json": () =>
        ++attempts === 1 ? new Response(null, { status: 503 }) : species(25),
    });
    await expect(loader.getSpecies(25, fetchImpl)).rejects.toMatchObject({ kind: "network" });
    await expect(loader.getSpecies(25, fetchImpl)).resolves.toMatchObject({ id: 25 });
    expect(count("/data/a/pokemon/25.json")).toBe(2);
    expect(count(MANIFEST)).toBe(1);
  });

  it("does not pin a failed manifest load", async () => {
    let attempts = 0;
    const { fetchImpl, count } = host({
      [MANIFEST]: () => {
        if (++attempts === 1) throw new TypeError("offline");
        return json(manifest("a"));
      },
    });
    await expect(loader.getManifest(fetchImpl)).rejects.toMatchObject({ kind: "network" });
    await expect(loader.getManifest(fetchImpl)).resolves.toMatchObject({ datasetRevision: "a" });
    expect(count(MANIFEST)).toBe(2);
  });

  it("keeps loading assets from the first successful manifest's revision", async () => {
    let revision = "a";
    const { fetchImpl, count } = host({
      [MANIFEST]: () => json(manifest(revision)),
      "/data/a/pokemon/25.json": () => species(25),
      "/data/a/pokemon/26.json": () => species(26),
      "/data/b/pokemon/26.json": () => species(26),
    });
    await loader.getSpecies(25, fetchImpl);
    revision = "b";
    await expect(loader.getSpecies(26, fetchImpl)).resolves.toMatchObject({ id: 26 });
    await expect(loader.getManifest(fetchImpl)).resolves.toMatchObject({ datasetRevision: "a" });
    expect(count("/data/a/pokemon/26.json")).toBe(1);
    expect(count("/data/b/pokemon/26.json")).toBe(0);
    expect(count(MANIFEST)).toBe(1);
  });

  it("loads games from their own asset without fetching references", async () => {
    const games = [{ version: { identifier: "scarlet" } }];
    const { fetchImpl, count } = host({
      [MANIFEST]: () => json(manifest("a")),
      "/data/a/games.json": () => json(games),
    });
    await expect(loader.getGames(fetchImpl)).resolves.toEqual(games);
    await loader.getGames(fetchImpl);
    expect(count("/data/a/games.json")).toBe(1);
    expect(count("/data/a/references.json")).toBe(0);
  });

  it.each(["games", "pokemonReferences", "searchReferences"] as const)(
    "rejects a manifest without a %s asset",
    async (file) => {
      const { files, ...rest } = manifest("a");
      const { [file]: _, ...withoutAsset } = files;
      const { fetchImpl } = host({ [MANIFEST]: () => json({ ...rest, files: withoutAsset }) });
      await expect(loader.getManifest(fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
    },
  );

  describe.each(referenceAssets)("$load", ({ load, path, value }) => {
    it("shares its compact asset between concurrent loads without fetching full references", async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const url = `/data/a/${path}`;
      const { fetchImpl, count } = host({
        [MANIFEST]: () => json(manifest("a")),
        [url]: async () => {
          await gate;
          return json(value);
        },
      });
      const first = loader[load](fetchImpl);
      const second = loader[load](fetchImpl);
      await vi.waitFor(() => expect(count(url)).toBe(1));
      release();
      const [a, b] = await Promise.all([first, second]);
      expect(a).toEqual(value);
      expect(a).toBe(b);
      expect(await loader[load](fetchImpl)).toBe(a);
      expect(count(url)).toBe(1);
      expect(count(MANIFEST)).toBe(1);
      expect(count("/data/a/references.json")).toBe(0);
    });

    it("retries an invalid compact asset without replacing the pinned manifest", async () => {
      let revision = "a";
      let attempts = 0;
      const url = `/data/a/${path}`;
      const { fetchImpl, count } = host({
        [MANIFEST]: () => json(manifest(revision)),
        [url]: () => json(++attempts === 1 ? {} : value),
        [`/data/b/${path}`]: () => json(value),
      });
      await expect(loader[load](fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
      revision = "b";
      await expect(loader[load](fetchImpl)).resolves.toEqual(value);
      expect(count(url)).toBe(2);
      expect(count(`/data/b/${path}`)).toBe(0);
      expect(count(MANIFEST)).toBe(1);
    });
  });
});
