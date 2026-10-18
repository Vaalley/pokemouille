import { describe, expect, it } from "vite-plus/test";
import {
  catalogueFiltersUrl,
  filterResources,
  prepareResources,
  readCatalogueFilters,
} from "./catalogue-filters.ts";
import {
  MOVE_SORTS,
  readMoveSort,
  sortMoves,
  type ResourceCatalogue,
  type ResourceEntry,
} from "./resource-catalogue.ts";

function move(id: number, name: string, values: Partial<ResourceEntry> = {}): ResourceEntry {
  return {
    id,
    identifier: name.toLowerCase(),
    englishName: name,
    name: { text: name, requestedLanguage: "en", sourceLanguageId: 9, fallback: false },
    typeId: 1,
    damageClassId: 2,
    ...values,
  };
}

const rows = [
  move(5, "Variable", { power: null, accuracy: null, pp: null }),
  move(4, "Zero", { power: 0, accuracy: 0, pp: 0 }),
  move(3, "Beta", { power: 80, accuracy: 90, pp: 20 }),
  move(2, "Alpha", { power: 80, accuracy: 100, pp: 10 }),
  move(1, "Alpha", { power: 40, accuracy: 100, pp: 10 }),
  move(6, "Absent"),
];
const ids = (entries: ResourceEntry[]) => entries.map((entry) => entry.id);

describe("move catalogue sorting", () => {
  it("sorts localized names with a deterministic ID tie-breaker without mutating source rows", () => {
    const original = [...rows];
    expect(ids(sortMoves(rows, "name", "en"))).toEqual([6, 1, 2, 3, 5, 4]);
    expect(rows).toEqual(original);
    expect(ids(sortMoves(rows.toReversed(), "name", "en"))).toEqual([6, 1, 2, 3, 5, 4]);
  });

  it("sorts numeric values descending, resolves ties by name and ID, and leaves flexible power last", () => {
    expect(ids(sortMoves(rows, "power", "en"))).toEqual([2, 3, 1, 6, 5, 4]);
    expect(ids(sortMoves(rows, "accuracy", "en"))).toEqual([1, 2, 3, 4, 6, 5]);
    expect(ids(sortMoves(rows, "pp", "en"))).toEqual([3, 1, 2, 4, 6, 5]);
  });

  it("accepts only known URL sort values and restores the default when absent or invalid", () => {
    for (const sort of MOVE_SORTS) expect(readMoveSort(new URLSearchParams({ sort }))).toBe(sort);
    for (const sort of ["", "id", "POWER", "power-desc", "-1"])
      expect(readMoveSort(new URLSearchParams({ sort }))).toBe("name");
    expect(readMoveSort(new URLSearchParams())).toBe("name");
  });

  it("keeps sort through filter edits and restores filtered sorting from a history URL", () => {
    const catalogue: ResourceCatalogue = { kind: "move", entries: rows, types: [], categories: [] };
    const historyUrl = new URL("https://example.test/en/move/?sort=power&version=red&form=alola");
    const next = catalogueFiltersUrl(historyUrl, { q: "Alpha", type: null, category: null });
    expect(next.searchParams.get("sort")).toBe("power");
    expect(next.searchParams.get("version")).toBe("red");
    expect(next.searchParams.has("form")).toBe(false);
    const filtered = filterResources(
      prepareResources(rows),
      readCatalogueFilters(next.searchParams, catalogue),
    );
    expect(ids(sortMoves(filtered, readMoveSort(next.searchParams), "en"))).toEqual([2, 1]);
    const restored = filterResources(
      prepareResources(rows),
      readCatalogueFilters(historyUrl.searchParams, catalogue),
    );
    expect(ids(sortMoves(restored, readMoveSort(historyUrl.searchParams), "en"))).toEqual([
      2, 3, 1, 6, 5, 4,
    ]);
  });
});
