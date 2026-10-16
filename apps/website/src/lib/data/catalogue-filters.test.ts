import { describe, expect, it } from "vite-plus/test";
import {
  catalogueFiltersUrl,
  filterResources,
  prepareResources,
  readCatalogueFilters,
} from "./catalogue-filters.ts";
import type { ResourceCatalogue } from "./resource-catalogue.ts";

const catalogue: ResourceCatalogue = {
  kind: "move",
  entries: [
    {
      id: 85,
      identifier: "thunderbolt",
      englishName: "Thunderbolt",
      name: { text: "Éclair", requestedLanguage: "fr", sourceLanguageId: 5, fallback: false },
      typeId: 13,
      damageClassId: 3,
    },
    {
      id: 86,
      identifier: "thunder-wave",
      englishName: "Thunder Wave",
      name: { text: "でんじは", requestedLanguage: "ja", sourceLanguageId: 1, fallback: false },
      typeId: 13,
      damageClassId: 1,
    },
    {
      id: 33,
      identifier: "tackle",
      englishName: "Tackle",
      name: { text: "Charge", requestedLanguage: "fr", sourceLanguageId: 5, fallback: false },
      typeId: 1,
      damageClassId: 2,
    },
  ],
  types: [1, 13].map((id) => ({
    id,
    name: { text: String(id), requestedLanguage: "en", sourceLanguageId: 9, fallback: false },
  })),
  categories: [1, 2, 3],
};

function matches(search: string, data = catalogue) {
  return filterResources(
    prepareResources(data.entries),
    readCatalogueFilters(new URLSearchParams(search), data),
  ).map((entry) => entry.id);
}

describe("resource catalogue filters", () => {
  it("searches localized names, English names and identifiers with shared normalization", () => {
    expect(matches("q=ＥＣＬＡＩＲ")).toEqual([85]);
    expect(matches("q=thunderbolt")).toEqual([85]);
    expect(matches("q=thunder-wave")).toEqual([86]);
    expect(matches("q=thunder%20wave")).toEqual([86]);
    expect(matches("q=デンジハ")).toEqual([86]);
    expect(matches("q=てんしは")).toEqual([]);
  });

  it("combines current type, category and alias search with AND", () => {
    expect(matches("q=thunder&type=13&category=3")).toEqual([85]);
    expect(matches("q=thunder&type=13&category=1")).toEqual([86]);
    expect(matches("q=thunder&type=1&category=3")).toEqual([]);
  });

  it("ignores malformed, unknown, unsafe and inapplicable facet IDs", () => {
    for (const invalid of ["-1", "0", "13.5", "13x", "1e1", "999", "9007199254740993", ""])
      expect(matches(`type=${invalid}&category=${invalid}`)).toEqual([85, 86, 33]);
    expect(readCatalogueFilters(new URLSearchParams("type=013&category=03"), catalogue)).toEqual({
      q: "",
      type: 13,
      category: 3,
    });
    expect(
      matches("q=charge&type=13&category=3", {
        ...catalogue,
        kind: "item",
        types: [],
        categories: [],
      }),
    ).toEqual([33]);
  });

  it("round-trips URL filters and reset while retaining game but dropping Pokémon form", () => {
    const original = new URL(
      "https://example.test/base/fr/move/?version=red&form=alola&other=keep#list",
    );
    const filters = { q: "Éclair", type: 13, category: 3 };
    const next = catalogueFiltersUrl(original, filters);
    expect(readCatalogueFilters(next.searchParams, catalogue)).toEqual(filters);
    expect(next.pathname).toBe("/base/fr/move/");
    expect(next.searchParams.get("version")).toBe("red");
    expect(next.searchParams.get("other")).toBe("keep");
    expect(next.searchParams.has("form")).toBe(false);
    expect(next.hash).toBe("#list");
    expect(original.searchParams.has("q")).toBe(false);
    expect(catalogueFiltersUrl(next, { q: "", type: null, category: null }).search).toBe(
      "?version=red&other=keep",
    );
  });
});
