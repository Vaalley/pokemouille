import { describe, expect, it } from "vite-plus/test";
import type { Language } from "../../../../../packages/pokemon-data/src/index.ts";
import type { PokemonSearchEntry } from "./entries.ts";
import { buildSearchEntries } from "./entries.ts";
import { normalizeSearchText, prepareSearchIndex, searchEntries } from "./rank.ts";
import type { SearchGame } from "./rank.ts";

interface Fixture {
  speciesId: number;
  name: string;
  pokemonId?: number;
  formId?: number | null;
  identifier?: string;
  speciesName?: string;
  aliases?: string[];
  generationId?: number;
  introducedVersionGroupId?: number | null;
  isDefault?: boolean;
  language?: Language;
}

function entry(fixture: Fixture): PokemonSearchEntry {
  const language = fixture.language ?? "en";
  const text = (value: string) => ({
    text: value,
    requestedLanguage: language,
    sourceLanguageId: language === "ja" ? 11 : 9,
    fallback: false,
  });
  const identifier = fixture.identifier ?? fixture.name.toLowerCase();
  return {
    kind: "pokemon",
    id: fixture.speciesId,
    key: `pokemon:${fixture.pokemonId ?? fixture.speciesId}:${fixture.formId === undefined ? fixture.speciesId : fixture.formId}`,
    speciesId: fixture.speciesId,
    pokemonId: fixture.pokemonId ?? fixture.speciesId,
    formId: fixture.formId === undefined ? fixture.speciesId : fixture.formId,
    identifier,
    name: text(fixture.name),
    speciesName: text(fixture.speciesName ?? fixture.name),
    aliases: fixture.aliases ?? [identifier, String(fixture.speciesId), fixture.name],
    generationId: fixture.generationId ?? 1,
    introducedVersionGroupId:
      fixture.introducedVersionGroupId === undefined ? 1 : fixture.introducedVersionGroupId,
    isDefault: fixture.isDefault ?? true,
  };
}

const bulbasaur = entry({ speciesId: 1, name: "Bulbasaur" });
const pikachu = entry({ speciesId: 25, name: "Pikachu" });
const pikachuCap = entry({
  speciesId: 25,
  pokemonId: 10094,
  formId: 10094,
  name: "Original Cap Pikachu",
  speciesName: "Pikachu",
  identifier: "pikachu-original-cap",
  aliases: ["pikachu", "pikachu-original-cap", "25", "Pikachu", "Original Cap Pikachu"],
  isDefault: false,
});
const pikachuGmax = entry({
  speciesId: 25,
  pokemonId: 10199,
  formId: 10419,
  name: "Gigantamax Pikachu",
  speciesName: "Pikachu",
  identifier: "pikachu-gmax",
  aliases: ["pikachu", "pikachu-gmax", "25", "Pikachu", "Gigantamax Pikachu"],
  isDefault: false,
});
const raichu = entry({ speciesId: 26, name: "Raichu" });
const nidoranFemale = entry({ speciesId: 29, name: "Nidoran♀", identifier: "nidoran-f" });
const nidoranMale = entry({ speciesId: 32, name: "Nidoran♂", identifier: "nidoran-m" });
const farfetchd = entry({ speciesId: 83, name: "Farfetch’d", identifier: "farfetchd" });
const mrMime = entry({ speciesId: 122, name: "Mr. Mime", identifier: "mr-mime" });
const rotomHeat = entry({
  speciesId: 479,
  pokemonId: 10008,
  formId: 10059,
  name: "Heat Rotom",
  speciesName: "Rotom",
  identifier: "rotom-heat",
  aliases: ["rotom", "rotom-heat", "479", "Rotom", "Heat Rotom"],
  isDefault: false,
});
const flabebe = entry({ speciesId: 669, name: "Flabébé", identifier: "flabebe" });

const english = prepareSearchIndex([
  rotomHeat,
  pikachuGmax,
  raichu,
  mrMime,
  pikachuCap,
  farfetchd,
  nidoranMale,
  flabebe,
  pikachu,
  nidoranFemale,
  bulbasaur,
]);

