import { describe, expect, it } from "vite-plus/test";
import type { Catalogue } from "./catalogue.ts";
import {
  filterHomeSpecies,
  homeFiltersUrl,
  prepareHomeSpecies,
  readHomeFilters,
} from "./home-filters.ts";

const catalogue: Catalogue = {
  species: [
    { id: 700, name: "Nymphali", generationId: 6, typeIds: [18] },
    { id: 25, name: "Pikachu", generationId: 1, typeIds: [13] },
    { id: 26, name: "Raichu", generationId: 1, typeIds: [13] },
    { id: 133, name: "Évoli", generationId: 1, typeIds: [1] },
  ],
  types: [1, 13, 18].map((id) => ({
    id,
    name: {
      text: String(id),
      requestedLanguage: "en" as const,
      fallback: false,
      sourceLanguageId: 9,
    },
  })),
  generations: [1, 6],
};

function matches(search: string, data = catalogue) {
  return filterHomeSpecies(
    prepareHomeSpecies(data.species),
    readHomeFilters(new URLSearchParams(search), data),
  ).map((species) => species.id);
}

describe("homepage filters", () => {
  it("combines text, current types, and introduction generation with AND in National Dex order", () => {
    expect(matches("q=chu&type=13&generation=1")).toEqual([25, 26]);
    expect(matches("q=chu&type=18&generation=1")).toEqual([]);
    expect(matches("type=18&generation=1")).toEqual([]);
    expect(matches("type=18&generation=6")).toEqual([700]);
    expect(matches("")).toEqual([25, 26, 133, 700]);
  });

  it("folds case, diacritics, width and kana without dropping Japanese voicing marks", () => {
    expect(matches("q=ＥＶＯＬＩ")).toEqual([133]);
    expect(matches("q=e%CC%81voli")).toEqual([133]);
    const japanese: Catalogue = {
      ...catalogue,
      species: [{ id: 25, name: "ピカチュウ", generationId: 1, typeIds: [13] }],
    };
    expect(matches("q=ﾋﾟｶﾁｭｳ", japanese)).toEqual([25]);
    expect(matches("q=ぴかちゅう", japanese)).toEqual([25]);
    expect(matches("q=ひかちゅう", japanese)).toEqual([]);
  });

  it("matches exact National Dex numbers, including zero-padding and familiar prefixes", () => {
    expect(matches("q=%23２５")).toEqual([25]);
    expect(matches("q=0025")).toEqual([25]);
    expect(matches("q=nº%2025")).toEqual([25]);
    expect(matches("q=25&type=18")).toEqual([]);
    expect(matches("q=2")).toEqual([]);
  });

  it("treats invalid, unknown, and unsafe numeric filter IDs as all", () => {
    for (const invalid of ["0", "-1", "13.5", "13x", "1e1", "999", "9007199254740993", ""])
      expect(matches(`type=${invalid}&generation=${invalid}`)).toEqual([25, 26, 133, 700]);
    expect(readHomeFilters(new URLSearchParams("type=013&generation=01"), catalogue)).toEqual({
      q: "",
      type: 13,
      generation: 1,
    });
    expect(matches("q=chu&type=unknown&generation=1")).toEqual([25, 26]);
  });

  it("preserves unrelated navigation context and round-trips shareable filters", () => {
    const original = new URL(
      "https://example.test/base/fr/?version=red&form=alola&other=keep#results",
    );
    const filters = { q: "Évoli", type: 1, generation: 1 };
    const next = homeFiltersUrl(original, filters);
    expect(readHomeFilters(next.searchParams, catalogue)).toEqual(filters);
    expect(next.pathname).toBe("/base/fr/");
    expect(next.searchParams.get("version")).toBe("red");
    expect(next.searchParams.get("form")).toBe("alola");
    expect(next.searchParams.get("other")).toBe("keep");
    expect(next.hash).toBe("#results");
    expect(original.searchParams.has("q")).toBe(false);
    expect(homeFiltersUrl(next, { q: "", type: null, generation: null }).href).toBe(original.href);
  });
});
