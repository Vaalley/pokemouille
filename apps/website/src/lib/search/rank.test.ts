import { describe, expect, it } from "vite-plus/test";
import type { Language, SearchEntry } from "../../../../../packages/pokemon-data/src/index.ts";
import { normalizeSearchText, prepareSearchIndex, searchPokemon } from "./rank.ts";
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

function entry(fixture: Fixture): SearchEntry {
  const language = fixture.language ?? "en";
  const text = (value: string) => ({
    text: value,
    requestedLanguage: language,
    sourceLanguageId: language === "ja" ? 11 : 9,
    fallback: false,
  });
  const identifier = fixture.identifier ?? fixture.name.toLowerCase();
  return {
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

describe("searchPokemon", () => {
  it("returns nothing for an empty or blank query", () => {
    expect(searchPokemon(english, "")).toEqual([]);
    expect(searchPokemon(english, "   ")).toEqual([]);
    expect(searchPokemon(english, " .-' ")).toEqual([]);
  });

  it.each(["Pikachu", "pikachu", "PIKACHU"])("ranks the default Pikachu first for %s", (query) => {
    const results = searchPokemon(english, query);
    expect(results[0]).toEqual({ entry: pikachu, match: "exact", introduction: null });
    expect(results[0].entry).toBe(pikachu);
    expect(results.map((result) => result.entry)).toEqual([pikachu, pikachuCap, pikachuGmax]);
    expect(results.slice(1, 3).map((result) => result.match)).toEqual(["exact", "exact"]);
    expect(results.map((result) => result.entry)).not.toContain(raichu);
  });

  it.each(["25", "#025", "No.25", "no 25", "n°25", "nº25", "＃０２５"])(
    "matches the species number for %s",
    (query) => {
      const results = searchPokemon(english, query);
      expect(results.map((result) => result.entry)).toEqual([pikachu, pikachuCap, pikachuGmax]);
      expect(results.every((result) => result.match === "number")).toBe(true);
    },
  );

  it("never matches numbers against Pokémon/form IDs or number prefixes", () => {
    expect(searchPokemon(english, "10059")).toEqual([]);
    expect(searchPokemon(english, "10008")).toEqual([]);
    expect(searchPokemon(english, "2")).toEqual([]);
    expect(searchPokemon(english, "1").map((result) => result.entry)).toEqual([bulbasaur]);
    expect(searchPokemon(english, "0025").map((result) => result.entry)[0]).toBe(pikachu);
  });

  it("ignores accents and punctuation without altering displayed names", () => {
    const flabebeResults = searchPokemon(english, "flabebe");
    expect(flabebeResults[0]).toMatchObject({ match: "exact" });
    expect(flabebeResults[0].entry.name.text).toBe("Flabébé");
    for (const query of ["mr mime", "mr.mime", "MrMime", "Mr. Mime"])
      expect(searchPokemon(english, query)[0]).toEqual({
        entry: mrMime,
        match: "exact",
        introduction: null,
      });
    expect(searchPokemon(english, "mime")[0]).toMatchObject({ entry: mrMime, match: "prefix" });
    expect(searchPokemon(english, "farfetchd")[0]).toMatchObject({
      entry: farfetchd,
      match: "exact",
    });
    expect(searchPokemon(english, "farfetch'd")[0].entry.name.text).toBe("Farfetch’d");
  });

  it.each(["nidoran♀", "nidoranf", "Nidoran-F"])("resolves %s to the female Nidoran", (query) => {
    const results = searchPokemon(english, query);
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
      expect(searchPokemon(japanese, query)).toEqual([
        { entry: pikachuJa, match: "exact", introduction: null },
      ]);
    });

    it("keeps dakuten distinct", () => {
      expect(searchPokemon(japanese, "カ")).toEqual([]);
      expect(searchPokemon(japanese, "ガ")[0]).toMatchObject({ entry: growlithe, match: "prefix" });
      expect(searchPokemon(japanese, "カーディ")[0]).toMatchObject({
        entry: growlithe,
        match: "typo",
      });
      expect(searchPokemon(japanese, "がーでぃ")[0]).toMatchObject({
        entry: growlithe,
        match: "exact",
      });
    });
  });

  it("tolerates substitutions and transpositions", () => {
    expect(searchPokemon(english, "pikachi")[0]).toMatchObject({ entry: pikachu, match: "typo" });
    expect(searchPokemon(english, "bulbasuar")[0]).toMatchObject({
      entry: bulbasaur,
      match: "typo",
    });
    expect(searchPokemon(english, "bulbasaru")[0]).toMatchObject({
      entry: bulbasaur,
      match: "typo",
    });
    expect(searchPokemon(english, "pikahcu")[0]).toMatchObject({ entry: pikachu, match: "typo" });
  });

  it("does not typo-match queries shorter than four characters", () => {
    expect(searchPokemon(english, "pjk")).toEqual([]);
    expect(searchPokemon(english, "rqi")).toEqual([]);
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
    expect(searchPokemon(prepareSearchIndex(fixtures), "abra")).toEqual(expected);
    expect(searchPokemon(prepareSearchIndex([...fixtures].reverse()), "abra")).toEqual(expected);
    expect(searchPokemon(prepareSearchIndex(fixtures), "abra", { limit: 2 })).toEqual(
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
        searchPokemon(index, "testmon", { game }).map((result) => [
          result.entry.speciesId,
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
        searchPokemon(index, "testmon").map((result) => [
          result.entry.speciesId,
          result.introduction,
        ]),
      ).toEqual([
        [999, null],
        [1000, null],
        [1001, null],
        [1002, null],
        [1003, null],
      ]);
      expect(searchPokemon(index, "testmon", { game: null })[0].introduction).toBeNull();
    });

    it("does not let introduction outrank a better match", () => {
      const testmonite = entry({ speciesId: 1, name: "Testmonite" });
      const results = searchPokemon(prepareSearchIndex([testmonite, notIntroduced]), "testmon", {
        game,
      });
      expect(results.map((result) => [result.entry.speciesId, result.match])).toEqual([
        [999, "exact"],
        [1, "prefix"],
      ]);
    });
  });
});
