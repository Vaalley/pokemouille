import { describe, expect, it } from "vite-plus/test";
import { buildSearchIndex, getMainSeriesGames, resolvePokemon } from "../src/index.ts";
import type { Language } from "../src/index.ts";
import { fixture } from "./fixtures.ts";

function setup() {
  const snapshot = fixture();
  const record = snapshot.species[0]!;
  const variety = record.varieties[0]!;
  return { ...snapshot, record, variety };
}

describe("historical Pokémon resolution", () => {
  it("merges sparse stat history per stat and uses Generation I Special only", () => {
    const { record, references } = setup();
    const red = resolvePokemon(record, references, { language: "en", version: "red" });
    expect(red.stats).toMatchObject({
      status: "available",
      value: [
        { id: 1, value: 35 },
        { id: 2, value: 55 },
        { id: 3, value: 30 },
        { id: 6, value: 90 },
        { id: 9, value: 50 },
      ],
    });
    expect(
      resolvePokemon(record, references, { language: "en", version: "black" }).stats,
    ).toMatchObject({
      value: expect.arrayContaining([
        { id: 3, value: 30, effort: 0, name: expect.anything() },
        { id: 5, value: 40, effort: 0, name: expect.anything() },
      ]),
    });
    expect(
      resolvePokemon(record, references, { language: "en", version: "x" }).stats,
    ).toMatchObject({
      value: expect.arrayContaining([
        { id: 3, value: 40, effort: 0, name: expect.anything() },
        { id: 5, value: 50, effort: 0, name: expect.anything() },
      ]),
    });
  });

  it("selects the earliest applicable sparse bound independently for each stat", () => {
    const { record, references, variety } = setup();
    variety.statHistory.push({ generationId: 1, statId: 3, baseStat: 25, effort: 0 });
    expect(
      resolvePokemon(record, references, { language: "en", version: "red" }).stats,
    ).toMatchObject({
      value: expect.arrayContaining([
        expect.objectContaining({ id: 3, value: 25 }),
        expect.objectContaining({ id: 9, value: 50 }),
      ]),
    });
    expect(
      resolvePokemon(record, references, { language: "en", version: "platinum" }).stats,
    ).toMatchObject({
      value: expect.arrayContaining([
        expect.objectContaining({ id: 3, value: 30 }),
        expect.objectContaining({ id: 5, value: 40 }),
      ]),
    });
  });

  it("uses inclusive type-history bounds, without changing the modern types", () => {
    const { record, references, variety } = setup();
    variety.types = [{ slot: 1, typeId: 18 }];
    variety.typeHistory = [{ generationId: 5, types: [{ slot: 1, typeId: 1 }] }];
    expect(
      resolvePokemon(record, references, { language: "en", version: "black" }).types,
    ).toMatchObject({ value: [{ id: 1 }] });
    expect(
      resolvePokemon(record, references, { language: "en", version: "x" }).types,
    ).toMatchObject({ value: [{ id: 18 }] });
  });

  it("resolves ability changes per slot and preserves historically absent slots", () => {
    const { record, references, variety } = setup();
    variety.abilities = [
      { slot: 1, abilityId: 130, isHidden: false },
      { slot: 3, abilityId: 31, isHidden: true },
    ];
    variety.abilityHistory.push({ generationId: 6, slot: 1, abilityId: 26, isHidden: false });
    expect(
      resolvePokemon(record, references, { language: "en", version: "red" }).abilities.status,
    ).toBe("not-applicable");
    expect(
      resolvePokemon(record, references, { language: "en", version: "platinum" }).abilities,
    ).toMatchObject({ value: [{ id: 26, slot: 1 }] });
    expect(
      resolvePokemon(record, references, { language: "en", version: "x" }).abilities,
    ).toMatchObject({ value: [{ id: 26 }, { id: 31 }] });
    expect(
      resolvePokemon(record, references, { language: "en", version: "sun" }).abilities,
    ).toMatchObject({ value: [{ id: 130 }, { id: 31 }] });
  });

  it("does not substitute a same-generation learnset or another game’s text", () => {
    const { record, references } = setup();
    expect(resolvePokemon(record, references, { language: "fr", version: "red" })).toMatchObject({
      learnset: { value: [{ moveId: 98, level: 16 }] },
      flavorText: {
        value: { text: "Red only", sourceLanguageId: 9, requestedLanguage: "fr", fallback: true },
      },
    });
    expect(
      resolvePokemon(record, references, { language: "en", version: "yellow" }).learnset,
    ).toMatchObject({
      value: [
        { moveId: 98, level: 11 },
        { moveId: 85, level: 26 },
      ],
    });
    expect(
      resolvePokemon(record, references, { language: "en", version: "platinum" }).flavorText.status,
    ).toBe("missing");
    expect(
      resolvePokemon(record, references, { language: "en", version: "platinum" }).learnset.status,
    ).toBe("missing");
  });

  it("keeps current source scalars explicitly non-historical in old-game contexts", () => {
    const { record, references } = setup();
    const result = resolvePokemon(record, references, { language: "en", version: "red" });
    expect(result.physical).toMatchObject({
      status: "available",
      value: { scope: "current-not-game-specific", baseExperience: 112 },
    });
    expect(result.speciesFacts).toMatchObject({
      status: "available",
      value: { scope: "current-not-game-specific", captureRate: 190, baseHappiness: 50 },
    });
  });

  it("retains Japanese kana fallback and labels detailed ability effects as current", () => {
    const { record, references } = setup();
    references.abilities[0]!.flavorTexts = [{ versionGroupId: 15, languageId: 11, text: "日本語" }];
    references.abilities[0]!.effects = [
      { languageId: 9, effect: "Current effect", shortEffect: "Effect" },
    ];
    const result = resolvePokemon(record, references, { language: "ja", version: "x" });
    expect(result.name).toMatchObject({ text: "ピカチュウ", sourceLanguageId: 1, fallback: true });
    expect(result.abilities).toMatchObject({
      value: [
        {
          flavorText: { value: { text: "日本語", fallback: false } },
          currentEffect: { value: { text: "Current effect", fallback: true } },
        },
        {},
      ],
    });
    expect(
      resolvePokemon(record, references, { language: "ja", version: "sun" }).abilities,
    ).toMatchObject({ value: [{ flavorText: { status: "missing" } }, {}] });
  });

  it("falls back ja → ja-kana → en within the exact game’s flavor text only", () => {
    const { record, references } = setup();
    record.flavorTexts = [
      { languageId: 9, versionId: 1, text: "Red" },
      { languageId: 1, versionId: 1, text: "あか" },
      { languageId: 9, versionId: 3, text: "Yellow" },
      { languageId: 11, versionId: 3, text: "黄" },
    ];
    const ja = (version: string) =>
      resolvePokemon(record, references, { language: "ja", version }).flavorText;
    expect(ja("yellow")).toMatchObject({
      value: { text: "黄", sourceLanguageId: 11, fallback: false },
    });
    expect(ja("red")).toMatchObject({
      value: { text: "あか", sourceLanguageId: 1, requestedLanguage: "ja", fallback: true },
    });
    record.flavorTexts = record.flavorTexts.filter((row) => row.languageId !== 1);
    expect(ja("red")).toMatchObject({
      value: { text: "Red", sourceLanguageId: 9, requestedLanguage: "ja", fallback: true },
    });
    expect(ja("platinum").status).toBe("missing");
  });

  it("orders form introduction by version-group chronology, not IDs or generation alone", () => {
    const { record, references, variety } = setup();
    record.generationId = 4;
    const platinum = references.versionGroups.find((row) => row.id === 9)!;
    platinum.id = 100;
    references.versions.find((row) => row.identifier === "platinum")!.versionGroupId = 100;
    variety.forms[0]!.versionGroupId = 100;
    variety.forms[0]!.identifier = "rotom-wash";
    variety.typeHistory = [
      {
        generationId: 4,
        types: [
          { slot: 1, typeId: 13 },
          { slot: 2, typeId: 8 },
        ],
      },
    ];
    variety.types = [
      { slot: 1, typeId: 13 },
      { slot: 2, typeId: 11 },
    ];
    expect(resolvePokemon(record, references, { language: "en", version: "red" }).status).toBe(
      "not-introduced",
    );
    const early = resolvePokemon(record, references, {
      language: "en",
      version: "diamond",
      form: "rotom-wash",
    });
    expect(early.status).toBe("not-introduced");
    expect(early.types.status).toBe("missing");
    expect(
      resolvePokemon(record, references, {
        language: "en",
        version: "platinum",
        form: "rotom-wash",
      }),
    ).toMatchObject({ status: "available", types: { value: [{ id: 13 }, { id: 8 }] } });
    expect(
      resolvePokemon(record, references, { language: "en", version: "black", form: "rotom-wash" })
        .types,
    ).toMatchObject({ value: [{ id: 13 }, { id: 11 }] });
  });

  it("distinguishes unknown form introduction from not introduced and rejects invalid context", () => {
    const { record, references, variety } = setup();
    variety.forms[0]!.versionGroupId = null;
    expect(resolvePokemon(record, references, { language: "en", version: "red" }).status).toBe(
      "unknown",
    );
    expect(() =>
      resolvePokemon(record, references, { language: "en", version: "missing" }),
    ).toThrow();
    expect(() =>
      resolvePokemon(record, references, { language: "en", version: "red", form: "missing" }),
    ).toThrow();
    expect(() =>
      resolvePokemon(record, references, { language: "de" as Language, version: "red" }),
    ).toThrow();
    expect(() =>
      resolvePokemon(record, references, { language: "en", version: "champions" }),
    ).toThrow();
    expect(() =>
      resolvePokemon(record, references, { language: "en", version: "the-teal-mask-scarlet" }),
    ).toThrow();
  });

  it("exposes evolution source introduction/default without claiming game applicability", () => {
    const { record, references } = setup();
    record.evolutions = [
      {
        id: 1,
        evolvedSpeciesId: 25,
        triggerId: 1,
        versionGroupId: 25,
        isDefault: true,
        conditions: { evolution_expression_id: 2, required_form_id: 25, minimum_level: 20 },
      },
    ];
    expect(
      resolvePokemon(record, references, { language: "en", version: "red" }).evolution,
    ).toMatchObject({
      applicability: "unresolved",
      methods: [{ versionGroupId: 25, isDefault: true, conditions: { required_form_id: 25 } }],
    });
  });

  it("attaches DLC coverage to its base game without inventing inherited rows", () => {
    const { record, references } = setup();
    const games = getMainSeriesGames(references);
    expect(
      games.some(
        (game) =>
          game.version.identifier === "champions" ||
          game.version.identifier === "the-teal-mask-scarlet",
      ),
    ).toBe(false);
    const result = resolvePokemon(record, references, { language: "en", version: "scarlet" });
    expect(result.coverage.expansions).toMatchObject([
      {
        group: { identifier: "the-teal-mask" },
        coverage: { learnsetRows: 0 },
        coverageState: { learnsets: "missing", speciesFlavorTexts: "missing" },
      },
      {
        identifier: "the-indigo-disk",
        group: null,
        coverage: null,
        coverageState: { learnsets: "missing", speciesFlavorTexts: "missing" },
      },
    ]);
    expect(result.learnset.status).toBe("missing");
    expect(result.availability.status).toBe("unknown");
  });

  it("indexes alternate forms with selected-language and English aliases only", () => {
    const { references, species, variety } = setup();
    variety.forms.push({
      ...variety.forms[0]!,
      id: 10059,
      identifier: "pikachu-costume",
      formIdentifier: "costume",
      isDefault: false,
      names: [{ languageId: 9, name: "Costume Pikachu" }],
      formNames: [{ languageId: 5, name: "Costume" }],
    });
    const entries = buildSearchIndex({ references, species }, "fr");
    expect(entries).toHaveLength(2);
    expect(entries[1]).toMatchObject({
      speciesId: 25,
      pokemonId: 25,
      formId: 10059,
      aliases: expect.arrayContaining(["Costume Pikachu", "Costume", "pikachu-costume", "25"]),
    });
    expect(entries[1]!.aliases).not.toContain("ピカチュウ");
    expect(buildSearchIndex({ references, species }, "ja")[0]!.aliases).toContain("ピカチュウ");
  });

  it("names a default form after its species when only another language names the form", () => {
    const { record, references, variety } = setup();
    variety.forms[0]!.names = [
      { languageId: 5, name: "Pikachu (forme)" },
      { languageId: 9, name: "" },
    ];
    const result = resolvePokemon(record, references, { language: "en", version: "red" });
    expect(result.name).toMatchObject({ text: "Pikachu", fallback: false });
  });
});