describe("normalizeSearchText", () => {
  it("folds case, width, Latin accents and punctuation into a compact key", () => {
    expect(normalizeSearchText("Pokémon")).toBe("pokemon");
    expect(normalizeSearchText("Ｐｉｋａｃｈｕ")).toBe("pikachu");
    expect(normalizeSearchText("Mr. Mime")).toBe("mrmime");
    expect(normalizeSearchText("Farfetch’d")).toBe("farfetchd");
    expect(normalizeSearchText("Type: Null")).toBe("typenull");
    expect(normalizeSearchText("Nidoran♀")).toBe("nidoranf");
    expect(normalizeSearchText("Nidoran♂")).toBe("nidoranm");
  });

  it("folds katakana to hiragana but keeps voicing marks", () => {
    expect(normalizeSearchText("ピカチュウ")).toBe(normalizeSearchText("ぴかちゅう"));
    expect(normalizeSearchText("ﾋﾟｶﾁｭｳ")).toBe(normalizeSearchText("ピカチュウ"));
    expect(normalizeSearchText("ガ")).not.toBe(normalizeSearchText("カ"));
    expect(normalizeSearchText("ポリゴン・Ｚ")).toBe("ぽりごんz");
  });
});

describe("searchEntries", () => {
  it("returns nothing for an empty or blank query", () => {
    expect(searchEntries(english, "")).toEqual([]);
    expect(searchEntries(english, "   ")).toEqual([]);
    expect(searchEntries(english, " .-' ")).toEqual([]);
  });

  it.each(["Pikachu", "pikachu", "PIKACHU"])("ranks the default Pikachu first for %s", (query) => {
    const results = searchEntries(english, query);
    expect(results[0]).toEqual({ entry: pikachu, match: "exact", introduction: null });
    expect(results[0].entry).toBe(pikachu);
    expect(results.map((result) => result.entry)).toEqual([pikachu, pikachuCap, pikachuGmax]);
    expect(results.slice(1, 3).map((result) => result.match)).toEqual(["exact", "exact"]);
    expect(results.map((result) => result.entry)).not.toContain(raichu);
  });

  it.each(["25", "#025", "No.25", "no 25", "n°25", "nº25", "＃０２５"])(
    "matches the species number for %s",
    (query) => {
      const results = searchEntries(english, query);
      expect(results.map((result) => result.entry)).toEqual([pikachu, pikachuCap, pikachuGmax]);
      expect(results.every((result) => result.match === "number")).toBe(true);
    },
  );

  it("never matches numbers against Pokémon/form IDs or number prefixes", () => {
    expect(searchEntries(english, "10059")).toEqual([]);
    expect(searchEntries(english, "10008")).toEqual([]);
    expect(searchEntries(english, "2")).toEqual([]);
    expect(searchEntries(english, "1").map((result) => result.entry)).toEqual([bulbasaur]);
    expect(searchEntries(english, "0025").map((result) => result.entry)[0]).toBe(pikachu);
  });

  it("ignores accents and punctuation without altering displayed names", () => {
    const flabebeResults = searchEntries(english, "flabebe");
    expect(flabebeResults[0]).toMatchObject({ match: "exact" });
    expect(flabebeResults[0].entry.name.text).toBe("Flabébé");
    for (const query of ["mr mime", "mr.mime", "MrMime", "Mr. Mime"])
      expect(searchEntries(english, query)[0]).toEqual({
        entry: mrMime,
        match: "exact",
        introduction: null,
      });
    expect(searchEntries(english, "mime")[0]).toMatchObject({ entry: mrMime, match: "prefix" });
    expect(searchEntries(english, "farfetchd")[0]).toMatchObject({
      entry: farfetchd,
      match: "exact",
    });
    expect(searchEntries(english, "farfetch'd")[0].entry.name.text).toBe("Farfetch’d");
  });

  it.each(["nidoran♀", "nidoranf", "Nidoran-F"])("resolves %s to the female Nidoran", (query) => {
    const results = searchEntries(english, query);
    expect(results[0]).toMatchObject({ entry: nidoranFemale, match: "exact" });
    expect(results.findIndex((result) => result.entry === nidoranMale)).not.toBe(0);
  });

  describe("Japanese names", () => {
    const pikachuJa = entry({
      speciesId: 25,
      name: "ピカチュウ",
      identifier: "pikachu",
      aliases: ["pikachu", "25", "ピカチュウ", "Pikachu"],
      language: "ja",
    });
    const growlithe = entry({
      speciesId: 58,
      name: "ガーディ",
      identifier: "growlithe",
      aliases: ["growlithe", "58", "ガーディ", "Growlithe"],
      language: "ja",
    });
    const japanese = prepareSearchIndex([growlithe, pikachuJa]);

    it.each(["ピカチュウ", "ぴかちゅう", "ﾋﾟｶﾁｭｳ"])("matches ピカチュウ for %s", (query) => {
      expect(searchEntries(japanese, query)).toEqual([
        { entry: pikachuJa, match: "exact", introduction: null },
      ]);
    });

    it("keeps dakuten distinct", () => {
      expect(searchEntries(japanese, "カ")).toEqual([]);
      expect(searchEntries(japanese, "ガ")[0]).toMatchObject({ entry: growlithe, match: "prefix" });
      expect(searchEntries(japanese, "カーディ")[0]).toMatchObject({
        entry: growlithe,
        match: "typo",
      });
      expect(searchEntries(japanese, "がーでぃ")[0]).toMatchObject({
        entry: growlithe,
        match: "exact",
      });
    });
  });

  it("tolerates substitutions and transpositions", () => {
    expect(searchEntries(english, "pikachi")[0]).toMatchObject({ entry: pikachu, match: "typo" });
    expect(searchEntries(english, "bulbasuar")[0]).toMatchObject({
      entry: bulbasaur,
      match: "typo",
    });
    expect(searchEntries(english, "bulbasaru")[0]).toMatchObject({
      entry: bulbasaur,
      match: "typo",
    });
    expect(searchEntries(english, "pikahcu")[0]).toMatchObject({ entry: pikachu, match: "typo" });
  });

  it("does not typo-match queries shorter than four characters", () => {
    expect(searchEntries(english, "pjk")).toEqual([]);
    expect(searchEntries(english, "rqi")).toEqual([]);
  });

  it("orders tiers exact, prefix, substring, typo with deterministic ties", () => {
    const abra = entry({ speciesId: 63, name: "Abra" });
    const kadabra = entry({ speciesId: 64, name: "Kadabra" });
    const abrasaur = entry({ speciesId: 902, name: "Abrasaur" });
    const candabra = entry({ speciesId: 910, name: "Candabra" });
    const obra = entry({ speciesId: 903, name: "Obra" });
    const fixtures = [obra, candabra, kadabra, abrasaur, abra];
    const expected = [
      { entry: abra, match: "exact", introduction: null },
      { entry: abrasaur, match: "prefix", introduction: null },
      { entry: kadabra, match: "substring", introduction: null },
      { entry: candabra, match: "substring", introduction: null },
      { entry: obra, match: "typo", introduction: null },
    ];
    expect(searchEntries(prepareSearchIndex(fixtures), "abra")).toEqual(expected);
    expect(searchEntries(prepareSearchIndex([...fixtures].reverse()), "abra")).toEqual(expected);
    expect(searchEntries(prepareSearchIndex(fixtures), "abra", { limit: 2 })).toEqual(
      expected.slice(0, 2),
    );
  });

  describe("with a game", () => {
    const game: SearchGame = {
      generationId: 9,
      order: 25,
      groupOrders: new Map([
        [1, 1],
        [30, 30],
      ]),
    };
    const notIntroduced = entry({
      speciesId: 999,
      name: "Testmon",
      generationId: 9,
      introducedVersionGroupId: 30,
    });
    const available = entry({ speciesId: 1000, name: "Testmon", introducedVersionGroupId: 1 });
    const unknownForm = entry({ speciesId: 1001, name: "Testmon", introducedVersionGroupId: null });
    const unmappedForm = entry({ speciesId: 1002, name: "Testmon", introducedVersionGroupId: 77 });
    const futureSpecies = entry({ speciesId: 1003, name: "Testmon", generationId: 10 });
    const index = prepareSearchIndex([
      futureSpecies,
      unmappedForm,
      unknownForm,
      available,
      notIntroduced,
    ]);

    it("keeps not-introduced matches after comparable introduced or unknown ones", () => {
      expect(
        searchEntries(index, "testmon", { game }).map((result) => [
          result.entry.id,
          result.introduction,
        ]),
      ).toEqual([
        [1000, "available"],
        [1001, "unknown"],
        [1002, "unknown"],
        [999, "not-introduced"],
        [1003, "not-introduced"],
      ]);
    });

    it("reports no introduction and ignores it without a game", () => {
      expect(
        searchEntries(index, "testmon").map((result) => [result.entry.id, result.introduction]),
      ).toEqual([
        [999, null],
        [1000, null],
        [1001, null],
        [1002, null],
        [1003, null],
      ]);
      expect(searchEntries(index, "testmon", { game: null })[0].introduction).toBeNull();
    });

    it("does not let introduction outrank a better match", () => {
      const testmonite = entry({ speciesId: 1, name: "Testmonite" });
      const results = searchEntries(prepareSearchIndex([testmonite, notIntroduced]), "testmon", {
        game,
      });
      expect(results.map((result) => [result.entry.id, result.match])).toEqual([
        [999, "exact"],
        [1, "prefix"],
      ]);
    });
  });
});

