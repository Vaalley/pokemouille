import { describe, expect, it } from "vite-plus/test";
import type { Encounter, NamedResource } from "../../../../../packages/pokemon-data/src/index.ts";
import { resolveEncounters } from "./encounters.ts";

function resource(id: number, identifier: string): NamedResource {
  return { id, identifier, names: [{ languageId: 9, name: identifier }] };
}

function encounter(id: number, versionId = 1): Encounter {
  return {
    id,
    versionId,
    location: { ...resource(1, "route-1"), regionId: 1 },
    area: resource(1, "route-1-area"),
    method: resource(1, "walk"),
    minLevel: 2,
    maxLevel: 4,
    slot: { id, versionGroupId: 1, slot: id, rarity: 20 },
    conditions: [],
    sourceCounts: { conditions: 0 },
  };
}

const references = {
  versions: [
    { id: 1, identifier: "red", versionGroupId: 1, names: [] },
    { id: 2, identifier: "blue", versionGroupId: 1, names: [] },
    { id: 3, identifier: "scarlet", versionGroupId: 25, names: [] },
  ],
  encounterCoverage: [
    { versionId: 1, rows: 100 },
    { versionId: 2, rows: 100 },
    { versionId: 3, rows: 0 },
  ],
};
const pokemon = { pokemonId: 25, status: "available" as const };

function variety(id: number, encounters: Encounter[]) {
  return { id, identifier: `variety-${id}`, encounters };
}

describe("resolveEncounters", () => {
  it("uses the exact version, never another version in the same group", () => {
    const varieties = [variety(25, [encounter(1), encounter(2, 2)])];
    const result = resolveEncounters({ varieties, pokemon, version: "blue", references });
    expect(result.status).toBe("rows");
    expect(result.groups.flatMap((group) => group.rows.map((row) => row.id))).toEqual([2]);
    expect(resolveEncounters({ varieties, pokemon, version: "red-blue", references }).status).toBe(
      "coverage-unknown",
    );
  });

  it("never borrows another variety's encounters or falls back to the default variety", () => {
    const varieties = [variety(25, [encounter(1)]), variety(10025, [encounter(2)])];
    const result = resolveEncounters({
      varieties,
      pokemon: { ...pokemon, pokemonId: 10025 },
      version: "red",
      references,
    });
    expect(result.variety?.id).toBe(10025);
    expect(result.groups.flatMap((group) => group.rows.map((row) => row.id))).toEqual([2]);
    expect(
      resolveEncounters({
        varieties,
        pokemon: { ...pokemon, pokemonId: 999 },
        version: "red",
        references,
      }).status,
    ).toBe("variety-unknown");
  });

  it("keeps conditional and overlapping slots separate without aggregating rarity", () => {
    const morning = encounter(1);
    morning.conditions = [
      { ...resource(1, "morning"), condition: resource(1, "time"), isDefault: false },
    ];
    morning.sourceCounts.conditions = 1;
    const swarm = encounter(2);
    swarm.conditions = [
      { ...resource(2, "swarm-no"), condition: resource(2, "swarm"), isDefault: true },
      { ...resource(3, "winter"), condition: resource(3, "season"), isDefault: false },
    ];
    swarm.sourceCounts.conditions = 2;
    const result = resolveEncounters({
      varieties: [variety(25, [morning, swarm])],
      pokemon,
      version: "red",
      references,
    });
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.rows).toEqual([morning, swarm]);
    expect(result.groups[0]?.rows.map((row) => row.slot.rarity)).toEqual([20, 20]);
    expect(result.groups[0]?.rows[1]?.conditions.map((condition) => condition.isDefault)).toEqual([
      true,
      false,
    ]);
  });

  it("groups only matching locations, areas and methods, preserving level ranges", () => {
    const first = encounter(1);
    const cave = { ...encounter(2), area: resource(2, "basement"), minLevel: 8, maxLevel: 10 };
    const fishing = { ...encounter(3), method: resource(2, "old-rod") };
    const result = resolveEncounters({
      varieties: [variety(25, [first, cave, fishing])],
      pokemon,
      version: "red",
      references,
    });
    expect(result.groups).toHaveLength(3);
    expect(result.groups.flatMap((group) => group.rows)).toContainEqual(cave);
  });

  it("distinguishes zero global source rows, missing coverage, and no rows for this variety", () => {
    const varieties = [variety(25, [])];
    expect(resolveEncounters({ varieties, pokemon, version: "scarlet", references }).status).toBe(
      "game-empty",
    );
    expect(resolveEncounters({ varieties, pokemon, version: "red", references }).status).toBe(
      "variety-empty",
    );
    expect(
      resolveEncounters({
        varieties,
        pokemon,
        version: "red",
        references: { ...references, encounterCoverage: [] },
      }).status,
    ).toBe("coverage-unknown");
    const populated = resolveEncounters({
      varieties: [variety(25, [encounter(1)])],
      pokemon,
      version: "red",
      references: { ...references, encounterCoverage: [] },
    });
    expect(populated.status).toBe("rows");
  });

  it("does not present encounters as applicable to not-introduced or unknown forms", () => {
    const varieties = [variety(25, [encounter(1)])];
    for (const status of ["not-introduced", "unknown"] as const) {
      const result = resolveEncounters({
        varieties,
        pokemon: { ...pokemon, status },
        version: "red",
        references,
      });
      expect(result.status).toBe(status);
      expect(result.groups).toEqual([]);
    }
  });
});
