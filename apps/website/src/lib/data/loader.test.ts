import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type * as LoaderModule from "./loader.ts";

vi.mock("$app/paths", () => ({ asset: (path: string) => `/${path}` }));

// Dynamic import is required: module-level promise caches must be fresh per test, so the
// module is re-evaluated after vi.resetModules().
let loader: typeof LoaderModule;
beforeEach(async () => {
  vi.stubEnv("DATASET_REVISION", "a");
  vi.resetModules();
  loader = await import("./loader.ts");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const json = (value: unknown) => new Response(JSON.stringify(value));
const speciesData = (id: number) => ({
  id,
  eggGroupIds: [],
  pokedexNumbers: [],
  sourceCounts: { eggGroupIds: 0, pokedexNumbers: 0 },
  varieties: [],
});
const species = (id: number) => json(speciesData(id));

const referenceAssets = [
  {
    load: "getPokemonReferences" as const,
    path: "pokemon-references.json",
    value: {
      versions: [],
      versionGroups: [],
      moves: [],
      items: [],
      eggGroups: [],
      pokedexes: [],
      regions: [],
      machines: [],
      encounterCoverage: [],
    },
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
  return {
    fetchImpl,
    count: (url: string) => calls.filter((call) => call === url).length,
    calls,
  };
}

describe("snapshot loader", () => {
  it("loads from the built revision without requesting the manifest", async () => {
    const { fetchImpl, calls } = host({ "/data/revisions/a/pokemon/25.json": () => species(25) });
    await expect(loader.getSpecies(25, fetchImpl)).resolves.toMatchObject({ id: 25 });
    expect(calls).toEqual(["/data/revisions/a/pokemon/25.json"]);
  });

  it("fails without fetching when the site was built without a dataset", async () => {
    vi.stubEnv("DATASET_REVISION", "");
    const { fetchImpl, calls } = host({});
    await expect(loader.getGames(fetchImpl)).rejects.toThrow("built without a published dataset");
    expect(calls).toEqual([]);
  });

  it("reports a species missing from the revision as not found", async () => {
    const { fetchImpl } = host({});
    await expect(loader.getSpecies(9999, fetchImpl)).rejects.toMatchObject({ kind: "not-found" });
  });

  it("shares one in-flight fetch between concurrent identical requests", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const { fetchImpl, count } = host({
      "/data/revisions/a/pokemon/25.json": async () => {
        await gate;
        return species(25);
      },
    });
    const first = loader.getSpecies(25, fetchImpl);
    const second = loader.getSpecies(25, fetchImpl);
    await vi.waitFor(() => expect(count("/data/revisions/a/pokemon/25.json")).toBe(1));
    release();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    expect(count("/data/revisions/a/pokemon/25.json")).toBe(1);
  });

  it("evicts a rejected asset load so a retry fetches again", async () => {
    let attempts = 0;
    const { fetchImpl, count } = host({
      "/data/revisions/a/pokemon/25.json": () =>
        ++attempts === 1 ? new Response(null, { status: 503 }) : species(25),
    });
    await expect(loader.getSpecies(25, fetchImpl)).rejects.toMatchObject({ kind: "network" });
    await expect(loader.getSpecies(25, fetchImpl)).resolves.toMatchObject({ id: 25 });
    expect(count("/data/revisions/a/pokemon/25.json")).toBe(2);
  });

  it("loads games from their own asset without fetching references", async () => {
    const games = [{ version: { identifier: "scarlet" } }];
    const { fetchImpl, count } = host({ "/data/revisions/a/games.json": () => json(games) });
    await expect(loader.getGames(fetchImpl)).resolves.toEqual(games);
    await loader.getGames(fetchImpl);
    expect(count("/data/revisions/a/games.json")).toBe(1);
    expect(count("/data/revisions/a/references.json")).toBe(0);
  });

  it("retains nullable move stats and exact machine mappings without loading full references", async () => {
    const value = {
      versions: [],
      versionGroups: [],
      items: [],
      eggGroups: [],
      pokedexes: [],
      regions: [],
      encounterCoverage: [],
      moves: [{ id: 85, damageClassId: 3, power: null, accuracy: null, pp: null, priority: -1 }],
      machines: [{ id: 1, number: 1001, versionGroupId: 20, itemId: 1131, moveId: 85 }],
    };
    const { fetchImpl, count } = host({
      "/data/revisions/a/pokemon-references.json": () => json(value),
    });
    await expect(loader.getPokemonReferences(fetchImpl)).resolves.toEqual(value);
    expect(count("/data/revisions/a/references.json")).toBe(0);
  });

  it("rejects compact references missing machine coverage or move battle columns", async () => {
    const value = {
      versions: [],
      versionGroups: [],
      items: [],
      eggGroups: [],
      pokedexes: [],
      regions: [],
      encounterCoverage: [],
      machines: [],
      moves: [{ id: 85, power: null, accuracy: null, pp: null, priority: 0 }],
    };
    const { fetchImpl } = host({ "/data/revisions/a/pokemon-references.json": () => json(value) });
    await expect(loader.getPokemonReferences(fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
  });

  it("rejects truncated species encounters and retains a truthful counted empty collection", async () => {
    let complete = false;
    const { fetchImpl, count } = host({
      "/data/revisions/a/pokemon/25.json": () =>
        json({
          ...speciesData(25),
          varieties: [
            {
              id: 25,
              cries: { latest: null, legacy: null },
              encounters: [],
              sourceCounts: { encounters: complete ? 0 : 1 },
            },
          ],
        }),
    });
    await expect(loader.getSpecies(25, fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
    complete = true;
    await expect(loader.getSpecies(25, fetchImpl)).resolves.toMatchObject({
      varieties: [{ encounters: [], sourceCounts: { encounters: 0 } }],
    });
    expect(count("/data/revisions/a/pokemon/25.json")).toBe(2);
  });

  it.each(["eggGroups", "pokedexes", "regions"])(
    "rejects schema-2 compact references missing %s",
    async (field) => {
      const value = { ...referenceAssets[0]!.value };
      Reflect.deleteProperty(value, field);
      const { fetchImpl } = host({
        "/data/revisions/a/pokemon-references.json": () => json(value),
      });
      await expect(loader.getPokemonReferences(fetchImpl)).rejects.toMatchObject({
        kind: "invalid",
      });
    },
  );

  it.each(["eggGroupIds", "pokedexNumbers"])(
    "rejects missing or independently truncated species %s",
    async (field) => {
      const value = speciesData(25);
      Reflect.deleteProperty(value, field);
      const { fetchImpl } = host({ "/data/revisions/a/pokemon/25.json": () => json(value) });
      await expect(loader.getSpecies(25, fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
      Reflect.set(value, field, []);
      Reflect.set(value.sourceCounts, field, 1);
      await expect(loader.getSpecies(25, fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
      Reflect.set(value.sourceCounts, field, 0);
      await expect(loader.getSpecies(25, fetchImpl)).resolves.toMatchObject({ id: 25 });
    },
  );

  it("requires both nullable cry URLs and nullable encounter region identity", async () => {
    const variety = {
      cries: { latest: null, legacy: null },
      encounters: [
        {
          id: 1,
          versionId: 1,
          location: { regionId: 1 },
          area: {},
          method: {},
          minLevel: 2,
          maxLevel: 5,
          slot: { rarity: 5, versionGroupId: 1 },
          conditions: [],
          sourceCounts: { conditions: 0 },
        },
      ],
      sourceCounts: { encounters: 1 },
    };
    const value = { ...speciesData(25), varieties: [variety] };
    const { fetchImpl } = host({ "/data/revisions/a/pokemon/25.json": () => json(value) });
    Reflect.deleteProperty(variety.cries, "legacy");
    await expect(loader.getSpecies(25, fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
    Reflect.set(variety.cries, "legacy", null);
    Reflect.deleteProperty(variety.encounters[0]!.location, "regionId");
    await expect(loader.getSpecies(25, fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
    Reflect.set(variety.encounters[0]!.location, "regionId", null);
    await expect(loader.getSpecies(25, fetchImpl)).resolves.toEqual(value);
  });

  describe.each(referenceAssets)("$load", ({ load, path, value }) => {
    it("shares its compact asset between concurrent loads without fetching full references", async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const url = `/data/revisions/a/${path}`;
      const { fetchImpl, count } = host({
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
      expect(count("/data/revisions/a/references.json")).toBe(0);
    });

    it("retries an invalid compact asset", async () => {
      let attempts = 0;
      const url = `/data/revisions/a/${path}`;
      const { fetchImpl, count } = host({ [url]: () => json(++attempts === 1 ? {} : value) });
      await expect(loader[load](fetchImpl)).rejects.toMatchObject({ kind: "invalid" });
      await expect(loader[load](fetchImpl)).resolves.toEqual(value);
      expect(count(url)).toBe(2);
    });
  });
});
