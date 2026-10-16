import { describe, expect, it } from "vite-plus/test";
import type { ReferencesQuery } from "../src/generated/operations.ts";
import { gameText, mapReferences } from "../src/mapping.ts";
import { validateBoundedRelationships } from "../src/operations.ts";

const census = { species: 0, pokemon: 0, forms: 0, learnsets: 0, evolutions: 0 };

function moveReferences(): ReferencesQuery {
  return {
    generations: [],
    generationsCount: { aggregate: { count: 0 } },
    versionGroups: [],
    versionGroupsCount: { aggregate: { count: 0 } },
    versionsCount: { aggregate: { count: 0 } },
    types: [],
    typesCount: { aggregate: { count: 0 } },
    stats: [],
    statsCount: { aggregate: { count: 0 } },
    abilities: [],
    abilitiesCount: { aggregate: { count: 0 } },
    moves: [
      {
        id: 85,
        identifier: "thunderbolt",
        generationId: 1,
        typeId: 13,
        damageClassId: 3,
        power: 90,
        accuracy: 100,
        pp: 15,
        priority: 0,
        effectChance: 10,
        effectId: 7,
        names: [{ languageId: 5, name: "Tonnerre" }],
        namesCount: { aggregate: { count: 1 } },
        flavorTexts: [{ languageId: 5, versionGroupId: 25, text: "Une attaque électrique." }],
        flavorTextsCount: { aggregate: { count: 1 } },
      },
    ],
    movesCount: { aggregate: { count: 1 } },
    moveEffects: [
      {
        id: 7,
        effects: [
          {
            languageId: 9,
            effect: "Has a $effect_chance% chance to paralyze.",
            shortEffect: "May paralyze.",
          },
        ],
        effectsCount: { aggregate: { count: 1 } },
      },
    ],
    moveEffectsCount: { aggregate: { count: 1 } },
    learnMethods: [],
    learnMethodsCount: { aggregate: { count: 0 } },
    items: [],
    itemsCount: { aggregate: { count: 0 } },
    evolutionTriggers: [],
    evolutionTriggersCount: { aggregate: { count: 0 } },
  };
}

describe("move reference mapping", () => {
  it("preserves source stats, localized descriptions and shared effect templates", () => {
    const raw = moveReferences();
    validateBoundedRelationships(raw);
    expect(mapReferences(raw, census).moves[0]).toEqual({
      id: 85,
      identifier: "thunderbolt",
      names: [{ languageId: 5, name: "Tonnerre" }],
      generationId: 1,
      typeId: 13,
      damageClassId: 3,
      power: 90,
      accuracy: 100,
      pp: 15,
      priority: 0,
      effectChance: 10,
      flavorTexts: raw.moves[0]!.flavorTexts,
      effects: raw.moveEffects[0]!.effects,
    });
  });

  it("preserves genuinely absent stats and descriptions without fabricated defaults", () => {
    const raw = moveReferences();
    const move = raw.moves[0]!;
    move.power = null;
    move.accuracy = null;
    move.pp = null;
    move.effectChance = null;
    move.effectId = null;
    move.flavorTexts = [];
    move.flavorTextsCount.aggregate!.count = 0;
    expect(mapReferences(raw, census).moves[0]).toMatchObject({
      power: null,
      accuracy: null,
      pp: null,
      effectChance: null,
      flavorTexts: [],
      effects: [],
    });
  });

  it("accepts an existing effect that has no upstream localized text", () => {
    const raw = moveReferences();
    raw.moveEffects[0]!.effects = [];
    raw.moveEffects[0]!.effectsCount.aggregate!.count = 0;
    validateBoundedRelationships(raw);
    expect(mapReferences(raw, census).moves[0]!.effects).toEqual([]);
  });

  it("rejects an unknown shared effect instead of silently dropping the relationship", () => {
    const raw = moveReferences();
    raw.moves[0]!.effectId = 999999;
    expect(() => mapReferences(raw, census)).toThrow("move.effectId 999999");
  });

  it("losslessly normalizes repeated identical upstream effect translations", () => {
    const raw = moveReferences();
    const effect = raw.moveEffects[0]!;
    effect.effects.push({ ...effect.effects[0]! });
    effect.effectsCount.aggregate!.count = 2;
    validateBoundedRelationships(raw);
    expect(mapReferences(raw, census).moves[0]!.effects).toEqual([effect.effects[0]]);
    expect(effect.effects).toHaveLength(2);
  });

  it("rejects conflicting translations sharing an effect and language identity", () => {
    const raw = moveReferences();
    const effect = raw.moveEffects[0]!;
    effect.effects.push({ ...effect.effects[0]!, effect: "Conflicting upstream effect." });
    effect.effectsCount.aggregate!.count = 2;
    validateBoundedRelationships(raw);
    expect(() => mapReferences(raw, census)).toThrow("Conflicting source move effect translation");
  });

  it("rejects missing required move identity facts and duplicated effect IDs", () => {
    const missing = moveReferences();
    missing.moves[0]!.typeId = null;
    expect(() => mapReferences(missing, census)).toThrow("move.typeId");
    const duplicate = moveReferences();
    duplicate.moveEffects.push({ ...duplicate.moveEffects[0]! });
    expect(() => mapReferences(duplicate, census)).toThrow("Duplicate source move effect id");
  });
});

