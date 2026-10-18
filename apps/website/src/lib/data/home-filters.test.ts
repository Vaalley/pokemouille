import { describe, expect, it } from "vite-plus/test";
import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
import type { Catalogue, CatalogueSpecies } from "./catalogue.ts";
import {
  DEFAULT_HOME_DISPLAY,
  filterHomeSpecies,
  hasHomeFilterParams,
  homeFiltersUrl,
  prepareHomeSpecies,
  readHomeDisplay,
  readHomeFilters,
  sortHomeSpecies,
  type HomeFilters,
} from "./home-filters.ts";

const name = (text: string): LocalizedText => ({
  text,
  requestedLanguage: "en",
  fallback: false,
  sourceLanguageId: 9,
});

function entry(
  id: number,
  speciesName: string,
  generationId: number,
  typeIds: number[],
  extra: Partial<CatalogueSpecies> = {},
): CatalogueSpecies {
  return {
    id,
    name: speciesName,
    generationId,
    typeIds,
    stats: null,
    abilityIds: [],
    hiddenAbilityIds: [],
    classification: "ordinary",
    dexNumbers: [],
    ...extra,
  };
}

const catalogue: Catalogue = {
  species: [
    entry(700, "Nymphali", 6, [18], {
      stats: [95, 65, 65, 110, 130, 60, 525],
      abilityIds: [56],
      hiddenAbilityIds: [182],
    }),
    entry(25, "Pikachu", 1, [13], {
      stats: [35, 55, 40, 50, 50, 90, 320],
      abilityIds: [9],
      hiddenAbilityIds: [31],
    }),
    entry(26, "Raichu", 1, [13], {
      stats: [60, 90, 55, 90, 80, 110, 485],
      abilityIds: [9],
      hiddenAbilityIds: [31],
    }),
    entry(133, "Évoli", 1, [1], {
      stats: [55, 55, 50, 45, 65, 55, 325],
      abilityIds: [50, 91],
      hiddenAbilityIds: [107],
    }),
    entry(151, "Mew", 1, [14], {
      stats: [100, 100, 100, 100, 100, 100, 600],
      abilityIds: [28],
      classification: "mythical",
    }),
    entry(172, "Pichu", 2, [13], {
      abilityIds: [9],
      hiddenAbilityIds: [31],
      classification: "baby",
    }),
  ],
  types: [1, 13, 14, 18].map((id) => ({ id, name: name(String(id)) })),
  generations: [1, 2, 6],
  abilities: [9, 28, 31, 50, 56, 91, 107, 182].map((id) => ({ id, name: name(String(id)) })),
  statNames: ["HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed"].map(name),
  pokedexes: [],
  versions: [],
};

const ALL = [25, 26, 133, 151, 172, 700];

function matches(search: string, data = catalogue) {
  return filterHomeSpecies(
    prepareHomeSpecies(data.species),
    readHomeFilters(new URLSearchParams(search), data),
  ).map((species) => species.id);
}

function sorted(search: string) {
  const params = new URLSearchParams(search);
  return sortHomeSpecies(catalogue.species, readHomeDisplay(params), "en").map(
    (species) => species.id,
  );
}

const noFilters: HomeFilters = {
  q: "",
  type: null,
  generation: null,
  ability: null,
  classification: null,
  minTotal: null,
  maxTotal: null,
  dex: null,
};

