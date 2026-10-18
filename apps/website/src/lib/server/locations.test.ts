import { describe, expect, it } from "vite-plus/test";
import type { Encounter, NamedResource } from "../../../../../packages/pokemon-data/src/index.ts";
import { fixture } from "../../../../../packages/pokemon-data/tests/fixtures.ts";
import {
  indexSpeciesEncounters,
  projectLocationCatalogue,
  projectLocationPage,
  sortLocationRows,
  type IndexedLocation,
} from "./locations.ts";

function resource(id: number, identifier: string): NamedResource {
  return { id, identifier, names: [{ languageId: 9, name: identifier }] };
}

function encounter(id: number, overrides: Partial<Encounter> = {}): Encounter {
  return {
    id,
    versionId: 1,
    location: { ...resource(1, "viridian-forest"), regionId: 1 },
    area: resource(10, "forest-area"),
    method: resource(1, "walk"),
    minLevel: 3,
    maxLevel: 5,
    slot: { id: 10, versionGroupId: 1, slot: 1, rarity: 20 },
    conditions: [],
    sourceCounts: { conditions: 0 },
    ...overrides,
  };
}

describe("location encounter inversion", () => {
  it("inverts each variety's exact-version rows once, without splitting cosmetic forms or summing slots", () => {
    const record = fixture().species[0]!;
    const variety = record.varieties[0]!;
    const form = variety.forms[0]!;
    variety.forms.push({ ...form, id: 10001, identifier: "pikachu-cosmetic", isDefault: false });
    variety.encounters = [
      encounter(1, {
        conditions: [
          { ...resource(3, "swarm-no"), isDefault: true, condition: resource(1, "swarm") },
        ],
        sourceCounts: { conditions: 2 },
      }),
      encounter(2, { versionId: 3, minLevel: 8, maxLevel: 8 }),
    ];
    record.varieties.push({
      ...variety,
      id: 10025,
      identifier: "pikachu-rock-star",
      isDefault: false,
      forms: [{ ...form, id: 10025, identifier: "pikachu-rock-star" }],
      encounters: [encounter(3)],
    });
    const index = new Map<number, IndexedLocation>();
    indexSpeciesEncounters(index, record);
    const entry = index.get(1)!;
    sortLocationRows(entry);
    const page = projectLocationPage(
      entry,
      [resource(1, "kanto")],
      [{ versionId: 1, rows: 100 }],
      "en",
    );
    expect(index.size).toBe(1);
    expect(page.rows.map((row) => row.id)).toEqual([1, 3, 2]);
    expect(page.rows.map((row) => row.slot.rarity)).toEqual([20, 20, 20]);
    expect(page.rows[0]).toMatchObject({
      versionId: 1,
      areaId: 10,
      methodId: 1,
      pokemonId: 25,
      minLevel: 3,
      maxLevel: 5,
      conditionIds: [3],
      incompleteConditions: true,
    });
    expect(page.rows[2]).toMatchObject({
      versionId: 3,
      minLevel: 8,
      maxLevel: 8,
      slot: { versionGroupId: 1 },
    });
    expect(page.conditions[0]).toMatchObject({ id: 3, isDefault: true, condition: { id: 1 } });
    expect(page.pokemon.map((pokemon) => [pokemon.pokemonId, pokemon.form])).toEqual([
      [25, null],
      [10025, "pikachu-rock-star"],
    ]);
    expect(page.areas).toHaveLength(1);
    expect(page.methods).toHaveLength(1);
    expect(page.region?.identifier).toBe("kanto");
  });

  it("keeps region null explicitly unrecorded and localizes source region/location names", () => {
    const record = fixture().species[0]!;
    const location = {
      ...resource(1, "viridian-forest"),
      names: [
        { languageId: 9, name: "Viridian Forest" },
        { languageId: 5, name: "Forêt de Jade" },
      ],
      regionId: 1,
    };
    record.varieties[0]!.encounters = [
      encounter(1, { location }),
      encounter(2, { location: { ...resource(2, "kanto-unknown"), regionId: null } }),
    ];
    const index = new Map<number, IndexedLocation>();
    indexSpeciesEncounters(index, record);
    const regions = [{ ...resource(1, "kanto"), names: [{ languageId: 5, name: "Kanto (FR)" }] }];
    const catalogue = projectLocationCatalogue(index.values(), regions, "fr");
    expect(catalogue.locations.find((entry) => entry.id === 1)).toMatchObject({
      name: { text: "Forêt de Jade", fallback: false },
      englishName: "Viridian Forest",
      regionId: 1,
    });
    expect(catalogue.locations.find((entry) => entry.id === 2)?.regionId).toBeNull();
    expect(catalogue.regions[0]?.name.text).toBe("Kanto (FR)");
    expect(projectLocationPage(index.get(2)!, regions, [], "fr").region).toBeNull();
    expect(projectLocationPage(index.get(1)!, [], [], "fr").region?.name.text).toBe("1");
  });

  it("sorts projection identities and slot rows independently of species read completion order", () => {
    const first = fixture().species[0]!;
    first.varieties[0]!.encounters = [encounter(20), encounter(10)];
    const second = structuredClone(first);
    second.id = 26;
    second.identifier = "raichu";
    second.varieties[0]!.id = 26;
    second.varieties[0]!.encounters = [encounter(30)];
    const forward = new Map<number, IndexedLocation>();
    const reverse = new Map<number, IndexedLocation>();
    for (const record of [first, second]) indexSpeciesEncounters(forward, record);
    for (const record of [second, first]) indexSpeciesEncounters(reverse, record);
    sortLocationRows(forward.get(1)!);
    sortLocationRows(reverse.get(1)!);
    expect(projectLocationPage(reverse.get(1)!, [], [], "ja")).toEqual(
      projectLocationPage(forward.get(1)!, [], [], "ja"),
    );
    expect(forward.get(1)?.rows.map((row) => row.id)).toEqual([10, 20, 30]);
  });

  it("does not list locations for varieties without source rows", () => {
    const index = new Map<number, IndexedLocation>();
    indexSpeciesEncounters(index, fixture().species[0]!);
    expect(projectLocationCatalogue(index.values(), [], "en")).toEqual({
      locations: [],
      regions: [],
    });
  });
});