describe("item reference mapping", () => {
  function itemReferences(): ReferencesQuery {
    const raw = moveReferences();
    raw.items = [
      {
        id: 83,
        identifier: "thunder-stone",
        names: [{ languageId: 5, name: "Pierre Foudre" }],
        namesCount: { aggregate: { count: 1 } },
        flavorTexts: [
          { languageId: 5, versionGroupId: 25, text: "Une pierre particulière." },
          { languageId: 5, versionGroupId: 15, text: "Une ancienne description." },
        ],
        flavorTextsCount: { aggregate: { count: 2 } },
        effects: [{ languageId: 9, effect: "Evolves certain Pokémon.", shortEffect: "Evolution." }],
        effectsCount: { aggregate: { count: 1 } },
      },
    ];
    raw.itemsCount.aggregate!.count = 1;
    return raw;
  }

  it("preserves localized names, full/short effects and exact version-group flavor text", () => {
    const raw = itemReferences();
    validateBoundedRelationships(raw);
    expect(mapReferences(raw, census).items[0]).toEqual({
      id: 83,
      identifier: "thunder-stone",
      names: raw.items[0]!.names,
      flavorTexts: raw.items[0]!.flavorTexts,
      effects: raw.items[0]!.effects,
    });
  });

  it("preserves genuine absent item text without creating defaults", () => {
    const raw = itemReferences();
    const item = raw.items[0]!;
    item.flavorTexts = [];
    item.flavorTextsCount.aggregate!.count = 0;
    item.effects = [];
    item.effectsCount.aggregate!.count = 0;
    validateBoundedRelationships(raw);
    expect(mapReferences(raw, census).items[0]).toMatchObject({ flavorTexts: [], effects: [] });
  });

  it("rejects missing source language and version-group relationships", () => {
    const raw = itemReferences();
    raw.items[0]!.flavorTexts[0]!.versionGroupId = null;
    expect(() => mapReferences(raw, census)).toThrow("item.flavor.versionGroupId");
    raw.items[0]!.flavorTexts[0]!.versionGroupId = 25;
    raw.items[0]!.effects[0]!.languageId = null;
    expect(() => mapReferences(raw, census)).toThrow("item.effect.languageId");
  });
});

describe("game text normalization", () => {
  it("joins cartridge text-box wrapping into prose", () => {
    expect(
      gameText("Exposure to sun\u00ad\nlight adds to its\nstrength. Sunlight\falso grows."),
    ).toBe("Exposure to sunlight adds to its strength. Sunlight also grows.");
    expect(gameText("Heightens the critical-\nhit ratios of moves.")).toBe(
      "Heightens the critical-hit ratios of moves.",
    );
    expect(gameText("Boosts resistance to Fire-\nand Ice-type moves.")).toBe(
      "Boosts resistance to Fire- and Ice-type moves.",
    );
    expect(gameText("でんきタイプの　技を　自分に\n寄せつけ")).toBe(
      "でんきタイプの　技を　自分に寄せつけ",
    );
  });

  it("treats literal upstream \\n escape sequences as wraps in mapped flavor text", () => {
    const raw = moveReferences();
    raw.abilities = [
      {
        id: 31,
        identifier: "lightning-rod",
        names: [{ languageId: 5, name: "Paratonnerre" }],
        namesCount: { aggregate: { count: 1 } },
        flavorTexts: [
          { languageId: 5, versionGroupId: 25, text: "Attire les capacités\\nde type Électrik." },
        ],
        flavorTextsCount: { aggregate: { count: 1 } },
        effects: [],
        effectsCount: { aggregate: { count: 0 } },
      },
    ];
    raw.abilitiesCount.aggregate!.count = 1;
    const references = mapReferences(raw, census);
    expect(references.abilities[0]!.flavorTexts[0]!.text).toBe(
      "Attire les capacités de type Électrik.",
    );
  });
});