describe("cross-resource search", () => {
  const references = {
    moves: [
      { id: 1, identifier: "pound", typeId: 1, names: [{ languageId: 9, name: "Pound" }] },
      {
        id: 85,
        identifier: "thunderbolt",
        typeId: 13,
        names: [
          { languageId: 9, name: "Thunderbolt" },
          { languageId: 5, name: "Tonnerre" },
          { languageId: 11, name: "１０まんボルト" },
        ],
      },
    ],
    abilities: [
      { id: 1, identifier: "stench", names: [{ languageId: 9, name: "Stench" }] },
      {
        id: 65,
        identifier: "overgrow",
        names: [
          { languageId: 9, name: "Overgrow" },
          { languageId: 5, name: "Engrais" },
          { languageId: 11, name: "しんりょく" },
        ],
      },
    ],
    items: [
      { id: 1, identifier: "master-ball", names: [{ languageId: 9, name: "Master Ball" }] },
      {
        id: 83,
        identifier: "thunder-stone",
        names: [
          { languageId: 9, name: "Thunder Stone" },
          { languageId: 5, name: "Pierre Foudre" },
          { languageId: 11, name: "かみなりのいし" },
        ],
      },
      { id: 330, identifier: "tm025", names: [{ languageId: 9, name: "TM025" }] },
    ],
  };

  it("ranks exact resources before Pokémon prefixes and tolerates resource typos", () => {
    const index = prepareSearchIndex(
      buildSearchEntries(
        [bulbasaur, entry({ speciesId: 2000, name: "Thunderbolter" })],
        references,
        "en",
      ),
    );
    expect(
      searchEntries(index, "thunderbolt")
        .slice(0, 2)
        .map(({ entry, match }) => [entry.kind, entry.name.text, match]),
    ).toEqual([
      ["move", "Thunderbolt", "exact"],
      ["pokemon", "Thunderbolter", "prefix"],
    ]);
    expect(
      searchEntries(index, "overgrouw").map(({ entry, match }) => [entry.kind, entry.id, match]),
    ).toEqual([["ability", 65, "typo"]]);
    expect(
      searchEntries(index, "thudnerstone").map(({ entry, match }) => [entry.kind, entry.id, match]),
    ).toEqual([["item", 83, "typo"]]);
  });

  it("matches localized and English resource names without losing localized display names", () => {
    const french = prepareSearchIndex(buildSearchEntries([], references, "fr"));
    for (const query of ["tonnerre", "Thunderbolt"]) {
      expect(
        searchEntries(french, query).map(({ entry }) => [entry.kind, entry.name.text]),
      ).toEqual([["move", "Tonnerre"]]);
    }
    expect(searchEntries(french, "engrais")[0].entry.kind).toBe("ability");
    for (const query of ["pierre foudre", "Thunder Stone", "thunder-stone"]) {
      expect(
        searchEntries(french, query).map(({ entry }) => [entry.kind, entry.name.text]),
      ).toEqual([["item", "Pierre Foudre"]]);
    }
    const japanese = prepareSearchIndex(buildSearchEntries([], references, "ja"));
    expect(searchEntries(japanese, "10まんぼると")[0].entry.name.text).toBe("１０まんボルト");
    expect(searchEntries(japanese, "しんりょく")[0].entry.kind).toBe("ability");
    expect(searchEntries(japanese, "カミナリノイシ")[0].entry.name.text).toBe("かみなりのいし");
    // A French-only name must not leak into the English index.
    const english = prepareSearchIndex(buildSearchEntries([], references, "en"));
    expect(searchEntries(english, "tonnerre")).toEqual([]);
    expect(searchEntries(english, "pierre foudre")).toEqual([]);
  });

  it("keeps English fallback resources searchable and identifies their source language", () => {
    const french = prepareSearchIndex(buildSearchEntries([], references, "fr"));
    expect(searchEntries(french, "stench")[0].entry.name).toMatchObject({
      text: "Stench",
      requestedLanguage: "fr",
      sourceLanguageId: 9,
      fallback: true,
    });
    expect(searchEntries(french, "masterball")[0].entry.name).toMatchObject({
      text: "Master Ball",
      sourceLanguageId: 9,
      fallback: true,
    });
  });

  it("returns shared numeric IDs across categories before a species' many alternate forms", () => {
    const forms = Array.from({ length: 24 }, (_, i) =>
      entry({
        speciesId: 1,
        pokemonId: 10000 + i,
        formId: 10000 + i,
        name: `Bulbasaur Form ${i}`,
        isDefault: false,
      }),
    );
    const index = prepareSearchIndex(buildSearchEntries([bulbasaur, ...forms], references, "en"));
    expect(
      searchEntries(index, "#1")
        .slice(0, 4)
        .map(({ entry }) => [entry.kind, entry.name.text]),
    ).toEqual([
      ["pokemon", "Bulbasaur"],
      ["move", "Pound"],
      ["ability", "Stench"],
      ["item", "Master Ball"],
    ]);
  });

  it("keeps item IDs canonical without confusing digits in item names with species or form IDs", () => {
    const index = prepareSearchIndex(buildSearchEntries([pikachu, pikachuCap], references, "en"));
    for (const query of ["25", "#025", "No.25", "＃０２５"]) {
      expect(searchEntries(index, query).map(({ entry }) => entry.kind)).toEqual([
        "pokemon",
        "pokemon",
      ]);
    }
    expect(searchEntries(index, "10094")).toEqual([]);
    expect(searchEntries(index, "#083").map(({ entry }) => [entry.kind, entry.id])).toEqual([
      ["item", 83],
    ]);
    expect(searchEntries(index, "tm025")[0]).toMatchObject({
      entry: { kind: "item", id: 330, identifier: "tm025" },
      match: "exact",
      introduction: null,
    });
  });

  it("does not invent game introduction metadata for item results", () => {
    const index = prepareSearchIndex(buildSearchEntries([], references, "fr"));
    expect(
      searchEntries(index, "pierre foudre", {
        game: { generationId: 1, order: 1, groupOrders: new Map([[1, 1]]) },
      }),
    ).toMatchObject([{ entry: { kind: "item", id: 83 }, introduction: null }]);
  });
});
