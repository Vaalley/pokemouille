import { describe, expect, it } from "vite-plus/test";
import type {
  FlavorText,
  ReferenceData,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { fixture } from "../../../../../packages/pokemon-data/tests/fixtures.ts";
import {
  dexEntries,
  hasRecordedChange,
  normalizeFlavorText,
  pokemonHistory,
  toSegments,
} from "./pokemon-history.ts";

/** The package fixture plus one selectable game in each generation it lacks (II, III, VIII). */
function everyGeneration(): { references: ReferenceData; record: SpeciesRecord } {
  const { references, species } = fixture();
  references.versionGroups.push(
    { id: 3, identifier: "gold-silver", generationId: 2, order: 3 },
    { id: 5, identifier: "ruby-sapphire", generationId: 3, order: 5 },
    { id: 20, identifier: "sword-shield", generationId: 8, order: 20 },
  );
  references.versions.push(
    { id: 4, identifier: "gold", versionGroupId: 3, names: [] },
    { id: 7, identifier: "ruby", versionGroupId: 5, names: [] },
    { id: 33, identifier: "sword", versionGroupId: 20, names: [] },
  );
  return { references, record: species[0]! };
}

const values = <T>(segments: { from: number; to: number; value: T | null }[]) =>
  segments.map(({ from, to, value }) => [from, to, value] as const);

describe("toSegments", () => {
  it("merges consecutive equal values and keeps unknown ranges separate from known ones", () => {
    const points = [
      { generationId: 1, value: 1 },
      { generationId: 2, value: 1 },
      { generationId: 3, value: null },
      { generationId: 4, value: null },
      { generationId: 5, value: 1 },
      { generationId: 6, value: 2 },
    ];
    expect(values(toSegments(points, (a, b) => a === b))).toEqual([
      [1, 2, 1],
      [3, 4, null],
      [5, 5, 1],
      [6, 6, 2],
    ]);
  });
});

describe("pokemonHistory", () => {
  it("places stat changes by generation and keeps Generation I's Special to Generation I", () => {
    const { references, record } = everyGeneration();
    const history = pokemonHistory(record, references, { language: "en" });
    expect(history.generations).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const stat = (id: number) => history.stats.find((row) => row.id === id)!;
    expect(values(stat(3).base)).toEqual([
      [1, 5, 30],
      [6, 9, 40],
    ]);
    expect(values(stat(5).base)).toEqual([
      [2, 5, 40],
      [6, 9, 50],
    ]);
    expect(values(stat(9).base)).toEqual([[1, 1, 50]]);
    expect(values(stat(4).base)).toEqual([[2, 9, 50]]);
    // Latest layout order first, then the Generation I-only Special.
    expect(history.stats.map((row) => row.id)).toEqual([1, 2, 3, 4, 5, 6, 9]);
    expect(hasRecordedChange(history)).toBe(true);
  });

  it("starts abilities at Generation III and distinguishes a recorded empty slot", () => {
    const { references, record } = everyGeneration();
    const history = pokemonHistory(record, references, { language: "en" });
    expect(
      history.abilities.map(({ slot, isHidden, segments }) => [
        slot,
        isHidden,
        segments.map(({ from, to, value }) => [
          from,
          to,
          value === null || value === "none" ? value : value.id,
        ]),
      ]),
    ).toEqual([
      [1, false, [[3, 9, 9]]],
      [
        3,
        true,
        [
          [3, 4, "none"],
          [5, 9, 31],
        ],
      ],
    ]);
  });

  it("follows resolvePokemon's type and ability bounds (earliest inclusive upper bound wins)", () => {
    const { references, record } = everyGeneration();
    const variety = record.varieties[0]!;
    variety.types = [{ slot: 1, typeId: 18 }];
    variety.typeHistory = [{ generationId: 5, types: [{ slot: 1, typeId: 1 }] }];
    variety.abilities = [{ slot: 1, abilityId: 130, isHidden: false }];
    variety.abilityHistory = [{ generationId: 6, slot: 1, abilityId: 26, isHidden: false }];
    variety.statHistory = [
      { generationId: 1, statId: 9, baseStat: 50, effort: 0 },
      { generationId: 2, statId: 1, baseStat: 10, effort: 0 },
      { generationId: 5, statId: 1, baseStat: 20, effort: 1 },
    ];
    const history = pokemonHistory(record, references, { language: "en" });
    expect(
      values(history.types).map(([from, to, types]) => [from, to, types?.map((type) => type.id)]),
    ).toEqual([
      [1, 5, [1]],
      [6, 9, [18]],
    ]);
    expect(
      history.abilities[0]!.segments.map(({ from, to, value }) => [
        from,
        to,
        value === null || value === "none" ? value : value.id,
      ]),
    ).toEqual([
      [3, 6, 26],
      [7, 9, 130],
    ]);
    const hp = history.stats.find((row) => row.id === 1)!;
    expect(values(hp.base)).toEqual([
      [1, 2, 10],
      [3, 5, 20],
      [6, 9, 35],
    ]);
    expect(values(hp.effort)).toEqual([
      [1, 2, 0],
      [3, 5, 1],
      [6, 9, 0],
    ]);
  });

  it("marks generations without a selectable game as unknown instead of interpolating", () => {
    const { references, species } = fixture();
    const history = pokemonHistory(species[0]!, references, { language: "en" });
    expect(history.generations).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(
      values(history.types).map(([from, to, types]) => [from, to, types && types.length]),
    ).toEqual([
      [1, 1, 1],
      [2, 3, null],
      [4, 7, 1],
      [8, 8, null],
      [9, 9, 1],
    ]);
  });

  it("reports no change when every field keeps one value", () => {
    const { references, record } = everyGeneration();
    const variety = record.varieties[0]!;
    variety.statHistory = [{ generationId: 1, statId: 9, baseStat: 50, effort: 0 }];
    variety.abilityHistory = [];
    variety.abilities = [{ slot: 1, abilityId: 9, isHidden: false }];
    expect(hasRecordedChange(pokemonHistory(record, references, { language: "en" }))).toBe(false);
  });

  it("starts at the selected form's introduction and places nothing when it is unknown", () => {
    const { references, record } = everyGeneration();
    const form = record.varieties[0]!.forms[0]!;
    form.versionGroupId = 15;
    expect(pokemonHistory(record, references, { language: "en" }).generations).toEqual([
      6, 7, 8, 9,
    ]);
    form.versionGroupId = null;
    expect(pokemonHistory(record, references, { language: "en" })).toMatchObject({
      generations: [],
      types: [],
      stats: [],
      abilities: [],
    });
  });

  it("uses the selected alternate variety's own history and introduction", () => {
    const { references, record } = everyGeneration();
    const alternate = structuredClone(record.varieties[0]!);
    alternate.id = 10025;
    alternate.identifier = "pikachu-alternate";
    alternate.isDefault = false;
    alternate.types = [{ slot: 1, typeId: 18 }];
    alternate.typeHistory = [];
    alternate.forms[0]!.id = 10025;
    alternate.forms[0]!.identifier = "pikachu-alternate";
    alternate.forms[0]!.versionGroupId = 15;
    record.varieties.push(alternate);
    const history = pokemonHistory(record, references, {
      language: "en",
      form: "pikachu-alternate",
    });
    expect(history.generations).toEqual([6, 7, 8, 9]);
    expect(
      history.types.map(({ from, to, value }) => [from, to, value?.map((type) => type.id)]),
    ).toEqual([[6, 9, [18]]]);
  });

  it("does not treat source gaps as recorded changes", () => {
    const { references, species } = fixture();
    const variety = species[0]!.varieties[0]!;
    variety.statHistory = [{ generationId: 1, statId: 9, baseStat: 50, effort: 0 }];
    variety.abilityHistory = [];
    variety.abilities = [{ slot: 1, abilityId: 9, isHidden: false }];
    expect(hasRecordedChange(pokemonHistory(species[0]!, references, { language: "en" }))).toBe(
      false,
    );
  });
});

describe("dexEntries", () => {
  const references = {
    versionGroups: [
      { id: 2, identifier: "later", generationId: 2, order: 2 },
      { id: 1, identifier: "earlier", generationId: 1, order: 1 },
    ],
    versions: [
      { id: 1, identifier: "late", versionGroupId: 2, names: [] },
      { id: 9, identifier: "early-a", versionGroupId: 1, names: [] },
      { id: 3, identifier: "early-b", versionGroupId: 1, names: [] },
      { id: 4, identifier: "late-b", versionGroupId: 2, names: [] },
    ],
  };
  const text = (versionId: number, languageId: number, value: string): FlavorText => ({
    versionId,
    languageId,
    text: value,
  });
  const rows = (flavorTexts: FlavorText[], language: "en" | "fr" | "ja") =>
    dexEntries(flavorTexts, references, language).map((row) => [
      row.versions.map((version) => version.identifier),
      row.text.text,
      row.text.fallback,
    ]);

  it("orders by release chronology and merges only exactly identical source texts", () => {
    expect(
      rows(
        [
          text(1, 9, "Later text"),
          text(3, 9, "Shared text"),
          text(9, 9, "Shared text"),
          text(4, 9, "Shared text"),
        ],
        "en",
      ),
    ).toEqual([
      [["early-a", "early-b", "late-b"], "Shared text", false],
      [["late"], "Later text", false],
    ]);
  });

  it("does not merge distinct source text whose cartridge line breaks normalize alike", () => {
    expect(rows([text(9, 9, "Shared\ntext"), text(3, 9, "Shared text")], "en")).toEqual([
      [["early-a"], "Shared text", false],
      [["early-b"], "Shared text", false],
    ]);
  });

  it("falls back per version only, and leaves out versions without text in the chain", () => {
    expect(
      rows(
        [text(9, 5, "Texte"), text(9, 9, "Text"), text(3, 9, "Text"), text(1, 1, "テキスト")],
        "fr",
      ),
    ).toEqual([
      [["early-a"], "Texte", false],
      [["early-b"], "Text", true],
    ]);
  });

  it("keeps an English fallback distinct from the same words in the requested language", () => {
    expect(rows([text(9, 11, "Text"), text(3, 9, "Text")], "ja")).toEqual([
      [["early-a"], "Text", false],
      [["early-b"], "Text", true],
    ]);
  });
});

describe("normalizeFlavorText", () => {
  it("joins soft-hyphen breaks and uses an ideographic space for Japanese line breaks", () => {
    expect(normalizeFlavorText("elec\u00ad\ntric\nmouse\fhere", 9)).toBe("electric mouse here");
    expect(normalizeFlavorText("でんき\nねずみ", 11)).toBe("でんき\u3000ねずみ");
  });
});