describe("homepage filters", () => {
  it("combines text, current types, and introduction generation with AND in National Dex order", () => {
    expect(matches("q=chu&type=13&generation=1")).toEqual([25, 26]);
    expect(matches("q=chu&type=18&generation=1")).toEqual([]);
    expect(matches("type=18&generation=1")).toEqual([]);
    expect(matches("type=18&generation=6")).toEqual([700]);
    expect(matches("")).toEqual(ALL);
  });

  it("folds case, diacritics, width and kana without dropping Japanese voicing marks", () => {
    expect(matches("q=ＥＶＯＬＩ")).toEqual([133]);
    expect(matches("q=e%CC%81voli")).toEqual([133]);
    const japanese: Catalogue = {
      ...catalogue,
      species: [entry(25, "ピカチュウ", 1, [13])],
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

  it("matches a current ability whether it is a normal or hidden one", () => {
    expect(matches("ability=9")).toEqual([25, 26, 172]);
    expect(matches("ability=31")).toEqual([25, 26, 172]);
    expect(matches("ability=91")).toEqual([133]);
    expect(matches("ability=9&generation=2")).toEqual([172]);
  });

  it("filters by classification, with ordinary meaning none of legendary, mythical or baby", () => {
    expect(matches("class=mythical")).toEqual([151]);
    expect(matches("class=baby&type=13")).toEqual([172]);
    expect(matches("class=legendary")).toEqual([]);
    expect(matches("class=ordinary")).toEqual([25, 26, 133, 700]);
  });

  it("bounds the base stat total inclusively and never lets unknown stats satisfy a bound", () => {
    expect(matches("minTotal=485")).toEqual([26, 151, 700]);
    expect(matches("maxTotal=485")).toEqual([25, 26, 133]);
    expect(matches("minTotal=320&maxTotal=325")).toEqual([25, 133]);
    expect(matches("minTotal=0")).not.toContain(172);
    expect(matches("minTotal=600&maxTotal=300")).toEqual([]);
  });

  it("treats invalid, unknown, and unsafe numeric filter values as all", () => {
    for (const invalid of ["0", "-1", "13.5", "13x", "1e1", "999", "9007199254740993", ""])
      expect(matches(`type=${invalid}&generation=${invalid}&ability=${invalid}`)).toEqual(ALL);
    for (const invalid of ["-1", "13.5", "1e3", "abc", "9007199254740993", ""])
      expect(matches(`minTotal=${invalid}&maxTotal=${invalid}`)).toEqual(ALL);
    for (const invalid of ["Legendary", "none", "", "mythical,baby"])
      expect(matches(`class=${invalid}`)).toEqual(ALL);
    expect(
      readHomeFilters(new URLSearchParams("type=013&generation=01&minTotal=0500"), catalogue),
    ).toEqual({ ...noFilters, type: 13, generation: 1, minTotal: 500 });
    expect(matches("q=chu&type=unknown&generation=1")).toEqual([25, 26]);
  });

  it("preserves unrelated navigation context and round-trips shareable filters and display", () => {
    const original = new URL(
      "https://example.test/base/fr/?version=red&form=alola&other=keep#results",
    );
    const filters: HomeFilters = {
      q: "Évoli",
      type: 1,
      generation: 1,
      ability: 91,
      classification: "ordinary",
      minTotal: 300,
      maxTotal: 600,
      dex: "31",
    };
    const display = { view: "table", sort: "speed", order: "asc" } as const;
    const next = homeFiltersUrl(original, filters, display);
    expect(readHomeFilters(next.searchParams, catalogue)).toEqual(filters);
    expect(readHomeDisplay(next.searchParams)).toEqual(display);
    expect(next.searchParams.get("class")).toBe("ordinary");
    expect(next.pathname).toBe("/base/fr/");
    expect(next.searchParams.get("version")).toBe("red");
    expect(next.searchParams.get("form")).toBe("alola");
    expect(next.searchParams.get("other")).toBe("keep");
    expect(next.hash).toBe("#results");
    expect(original.searchParams.has("q")).toBe(false);
    expect(homeFiltersUrl(next, noFilters, DEFAULT_HOME_DISPLAY).href).toBe(original.href);
  });

  it("omits default display values, including each sort's default order", () => {
    const base = new URL("https://example.test/en/");
    const url = (sort: "number" | "name" | "hp", order: "asc" | "desc") =>
      homeFiltersUrl(base, noFilters, { view: "list", sort, order }).search;
    expect(url("number", "asc")).toBe("");
    expect(url("name", "asc")).toBe("?sort=name");
    expect(url("hp", "desc")).toBe("?sort=hp");
    expect(url("hp", "asc")).toBe("?sort=hp&order=asc");
    expect(url("number", "desc")).toBe("?order=desc");
  });

  it("keeps regional dex URLs shareable and preserves invalid values until correction", () => {
    const original = new URL(
      "https://example.test/en/?version=scarlet&dex=31&type=13&view=table&sort=speed",
    );
    const filters = readHomeFilters(original.searchParams, catalogue);
    expect(filters.dex).toBe("31");
    const next = homeFiltersUrl(
      original,
      { ...filters, q: "chu" },
      readHomeDisplay(original.searchParams),
    );
    expect(next.searchParams.get("dex")).toBe("31");
    expect(next.searchParams.get("version")).toBe("scarlet");
    expect(next.searchParams.get("type")).toBe("13");
    expect(readHomeDisplay(next.searchParams)).toEqual({
      view: "table",
      sort: "speed",
      order: "desc",
    });
    expect(readHomeFilters(new URLSearchParams("dex=wrong-game"), catalogue).dex).toBe(
      "wrong-game",
    );
    expect(readHomeFilters(new URLSearchParams("dex=1"), catalogue).dex).toBeNull();
    expect(hasHomeFilterParams(new URLSearchParams("dex=31"))).toBe(true);
    expect(hasHomeFilterParams(new URLSearchParams("dex=wrong-game"))).toBe(true);
  });

  it("combines regional membership with existing filters and uses numeric regional order", () => {
    const regional = {
      ...catalogue,
      species: [
        entry(25, "Pikachu", 1, [13], { dexNumbers: [[31, 10]], stats: [4, 4, 4, 4, 4, 4, 24] }),
        entry(700, "Nymphali", 6, [18], { dexNumbers: [[31, 2]], stats: [2, 2, 2, 2, 2, 2, 12] }),
        entry(172, "Pichu", 2, [13], { dexNumbers: [[31, 0]], stats: [3, 3, 3, 3, 3, 3, 18] }),
        entry(26, "Raichu", 1, [13], { dexNumbers: [[32, 1]] }),
      ],
    };
    const prepared = prepareHomeSpecies(regional.species);
    const filters = { ...noFilters, dex: "31" };
    const members = filterHomeSpecies(prepared, filters, 31);
    expect(members.map((row) => row.id)).toEqual([25, 172, 700]);
    expect(sortHomeSpecies(members, DEFAULT_HOME_DISPLAY, "en", 31).map((row) => row.id)).toEqual([
      172, 700, 25,
    ]);
    expect(
      sortHomeSpecies(members, { sort: "number", order: "desc" }, "en", 31).map((row) => row.id),
    ).toEqual([25, 700, 172]);
    expect(
      sortHomeSpecies(members, { sort: "name", order: "asc" }, "en", 31).map((row) => row.id),
    ).toEqual([700, 172, 25]);
    expect(
      sortHomeSpecies(members, { sort: "total", order: "desc" }, "en", 31).map((row) => row.id),
    ).toEqual([25, 172, 700]);
    expect(filterHomeSpecies(prepared, { ...filters, type: 13 }, 31).map((row) => row.id)).toEqual([
      25, 172,
    ]);
    expect(filterHomeSpecies(prepared, { ...filters, q: "#25" }, 31).map((row) => row.id)).toEqual([
      25,
    ]);
  });
});

describe("homepage display", () => {
  it("defaults to the list in National Dex order, with stats descending unless asked otherwise", () => {
    expect(readHomeDisplay(new URLSearchParams(""))).toEqual(DEFAULT_HOME_DISPLAY);
    expect(readHomeDisplay(new URLSearchParams("sort=attack"))).toEqual({
      view: "list",
      sort: "attack",
      order: "desc",
    });
    expect(readHomeDisplay(new URLSearchParams("view=table&sort=name&order=desc"))).toEqual({
      view: "table",
      sort: "name",
      order: "desc",
    });
  });

  it("ignores unknown views, sorts and orders", () => {
    expect(readHomeDisplay(new URLSearchParams("view=grid&sort=weight&order=up"))).toEqual(
      DEFAULT_HOME_DISPLAY,
    );
    expect(readHomeDisplay(new URLSearchParams("sort=spatk&order=sideways"))).toEqual({
      view: "list",
      sort: "spatk",
      order: "desc",
    });
    expect(readHomeDisplay(new URLSearchParams("sort=Total"))).toEqual(DEFAULT_HOME_DISPLAY);
  });

  it("sorts by number and by locale-aware name", () => {
    expect(sorted("")).toEqual(ALL);
    expect(sorted("order=desc")).toEqual(ALL.toReversed());
    expect(sorted("sort=name")).toEqual([133, 151, 700, 172, 25, 26]);
    expect(sorted("sort=name&order=desc")).toEqual([26, 25, 172, 700, 151, 133]);
  });

  it("sorts each stat column, breaking ties by ascending number and keeping unknown stats last", () => {
    // Attack: Mew 100, Raichu 90, Nymphali 65, Pikachu 55 = Évoli 55, Pichu unknown.
    expect(sorted("sort=attack")).toEqual([151, 26, 700, 25, 133, 172]);
    expect(sorted("sort=attack&order=asc")).toEqual([25, 133, 700, 26, 151, 172]);
    expect(sorted("sort=hp")).toEqual([151, 700, 26, 133, 25, 172]);
    expect(sorted("sort=defense")).toEqual([151, 700, 26, 133, 25, 172]);
    expect(sorted("sort=spatk")).toEqual([700, 151, 26, 25, 133, 172]);
    expect(sorted("sort=spdef")).toEqual([700, 151, 26, 133, 25, 172]);
    expect(sorted("sort=speed")).toEqual([26, 151, 25, 700, 133, 172]);
    expect(sorted("sort=total")).toEqual([151, 700, 26, 133, 25, 172]);
    expect(sorted("sort=total&order=asc")).toEqual([25, 133, 26, 700, 151, 172]);
  });
});
