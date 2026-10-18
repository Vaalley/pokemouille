import { describe, expect, it } from "vite-plus/test";
import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";
import {
  filterLocations,
  groupLocationsByRegion,
  locationFilterUrl,
  prepareLocations,
  selectLocationEncounters,
  type LocalizedResource,
  type LocationEncounterData,
  type LocationEncounterRow,
  type LocationSummary,
} from "./location-encounters.ts";

function resource(id: number, identifier: string): LocalizedResource {
  return {
    id,
    identifier,
    name: localize([{ languageId: 9, name: identifier }], "en", identifier),
  };
}

function row(id: number, overrides: Partial<LocationEncounterRow> = {}): LocationEncounterRow {
  return {
    id,
    versionId: 1,
    areaId: 1,
    methodId: 1,
    pokemonId: 25,
    minLevel: 3,
    maxLevel: 5,
    slot: { id, versionGroupId: 1, slot: id, rarity: 20 },
    conditionIds: [],
    incompleteConditions: false,
    ...overrides,
  };
}

function locationData(rows: LocationEncounterRow[]): LocationEncounterData {
  return {
    location: resource(1, "viridian-forest"),
    region: resource(1, "kanto"),
    areas: [resource(1, "forest"), resource(2, "clearing")],
    methods: [resource(1, "walk"), resource(2, "headbutt")],
    conditions: [
      { ...resource(1, "swarm-no"), isDefault: true, condition: resource(1, "swarm") },
      { ...resource(2, "night"), isDefault: false, condition: resource(2, "time") },
    ],
    pokemon: [
      {
        speciesId: 25,
        pokemonId: 25,
        variety: "pikachu",
        form: null,
        name: resource(25, "Pikachu").name,
      },
      {
        speciesId: 25,
        pokemonId: 10025,
        variety: "pikachu-rock-star",
        form: "pikachu-rock-star",
        name: resource(10025, "Rock Star").name,
      },
    ],
    rows,
    encounterCoverage: [
      { versionId: 1, rows: 100 },
      { versionId: 2, rows: 100 },
      { versionId: 40, rows: 0 },
    ],
  };
}

describe("selectLocationEncounters", () => {
  it("selects the exact version without using the slot's version group as applicability", () => {
    const data = locationData([row(1), row(2, { versionId: 2 }), row(3, { versionId: 3 })]);
    const selected = selectLocationEncounters(data, 3);
    expect(selected.status).toBe("rows");
    expect(selected.areas[0]?.methods[0]?.rows.map(({ row }) => row.id)).toEqual([3]);
    expect(selected.versionIds).toEqual([1, 2, 3]);
  });

  it("keeps overlapping slots, rarity, levels and condition default flags independent", () => {
    const first = row(1, { conditionIds: [1, 2], incompleteConditions: true });
    const second = row(2, {
      minLevel: 8,
      maxLevel: 8,
      slot: { id: 20, versionGroupId: 1, slot: null, rarity: 20 },
    });
    const data = locationData([first, second]);
    const selected = selectLocationEncounters(data, 1).areas[0]!.methods[0]!.rows;
    expect(selected.map(({ row }) => row)).toEqual([first, second]);
    expect(selected.map(({ row }) => row.slot.rarity)).toEqual([20, 20]);
    expect(selected[0]?.conditions.map((condition) => condition.isDefault)).toEqual([true, false]);
    expect(selected[0]?.row.incompleteConditions).toBe(true);
    expect(selected[1]?.conditions).toEqual([]);
    expect(selected[1]?.row.slot.slot).toBeNull();
  });

  it("groups by area then method and retains separate variety identities and form links", () => {
    const data = locationData([
      row(1, { areaId: 2, methodId: 2 }),
      row(2, { methodId: 2, pokemonId: 10025 }),
      row(3),
    ]);
    const selected = selectLocationEncounters(data, 1);
    expect(selected.areas.map(({ area }) => area.id)).toEqual([1, 2]);
    expect(selected.areas[0]?.methods.map(({ method }) => method.id)).toEqual([1, 2]);
    expect(selected.areas[0]?.methods[1]?.rows[0]?.pokemon).toMatchObject({
      speciesId: 25,
      pokemonId: 10025,
      variety: "pikachu-rock-star",
      form: "pikachu-rock-star",
    });
    expect(selected.areas[0]?.methods[0]?.rows[0]?.pokemon.form).toBeNull();
  });

  it("distinguishes a covered game's empty location from globally empty and unknown games", () => {
    const data = locationData([row(1)]);
    expect(selectLocationEncounters(data, 2)).toMatchObject({
      status: "location-empty",
      areas: [],
      versionIds: [1],
    });
    expect(selectLocationEncounters(data, 40).status).toBe("game-empty");
    expect(selectLocationEncounters(data, 999).status).toBe("coverage-unknown");
    expect(selectLocationEncounters({ ...data, encounterCoverage: [] }, 1).status).toBe("rows");
  });
});

function summary(id: number, identifier: string, regionId: number | null): LocationSummary {
  return {
    ...resource(id, identifier),
    englishName: identifier,
    regionId,
  };
}

describe("location catalogue", () => {
  it("groups by recorded region IDs, preserving source region order and an explicit null group", () => {
    const entries = [
      summary(1, "kanto-looking-name-but-no-region", null),
      summary(2, "forest", 2),
      summary(3, "cave", 1),
      summary(4, "mountain", 2),
      summary(5, "unknown-region", 99),
    ];
    const groups = groupLocationsByRegion(entries, [resource(2, "johto"), resource(1, "kanto")]);
    expect(groups.map((group) => group.regionId)).toEqual([2, 1, 99, null]);
    expect(groups[0]?.locations.map((location) => location.id)).toEqual([2, 4]);
    expect(groups[2]?.region).toBeNull();
    expect(groups[3]?.locations.map((location) => location.id)).toEqual([1]);
    expect(groupLocationsByRegion([], [resource(1, "kanto")])).toEqual([]);
  });

  it("filters localized, English and canonical names with shared accent normalization", () => {
    const location = {
      ...summary(1, "viridian-forest", 1),
      name: localize([{ languageId: 5, name: "Forêt de Jade" }], "fr", "viridian-forest"),
      englishName: "Viridian Forest",
    };
    const prepared = prepareLocations([location, summary(2, "route-1", 1)]);
    for (const query of ["foret", "FORÊT", "Jade", "viridian forest", "viridian-forest"]) {
      expect(filterLocations(prepared, query).map((entry) => entry.id)).toEqual([1]);
    }
    expect(filterLocations(prepared, "")).toHaveLength(2);
    expect(filterLocations(prepared, "not recorded")).toEqual([]);
  });

  it("updates the name filter without losing the selected game or mutating the source URL", () => {
    const original = new URL(
      "https://example.test/fr/location/?version=yellow&form=pikachu-rock-star&q=old#locations",
    );
    const filtered = locationFilterUrl(original, "Forêt de Jade");
    expect(filtered.searchParams.get("version")).toBe("yellow");
    expect(filtered.searchParams.get("q")).toBe("Forêt de Jade");
    expect(filtered.searchParams.has("form")).toBe(false);
    expect(filtered.hash).toBe("#locations");
    expect(original.searchParams.get("q")).toBe("old");
    expect(locationFilterUrl(filtered, "").searchParams.has("q")).toBe(false);
  });
});
