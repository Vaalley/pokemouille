import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { fixture } from "../../../../../packages/pokemon-data/tests/fixtures.ts";
import type * as LoaderModule from "./loader.ts";
import type * as PokemonModule from "./pokemon.ts";

vi.mock("$app/paths", () => ({ asset: (path: string) => `/${path}` }));

let loader: typeof LoaderModule;
let pokemon: typeof PokemonModule;
beforeEach(async () => {
  vi.stubEnv("DATASET_REVISION", "revision");
  // Re-import after resetModules so each test gets fresh promise caches.
  vi.resetModules();
  loader = await import("./loader.ts");
  pokemon = await import("./pokemon.ts");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const json = (value: unknown) => new Response(JSON.stringify(value));

function pokemonReferences(references = fixture().references) {
  return {
    ...references,
    moves: references.moves.map(
      ({ id, identifier, names, typeId, damageClassId, power, accuracy, pp, priority }) => ({
        id,
        identifier,
        names,
        typeId,
        damageClassId,
        power,
        accuracy,
        pp,
        priority,
      }),
    ),
    items: references.items.map(({ id, identifier, names }) => ({
      id,
      identifier,
      names,
    })),
  };
}

function snapshotHost(overrides: Record<string, () => Response | Promise<Response>> = {}) {
  const input = fixture();
  const routes: Record<string, () => Response | Promise<Response>> = {
    "/data/revisions/revision/pokemon/25.json": () => json(input.species[0]),
    "/data/revisions/revision/pokemon-references.json": () =>
      json(pokemonReferences(input.references)),
    ...overrides,
  };
  return (async (request: RequestInfo | URL) => {
    const path =
      typeof request === "string" ? request : request instanceof URL ? request.href : request.url;
    return routes[path]?.() ?? new Response(null, { status: 404 });
  }) as typeof fetch;
}

function context(version: string) {
  return {
    language: "en",
    version,
    form: null,
    versionSource: "url",
    rejectedVersion: null,
  } as const;
}

describe("Pokémon section readiness", () => {
  it("keeps game-specific details available when a delayed evolution request fails, and retries only that section", async () => {
    const gate = Promise.withResolvers<void>();
    let attempts = 0;
    const chain = { chainId: 10, applicability: "unresolved", nodes: [] };
    const fetchImpl = snapshotHost({
      "/data/revisions/revision/evolution/10.json": async () => {
        if (++attempts === 1) {
          await gate.promise;
          return new Response(null, { status: 503 });
        }
        return json(chain);
      },
    });
    const evolution = loader.getEvolutionChain(10, fetchImpl);
    const rejected = expect(evolution).rejects.toMatchObject({ kind: "network" });
    const data = await pokemon.loadPokemonData(25, fetchImpl);
    const red = pokemon.resolvePokemonView(data, context("red")).pokemon;
    expect(red.learnset).toMatchObject({ status: "available", value: [{ moveId: 98, level: 16 }] });
    const yellow = pokemon.resolvePokemonView(data, context("yellow")).pokemon;
    expect(yellow.learnset).toMatchObject({
      status: "available",
      value: [
        { moveId: 98, level: 11 },
        { moveId: 85, level: 26 },
      ],
    });
    gate.resolve();
    await rejected;
    await expect(loader.getEvolutionChain(10, fetchImpl)).resolves.toEqual(chain);
    expect(pokemon.resolvePokemonView(data, context("red")).pokemon.learnset).toEqual(red.learnset);
  });

  it("finishes evolution while references are still downloading", async () => {
    const gate = Promise.withResolvers<void>();
    const input = fixture();
    const chain = { chainId: 10, applicability: "unresolved", nodes: [] };
    const fetchImpl = snapshotHost({
      "/data/revisions/revision/pokemon-references.json": async () => {
        await gate.promise;
        return json(pokemonReferences(input.references));
      },
      "/data/revisions/revision/evolution/10.json": () => json(chain),
    });
    const data = pokemon.loadPokemonData(25, fetchImpl);
    await expect(loader.getEvolutionChain(10, fetchImpl)).resolves.toEqual(chain);
    gate.resolve();
    const loaded = await data;
    expect(() =>
      pokemon.resolvePokemonView(loaded, { ...context("red"), form: "unrelated-form" }),
    ).toThrow('Unknown form "unrelated-form" for species 25');
  });
});
