import { describe, expect, it } from "vite-plus/test";
import type { Language, Move, MoveMeta } from "../../../../../packages/pokemon-data/src/index.ts";
import { buildMoveProperties } from "./move-properties.ts";
import { t } from "../i18n/move-properties.ts";

function move(meta: MoveMeta | null): Pick<Move, "target" | "attributes" | "statChanges" | "meta"> {
  return { target: null, attributes: [], statChanges: [], meta };
}
function metadata(overrides: Partial<MoveMeta> = {}): MoveMeta {
  return {
    ailment: null,
    category: null,
    minHits: null,
    maxHits: null,
    minTurns: null,
    maxTurns: null,
    healing: 0,
    drain: 0,
    critRate: 0,
    ailmentChance: 0,
    flinchChance: 0,
    statChance: 0,
    ...overrides,
  };
}

describe("move battle properties", () => {
  it("distinguishes recoil from healing and critical stages from percentages", () => {
    const result = buildMoveProperties(
      move(metadata({ drain: -25, healing: 50, critRate: 2 })),
      [],
      "en",
    );
    expect(result.metadata?.rows).toEqual([
      { key: "healing", value: "50% of maximum HP" },
      { key: "drain", value: "-25% of damage dealt (recoil)" },
      { key: "critRate", value: "+2" },
    ]);
    const drain = buildMoveProperties(move(metadata({ drain: 75 })), [], "en");
    expect(drain.metadata?.rows).toEqual([{ key: "drain", value: "+75% of damage dealt (drain)" }]);
  });

  it.each([
    { name: "Struggle (165)", healing: -25 },
    { name: "Clangorous Soul (775)", healing: -33 },
  ])(
    "shows $name's signed healing as a maximum-HP cost, not damage-based recoil",
    ({ healing }) => {
      const result = buildMoveProperties(move(metadata({ healing, drain: 0 })), [], "en");
      const expected = { key: "hpCost", value: `${Math.abs(healing)}% of maximum HP` };
      expect(result.metadata?.rows).toEqual([expected]);
      expect(result.metadata?.allRows.filter((row) => row.key === "hpCost")).toEqual([expected]);
      expect(result.metadata?.allRows.some((row) => row.key === "healing")).toBe(false);
      expect(result.metadata?.allRows.find((row) => row.key === "drain")?.value).toBe(
        "0% of damage dealt (source value)",
      );
    },
  );

  it.each<{ lang: Language; label: string; value: string }>([
    { lang: "en", label: "HP cost", value: "25% of maximum HP" },
    { lang: "fr", label: "Coût en PV", value: "25 % des PV maximaux" },
    { lang: "ja", label: "消費HP", value: "最大HPの 25%" },
  ])("localizes maximum-HP costs in $lang", ({ lang, label, value }) => {
    const result = buildMoveProperties(move(metadata({ healing: -25, drain: 0 })), [], lang);
    expect(result.metadata?.rows).toEqual([{ key: "hpCost", value }]);
    expect(t(lang, "hpCost")).toBe(label);
  });

  it("keeps Giga Drain's healing based on damage dealt", () => {
    const result = buildMoveProperties(move(metadata({ healing: 0, drain: 50 })), [], "en");
    expect(result.metadata?.rows).toEqual([
      { key: "drain", value: "+50% of damage dealt (drain)" },
    ]);
  });

  it("keeps zero and missing metadata distinct without filling the summary with zero rows", () => {
    const result = buildMoveProperties(move(metadata()), [], "en");
    expect(result.metadata?.rows).toEqual([]);
    expect(result.metadata?.allRows).toEqual([
      { key: "hits", value: "Not recorded" },
      { key: "turns", value: "Not recorded" },
      { key: "healing", value: "0% of maximum HP" },
      { key: "drain", value: "0% of damage dealt (source value)" },
      { key: "critRate", value: "0" },
      { key: "ailmentChance", value: "0% (conditional or unspecified in source)" },
      { key: "flinchChance", value: "0% (conditional or unspecified in source)" },
      { key: "statChance", value: "0% (conditional or unspecified in source)" },
    ]);
    const missing = buildMoveProperties(
      move(
        metadata({
          healing: null,
          drain: null,
          critRate: null,
          ailmentChance: null,
          flinchChance: null,
          statChance: null,
        }),
      ),
      [],
      "en",
    );
    expect(missing.metadata?.allRows.map((row) => row.value)).toEqual(
      Array(8).fill("Not recorded"),
    );
    expect(buildMoveProperties(move(null), [], "en").metadata).toBeNull();
  });

  it("shows conditional zero chances when an ailment or stat change is recorded", () => {
    const meta = metadata({
      ailment: { id: 4, identifier: "burn", names: [{ languageId: 9, name: "Burn" }] },
      flinchChance: 30,
    });
    const source = move(meta);
    source.statChanges = [{ statId: 2, change: -1 }];
    const result = buildMoveProperties(
      source,
      [{ id: 2, identifier: "attack", names: [{ languageId: 9, name: "Attack" }] }],
      "en",
    );
    expect(result.metadata?.rows).toEqual([
      { key: "ailmentChance", value: "0% (conditional or unspecified in source)" },
      { key: "flinchChance", value: "30%" },
      { key: "statChance", value: "0% (conditional or unspecified in source)" },
    ]);
    expect(result.statChanges[0]).toMatchObject({
      id: 2,
      name: { text: "Attack" },
      stages: "-1 stage",
    });
    meta.ailmentChance = null;
    meta.statChance = null;
    const missing = buildMoveProperties(source, [], "en");
    expect(missing.metadata?.rows).toContainEqual({ key: "ailmentChance", value: "Not recorded" });
    expect(missing.metadata?.rows).toContainEqual({ key: "statChance", value: "Not recorded" });
  });

  it("retains single, bounded and partially recorded hit and turn ranges, including zero", () => {
    const result = buildMoveProperties(
      move(
        metadata({
          minHits: 2,
          maxHits: 5,
          minTurns: 3,
          maxTurns: 3,
        }),
      ),
      [],
      "en",
    );
    expect(result.metadata?.rows).toEqual([
      { key: "hits", value: "2–5" },
      { key: "turns", value: "3" },
    ]);
    const partial = buildMoveProperties(move(metadata({ minHits: 0, maxTurns: 4 })), [], "en");
    expect(partial.metadata?.rows).toEqual([
      { key: "hits", value: "At least 0; maximum not recorded" },
      { key: "turns", value: "Up to 4; minimum not recorded" },
    ]);
  });

  it("uses source translations for targets, flags, stats, ailments and effect categories", () => {
    const source = move(
      metadata({
        ailment: { id: 4, identifier: "burn", names: [{ languageId: 5, name: "Brûlure" }] },
        category: {
          id: 4,
          identifier: "damage+ailment",
          descriptions: [
            { languageId: 5, description: "Inflige des dégâts et une altération d’état." },
          ],
        },
      }),
    );
    source.target = {
      id: 10,
      identifier: "selected-pokemon",
      names: [{ languageId: 5, name: "Pokémon choisi" }],
    };
    source.attributes = [
      { id: 1, identifier: "contact", names: [{ languageId: 5, name: "Contact" }] },
    ];
    source.statChanges = [{ statId: 2, change: 2 }];
    const result = buildMoveProperties(
      source,
      [{ id: 2, identifier: "attack", names: [{ languageId: 5, name: "Attaque" }] }],
      "fr",
    );
    expect(result.target).toMatchObject({ text: "Pokémon choisi", fallback: false });
    expect(result.flags[0]).toMatchObject({ text: "Contact", fallback: false });
    expect(result.statChanges[0]).toMatchObject({
      name: { text: "Attaque" },
      stages: "+2 niveaux",
    });
    expect(result.metadata?.ailment).toMatchObject({ text: "Brûlure", fallback: false });
    expect(result.metadata?.category).toMatchObject({
      text: "Inflige des dégâts et une altération d’état.",
      fallback: false,
    });
  });

  it("keeps Japanese kana and English or identifier fallbacks visible rather than inventing translations", () => {
    const source = move(
      metadata({
        category: {
          id: 0,
          identifier: "damage",
          descriptions: [{ languageId: 9, description: "Inflicts damage" }],
        },
      }),
    );
    source.target = {
      id: 10,
      identifier: "selected-pokemon",
      names: [{ languageId: 1, name: "えらんだポケモン" }],
    };
    source.attributes = [{ id: 1, identifier: "contact", names: [] }];
    source.statChanges = [{ statId: 2, change: 1 }];
    const result = buildMoveProperties(
      source,
      [{ id: 2, identifier: "attack", names: [{ languageId: 11, name: "こうげき" }] }],
      "ja",
    );
    expect(result.target).toMatchObject({ text: "えらんだポケモン", sourceLanguageId: 1 });
    expect(result.flags[0]).toMatchObject({
      text: "contact",
      sourceLanguageId: null,
      fallback: true,
    });
    expect(result.metadata?.category).toMatchObject({
      text: "Inflicts damage",
      sourceLanguageId: 9,
      fallback: true,
    });
    expect(result.statChanges[0]).toMatchObject({ name: { text: "こうげき" }, stages: "+1 段階" });
    expect(result.metadata?.allRows).toContainEqual({
      key: "ailmentChance",
      value: "0%（出典では条件付き、または未指定）",
    });
  });
});
