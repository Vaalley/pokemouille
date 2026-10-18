import { describe, expect, it } from "vite-plus/test";
import type {
  EncounterReferencesQuery,
  ReferencesQuery,
  SpeciesPageQuery,
} from "../src/generated/operations.ts";
import {
  gameText,
  mapEncounterReferences,
  mapReferences,
  mapSpecies,
  validateEncounterReferenceCensus,
} from "../src/mapping.ts";
import { loadOperations, validateBoundedRelationships } from "../src/operations.ts";
import { fixture } from "../../../packages/pokemon-data/tests/fixtures.ts";
import { validateSnapshot } from "../../../packages/pokemon-data/src/index.ts";

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
    machines: [],
    machinesCount: { aggregate: { count: 0 } },
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
        target: null,
        attributes: [],
        attributesCount: { aggregate: { count: 0 } },
        statChanges: [],
        statChangesCount: { aggregate: { count: 0 } },
        meta: [],
        metaCount: { aggregate: { count: 0 } },
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
    eggGroups: [],
    eggGroupsCount: { aggregate: { count: 0 } },
    pokedexes: [],
    pokedexesCount: { aggregate: { count: 0 } },
    regions: [],
    regionsCount: { aggregate: { count: 0 } },
  };
}

describe("reference operation diagnostics", () => {
  it("identifies stale response aliases without including source prose", async () => {
    const operations = await loadOperations();
    const raw = moveReferences();
    for (const key of ["eggGroups", "pokedexes", "regions"]) {
      Reflect.deleteProperty(raw, key);
      Reflect.deleteProperty(raw, `${key}Count`);
    }
    expect(() => operations.references.validate(raw, {})).toThrow(
      /Missing reference resource arrays: eggGroups, pokedexes, regions; returned fields: .*moves:array/,
    );
    expect(() => operations.references.validate(raw, {})).not.toThrow("Une attaque électrique.");
  });
});

describe("ability reference mapping", () => {
  function abilityReferences(): ReferencesQuery {
    const raw = moveReferences();
    raw.abilities = [
      {
        id: 31,
        identifier: "lightning-rod",
        generationId: 3,
        names: [],
        namesCount: { aggregate: { count: 0 } },
        flavorTexts: [],
        flavorTextsCount: { aggregate: { count: 0 } },
        effects: [{ languageId: 9, effect: "Current mechanics.", shortEffect: "Current summary." }],
        effectsCount: { aggregate: { count: 1 } },
        effectChanges: [
          {
            versionGroupId: 11,
            effects: [
              { languageId: 5, effect: "Ancien effet.\n\nUn second paragraphe." },
              { languageId: 9, effect: "Previous mechanics." },
            ],
            effectsCount: { aggregate: { count: 2 } },
          },
          {
            versionGroupId: 15,
            effects: [],
            effectsCount: { aggregate: { count: 0 } },
          },
        ],
        effectChangesCount: { aggregate: { count: 2 } },
      },
    ];
    raw.abilitiesCount.aggregate!.count = 1;
    return raw;
  }

  it("preserves introduction and localized pre-change prose without conflating current effects", () => {
    const raw = abilityReferences();
    validateBoundedRelationships(raw);
    expect(mapReferences(raw, census).abilities[0]).toEqual({
      id: 31,
      identifier: "lightning-rod",
      generationId: 3,
      names: [],
      flavorTexts: [],
      effects: raw.abilities[0]!.effects,
      effectChanges: [
        {
          versionGroupId: 11,
          effects: [
            { languageId: 5, effect: "Ancien effet.\n\nUn second paragraphe." },
            { languageId: 9, effect: "Previous mechanics." },
          ],
        },
        { versionGroupId: 15, effects: [] },
      ],
    });
  });

  it("preserves an absent history without deriving records from current effects", () => {
    const raw = abilityReferences();
    raw.abilities[0]!.effectChanges = [];
    raw.abilities[0]!.effectChangesCount.aggregate!.count = 0;
    validateBoundedRelationships(raw);
    expect(mapReferences(raw, census).abilities[0]!.effectChanges).toEqual([]);
  });

  it("rejects missing introduction and historical reference facts", () => {
    const raw = abilityReferences();
    const ability = raw.abilities[0]!;
    ability.generationId = null;
    expect(() => mapReferences(raw, census)).toThrow("ability.generationId");
    ability.generationId = 3;
    ability.effectChanges[0]!.versionGroupId = null;
    expect(() => mapReferences(raw, census)).toThrow("ability.effectChange.versionGroupId");
    ability.effectChanges[0]!.versionGroupId = 11;
    ability.effectChanges[0]!.effects[0]!.languageId = null;
    expect(() => mapReferences(raw, census)).toThrow("ability.effectChange.languageId");
  });
});

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
      target: null,
      attributes: [],
      statChanges: [],
      meta: null,
      sourceCounts: { attributes: 0, statChanges: 0, meta: 0 },
      flavorTexts: raw.moves[0]!.flavorTexts,
      effects: raw.moveEffects[0]!.effects,
    });
  });

  it("preserves structured metadata, signed recoil, zero chances and source machine numbering", () => {
    const raw = moveReferences();
    const move = raw.moves[0]!;
    move.target = {
      id: 10,
      identifier: "selected-pokemon",
      names: [],
      namesCount: { aggregate: { count: 0 } },
    };
    move.attributes = [
      {
        id: 1,
        attribute: {
          id: 1,
          identifier: "contact",
          names: [{ languageId: 5, name: "Contact" }],
          namesCount: { aggregate: { count: 1 } },
        },
      },
    ];
    move.attributesCount.aggregate!.count = 1;
    move.statChanges = [{ id: 1, statId: 2, change: -1 }];
    move.statChangesCount.aggregate!.count = 1;
    move.meta = [
      {
        id: 85,
        minHits: null,
        maxHits: null,
        minTurns: 2,
        maxTurns: 3,
        drain: -25,
        healing: 0,
        critRate: 1,
        ailmentChance: 0,
        flinchChance: null,
        statChance: 100,
        ailment: { id: 0, identifier: "none", names: [], namesCount: { aggregate: { count: 0 } } },
        category: {
          id: 0,
          identifier: "damage",
          descriptions: [{ languageId: 9, description: "Inflicts damage." }],
          descriptionsCount: { aggregate: { count: 1 } },
        },
      },
    ];
    move.metaCount.aggregate!.count = 1;
    raw.machines = [{ id: 1, number: 1001, versionGroupId: 20, itemId: 1131, moveId: 85 }];
    raw.machinesCount.aggregate!.count = 1;
    validateBoundedRelationships(raw);
    const mapped = mapReferences(raw, census);
    expect(mapped.machines).toEqual(raw.machines);
    expect(mapped.moves[0]).toMatchObject({
      target: { id: 10, identifier: "selected-pokemon", names: [] },
      attributes: [{ id: 1, identifier: "contact", names: [{ languageId: 5, name: "Contact" }] }],
      statChanges: [{ statId: 2, change: -1 }],
      meta: {
        drain: -25,
        healing: 0,
        ailmentChance: 0,
        flinchChance: null,
        minTurns: 2,
        maxTurns: 3,
      },
      sourceCounts: { attributes: 1, statChanges: 1, meta: 1 },
    });
    raw.machines[0]!.moveId = null;
    expect(() => mapReferences(raw, census)).toThrow("machine.moveId");
  });

  it("rejects ambiguous metadata instead of choosing an arbitrary record", () => {
    const raw = moveReferences();
    const meta = {
      id: 1,
      minHits: null,
      maxHits: null,
      minTurns: null,
      maxTurns: null,
      drain: null,
      healing: null,
      critRate: null,
      ailmentChance: null,
      flinchChance: null,
      statChance: null,
      ailment: null,
      category: null,
    };
    raw.moves[0]!.meta = [meta, { ...meta, id: 2 }];
    expect(() => mapReferences(raw, census)).toThrow("ambiguous metadata");
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

describe("egg group, pokedex and region reference mapping", () => {
  function dexReferences(): ReferencesQuery {
    const raw = moveReferences();
    raw.eggGroups = [
      {
        id: 5,
        identifier: "ground",
        names: [
          { languageId: 9, name: "Field" },
          { languageId: 5, name: "Terrestre" },
        ],
        namesCount: { aggregate: { count: 2 } },
      },
    ];
    raw.eggGroupsCount = { aggregate: { count: 1 } };
    raw.pokedexes = [
      {
        id: 31,
        identifier: "paldea",
        isMainSeries: true,
        regionId: 10,
        names: [{ languageId: 1, name: "パルデア" }],
        namesCount: { aggregate: { count: 1 } },
        versionGroups: [{ versionGroupId: 25 }],
        versionGroupsCount: { aggregate: { count: 1 } },
      },
      {
        id: 1,
        identifier: "national",
        isMainSeries: true,
        regionId: null,
        names: [],
        namesCount: { aggregate: { count: 0 } },
        versionGroups: [],
        versionGroupsCount: { aggregate: { count: 0 } },
      },
    ];
    raw.pokedexesCount = { aggregate: { count: 2 } };
    raw.regions = [
      {
        id: 10,
        identifier: "paldea",
        names: [{ languageId: 9, name: "Paldea" }],
        namesCount: { aggregate: { count: 1 } },
      },
    ];
    raw.regionsCount = { aggregate: { count: 1 } };
    return raw;
  }

  it("maps localized named rows, nullable regions and pokedex version groups with source counts", () => {
    const raw = dexReferences();
    validateBoundedRelationships(raw);
    const mapped = mapReferences(raw, census);
    expect(mapped.eggGroups).toEqual([
      {
        id: 5,
        identifier: "ground",
        names: [
          { languageId: 9, name: "Field" },
          { languageId: 5, name: "Terrestre" },
        ],
      },
    ]);
    expect(mapped.pokedexes).toEqual([
      {
        id: 31,
        identifier: "paldea",
        names: [{ languageId: 1, name: "パルデア" }],
        isMainSeries: true,
        regionId: 10,
        versionGroupIds: [25],
      },
      {
        id: 1,
        identifier: "national",
        names: [],
        isMainSeries: true,
        regionId: null,
        versionGroupIds: [],
      },
    ]);
    expect(mapped.regions).toEqual([
      { id: 10, identifier: "paldea", names: [{ languageId: 9, name: "Paldea" }] },
    ]);
    expect(mapped.sourceCounts).toMatchObject({ eggGroups: 1, pokedexes: 2, regions: 1 });
  });

  it("rejects truncated pokedex version groups and missing version-group relationships", () => {
    const truncated = dexReferences();
    truncated.pokedexes[0]!.versionGroupsCount.aggregate!.count = 2;
    expect(() => validateBoundedRelationships(truncated)).toThrow("truncated relationship");
    const missing = dexReferences();
    missing.pokedexes[0]!.versionGroups[0]!.versionGroupId = null;
    expect(() => mapReferences(missing, census)).toThrow("pokedex.versionGroupId");
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
        generationId: 3,
        names: [{ languageId: 5, name: "Paratonnerre" }],
        namesCount: { aggregate: { count: 1 } },
        flavorTexts: [
          { languageId: 5, versionGroupId: 25, text: "Attire les capacités\\nde type Électrik." },
        ],
        flavorTextsCount: { aggregate: { count: 1 } },
        effects: [],
        effectsCount: { aggregate: { count: 0 } },
        effectChanges: [],
        effectChangesCount: { aggregate: { count: 0 } },
      },
    ];
    raw.abilitiesCount.aggregate!.count = 1;
    const references = mapReferences(raw, census);
    expect(references.abilities[0]!.flavorTexts[0]!.text).toBe(
      "Attire les capacités de type Électrik.",
    );
  });
});

describe("species-scoped encounter mapping", () => {
  function sourceLookups(): EncounterReferencesQuery {
    return {
      locations: [
        {
          id: 1,
          identifier: "viridian-forest",
          names: [{ languageId: 5, name: "Forêt de Jade" }],
          namesCount: { aggregate: { count: 1 } },
          regionId: 1,
        },
      ],
      locationsCount: { aggregate: { count: 1 } },
      areas: [
        {
          id: 1,
          identifier: "",
          locationId: 1,
          names: [],
          namesCount: { aggregate: { count: 0 } },
        },
      ],
      areasCount: { aggregate: { count: 1 } },
      slots: [{ id: 1, versionGroupId: 1, methodId: 1, slot: null, rarity: 5 }],
      slotsCount: { aggregate: { count: 1 } },
      methods: [
        {
          id: 1,
          identifier: "walk",
          names: [{ languageId: 9, name: "Walking" }],
          namesCount: { aggregate: { count: 1 } },
        },
      ],
      methodsCount: { aggregate: { count: 1 } },
      conditions: [
        { id: 1, identifier: "time", names: [], namesCount: { aggregate: { count: 0 } } },
      ],
      conditionsCount: { aggregate: { count: 1 } },
      conditionValues: [
        {
          id: 1,
          identifier: "time-morning",
          conditionId: 1,
          isDefault: false,
          names: [{ languageId: 1, name: "朝" }],
          namesCount: { aggregate: { count: 1 } },
        },
      ],
      conditionValuesCount: { aggregate: { count: 1 } },
    };
  }

  function sourceSpecies(): SpeciesPageQuery["species"][number] {
    const record = fixture().species[0]!;
    const variety = record.varieties[0]!;
    return {
      id: record.id,
      identifier: record.identifier,
      generationId: record.generationId,
      evolvesFromSpeciesId: null,
      evolutionChainId: record.evolutionChainId,
      genderRate: record.genderRate,
      captureRate: record.captureRate,
      baseHappiness: record.baseHappiness,
      isBaby: false,
      isLegendary: false,
      isMythical: false,
      hatch_counter: 10,
      growth_rate_id: 2,
      pokemon_color_id: 10,
      pokemon_shape_id: 8,
      pokemon_habitat_id: 2,
      order: 26,
      forms_switchable: false,
      has_gender_differences: true,
      names: [
        { languageId: 9, name: "Pikachu", genus: "Mouse Pokémon" },
        { languageId: 5, name: "Pikachu", genus: "Souris" },
        { languageId: 1, name: "ピカチュウ", genus: "ねずみポケモン" },
      ],
      namesCount: { aggregate: { count: record.names.length } },
      flavorTexts: record.flavorTexts,
      flavorTextsCount: { aggregate: { count: record.flavorTexts.length } },
      eggGroups: record.eggGroupIds.map((eggGroupId) => ({ eggGroupId })),
      eggGroupsCount: { aggregate: { count: record.eggGroupIds.length } },
      pokedexNumbers: record.pokedexNumbers,
      pokedexNumbersCount: { aggregate: { count: record.pokedexNumbers.length } },
      evolutions: [],
      evolutionsCount: { aggregate: { count: 0 } },
      varieties: [
        {
          id: variety.id,
          identifier: variety.identifier,
          isDefault: variety.isDefault,
          height: variety.height,
          weight: variety.weight,
          baseExperience: variety.baseExperience,
          order: variety.order,
          speciesId: record.id,
          types: variety.types,
          typesCount: { aggregate: { count: variety.types.length } },
          typeHistory: [],
          typeHistoryCount: { aggregate: { count: 0 } },
          stats: variety.stats,
          statsCount: { aggregate: { count: variety.stats.length } },
          statHistory: variety.statHistory,
          statHistoryCount: { aggregate: { count: variety.statHistory.length } },
          abilities: variety.abilities,
          abilitiesCount: { aggregate: { count: variety.abilities.length } },
          abilityHistory: variety.abilityHistory,
          abilityHistoryCount: { aggregate: { count: variety.abilityHistory.length } },
          forms: variety.forms.map((form) => ({
            id: form.id,
            identifier: form.identifier,
            formIdentifier: form.formIdentifier,
            versionGroupId: form.versionGroupId,
            isDefault: form.isDefault,
            isBattleOnly: form.isBattleOnly,
            isMega: form.isMega,
            order: form.order,
            formOrder: form.formOrder,
            pokemonId: variety.id,
            names: [],
            namesCount: { aggregate: { count: 0 } },
          })),
          formsCount: { aggregate: { count: variety.forms.length } },
          learnsets: variety.learnsets.map((row, index) => ({ id: index + 1, ...row })),
          learnsetsCount: { aggregate: { count: variety.learnsets.length } },
          sprites: [],
          spritesCount: { aggregate: { count: 0 } },
          cries: [{ cries: variety.cries }],
          criesCount: { aggregate: { count: 1 } },
          encounters: [
            {
              id: 1,
              versionId: 1,
              minLevel: 3,
              maxLevel: 5,
              areaId: 1,
              slotId: 1,
              conditions: [{ id: 1, encounterId: 1, valueId: 1 }],
              conditionsCount: { aggregate: { count: 1 } },
            },
          ],
          encountersCount: { aggregate: { count: 1 } },
        },
      ],
      varietiesCount: { aggregate: { count: 1 } },
    };
  }

  it("retains exact version, levels, slot rarity, localized places/methods and condition defaults", () => {
    const raw = sourceSpecies();
    validateBoundedRelationships({ species: [raw] });
    const lookups = sourceLookups();
    validateBoundedRelationships(lookups);
    expect(mapSpecies(raw, mapEncounterReferences(lookups)).varieties[0]!.encounters).toEqual([
      {
        id: 1,
        versionId: 1,
        minLevel: 3,
        maxLevel: 5,
        location: {
          id: 1,
          identifier: "viridian-forest",
          names: [{ languageId: 5, name: "Forêt de Jade" }],
          regionId: 1,
        },
        area: { id: 1, identifier: "", names: [] },
        method: { id: 1, identifier: "walk", names: [{ languageId: 9, name: "Walking" }] },
        slot: { id: 1, versionGroupId: 1, slot: null, rarity: 5 },
        conditions: [
          {
            id: 1,
            identifier: "time-morning",
            names: [{ languageId: 1, name: "朝" }],
            isDefault: false,
            condition: { id: 1, identifier: "time", names: [] },
          },
        ],
        sourceCounts: { conditions: 1 },
      },
    ]);
    expect(
      mapSpecies(raw, mapEncounterReferences(lookups)).varieties[0]!.sourceCounts.encounters,
    ).toBe(1);
  });

  it("maps species egg groups and dex numbers in source order with independent counts", () => {
    const raw = sourceSpecies();
    raw.eggGroups = [{ eggGroupId: 6 }, { eggGroupId: 5 }];
    raw.pokedexNumbers = [
      { pokedexId: 1, number: 494 },
      { pokedexId: 9, number: 0 },
    ];
    raw.pokedexNumbersCount.aggregate!.count = 2;
    validateBoundedRelationships({ species: [raw] });
    const mapped = mapSpecies(raw, mapEncounterReferences(sourceLookups()));
    expect(mapped.eggGroupIds).toEqual([6, 5]);
    expect(mapped.pokedexNumbers).toEqual([
      { pokedexId: 1, number: 494 },
      { pokedexId: 9, number: 0 },
    ]);
    expect(mapped.sourceCounts).toMatchObject({ eggGroupIds: 2, pokedexNumbers: 2 });
    raw.pokedexNumbersCount.aggregate!.count = 3;
    expect(() => validateBoundedRelationships({ species: [raw] })).toThrow("pokedexNumbers");
    raw.eggGroups[0]!.eggGroupId = null;
    expect(() => mapSpecies(raw, mapEncounterReferences(sourceLookups()))).toThrow(
      "species.eggGroupId",
    );
  });

  it("maps current cry URLs and keeps absent or malformed cries explicitly null", () => {
    const raw = sourceSpecies();
    const lookups = mapEncounterReferences(sourceLookups());
    const variety = raw.varieties[0]!;
    expect(mapSpecies(raw, lookups).varieties[0]!.cries).toEqual({
      latest: "https://example.test/cries/latest/25.ogg",
      legacy: "https://example.test/cries/legacy/25.ogg",
    });
    variety.cries = [{ cries: { latest: "https://example.test/latest.ogg", legacy: null } }];
    expect(mapSpecies(raw, lookups).varieties[0]!.cries).toEqual({
      latest: "https://example.test/latest.ogg",
      legacy: null,
    });
    variety.cries = [];
    variety.criesCount.aggregate!.count = 0;
    validateBoundedRelationships({ species: [raw] });
    expect(mapSpecies(raw, lookups).varieties[0]!.cries).toEqual({ latest: null, legacy: null });
    variety.cries = [{ cries: { latest: 7 } }, { cries: {} }];
    variety.criesCount.aggregate!.count = 2;
    expect(() => mapSpecies(raw, lookups)).toThrow("ambiguous cry records");
    variety.cries = [{ cries: { latest: 7 } }];
    expect(mapSpecies(raw, lookups).varieties[0]!.cries).toEqual({ latest: null, legacy: null });
  });

  it("maps location regions as nullable validated foreign keys", () => {
    const lookups = sourceLookups();
    lookups.locations[0]!.regionId = null;
    const raw = sourceSpecies();
    expect(
      mapSpecies(raw, mapEncounterReferences(lookups)).varieties[0]!.encounters[0]!.location,
    ).toMatchObject({ id: 1, regionId: null });
    lookups.locations[0]!.regionId = 0;
    expect(() => mapEncounterReferences(lookups)).toThrow("location.regionId");
  });

  it("does not invent missing encounter relationships or turn a counted empty export into availability", () => {
    const raw = sourceSpecies();
    const lookups = mapEncounterReferences(sourceLookups());
    raw.varieties[0]!.encounters[0]!.areaId = null;
    expect(() => mapSpecies(raw, lookups)).toThrow("encounter.areaId");
    raw.varieties[0]!.encounters = [];
    raw.varieties[0]!.encountersCount.aggregate!.count = 0;
    validateBoundedRelationships({ species: [raw] });
    expect(mapSpecies(raw, lookups).varieties[0]!.encounters).toEqual([]);
  });

  it("retains actual same-language area aliases and blank labels without relaxing other resource identities", () => {
    const lookups = sourceLookups();
    lookups.areas[0] = {
      id: 754,
      identifier: "terminus-cave-1f",
      locationId: 1,
      names: [
        { languageId: 5, name: "Grotte Coda (zone inconnue 343)" },
        { languageId: 9, name: "Terminus Cave (unknown area 343)" },
        { languageId: 9, name: "Terminus Cave (1F)" },
        { languageId: 1, name: "" },
        { languageId: 9, name: "Terminus Cave (1F)" },
      ],
      namesCount: { aggregate: { count: 5 } },
    };
    const raw = sourceSpecies();
    raw.varieties[0]!.encounters[0]!.areaId = 754;
    validateBoundedRelationships(lookups);
    const mapped = mapSpecies(raw, mapEncounterReferences(lookups));
    expect(mapped.varieties[0]!.encounters[0]!.area.names).toEqual(
      lookups.areas[0]!.names.slice(0, 4),
    );
    // Raw source row counts remain untouched even though identical aliases collapse.
    expect(lookups.areas[0]!.names).toHaveLength(5);
    const snapshot = fixture();
    snapshot.species = [mapped];
    snapshot.references.encounterCoverage.find((row) => row.versionId === 1)!.rows = 1;
    validateSnapshot(snapshot);
    mapped.varieties[0]!.encounters[0]!.area.names.push({
      languageId: 9,
      name: "Terminus Cave (1F)",
    });
    expect(() => validateSnapshot(snapshot)).toThrow("duplicate localized alias");
    mapped.varieties[0]!.encounters[0]!.area.names.pop();
    snapshot.references.types[0]!.names.push(
      { languageId: 11, name: "Alternative one" },
      { languageId: 11, name: "Alternative two" },
    );
    expect(() => validateSnapshot(snapshot)).toThrow("duplicate language identity");
  });

  it("joins shared lookups across encounters without mutating or multiplying source names", () => {
    const raw = sourceSpecies();
    const variety = raw.varieties[0]!;
    variety.encounters.push({
      ...variety.encounters[0]!,
      id: 2,
      conditions: [{ id: 2, encounterId: 2, valueId: 1 }],
    });
    variety.encountersCount.aggregate!.count = 2;
    const source = sourceLookups();
    const original = structuredClone(source);
    const lookups = mapEncounterReferences(source);
    const mapped = mapSpecies(raw, lookups).varieties[0]!.encounters;
    expect(mapped).toHaveLength(2);
    expect(mapped[0]!.location).toBe(mapped[1]!.location);
    expect(mapped[0]!.method).toBe(mapped[1]!.method);
    expect(mapped[0]!.conditions[0]).toBe(mapped[1]!.conditions[0]);
    expect(source).toEqual(original);
  });

  it.each(["locations", "areas", "slots", "methods", "conditions", "conditionValues"] as const)(
    "rejects duplicate %s lookup identities even if independent row counts match",
    (table) => {
      const raw = sourceLookups();
      Reflect.set(raw, table, [...raw[table], raw[table][0]!]);
      raw[`${table}Count`].aggregate!.count = 2;
      validateBoundedRelationships(raw);
      expect(() => mapEncounterReferences(raw)).toThrow(`Duplicate encounter lookup id: ${table}`);
    },
  );

  it("rejects unresolved lookup FKs, including unused resource rows", () => {
    const areas = sourceLookups();
    areas.areas.push({ ...areas.areas[0]!, id: 2, locationId: 999999 });
    areas.areasCount.aggregate!.count = 2;
    expect(() => mapEncounterReferences(areas)).toThrow("encounter.location 999999");
    const methods = sourceLookups();
    methods.slots[0]!.methodId = null;
    expect(() => mapEncounterReferences(methods)).toThrow("encounter.slot.methodId");
    const conditions = sourceLookups();
    conditions.conditionValues[0]!.conditionId = 999999;
    expect(() => mapEncounterReferences(conditions)).toThrow("encounter.condition 999999");
  });

  it("rejects absent, invalid or unknown species encounter foreign keys", () => {
    const lookups = mapEncounterReferences(sourceLookups());
    const raw = sourceSpecies();
    const encounter = raw.varieties[0]!.encounters[0]!;
    encounter.areaId = 999999;
    expect(() => mapSpecies(raw, lookups)).toThrow("encounter.area 999999");
    encounter.areaId = 1;
    encounter.slotId = null;
    expect(() => mapSpecies(raw, lookups)).toThrow("encounter.slotId");
    encounter.slotId = 999999;
    expect(() => mapSpecies(raw, lookups)).toThrow("encounter.slot 999999");
    encounter.slotId = 1;
    encounter.conditions[0]!.valueId = 999999;
    expect(() => mapSpecies(raw, lookups)).toThrow("encounter.conditionValue 999999");
    encounter.conditions[0]!.valueId = null;
    expect(() => mapSpecies(raw, lookups)).toThrow("encounter.conditionMap.valueId");
  });

  it("rejects condition maps attached to the wrong encounter or duplicated condition values", () => {
    const lookups = mapEncounterReferences(sourceLookups());
    const raw = sourceSpecies();
    const encounter = raw.varieties[0]!.encounters[0]!;
    encounter.conditions[0]!.encounterId = 999999;
    expect(() => mapSpecies(raw, lookups)).toThrow("inconsistent condition mapping relationship");
    encounter.conditions[0]!.encounterId = 1;
    encounter.conditions.push({ id: 2, encounterId: 1, valueId: 1 });
    encounter.conditionsCount.aggregate!.count = 2;
    validateBoundedRelationships({ species: [raw] });
    expect(() => mapSpecies(raw, lookups)).toThrow("Duplicate source encounter condition mapping");
  });

  it("compares all lookup and localized-name totals against the independent source census", () => {
    const raw = sourceLookups();
    const count = (value: number) => ({ aggregate: { count: value, max: { id: value || null } } });
    const sourceCensus = {
      encounterLocations: count(1),
      encounterAreas: count(1),
      encounterSlots: count(1),
      encounterMethods: count(1),
      encounterConditionKinds: count(1),
      encounterConditionValues: count(1),
      encounterLocationNames: count(1),
      encounterAreaNames: count(0),
      encounterMethodNames: count(1),
      encounterConditionNames: count(0),
      encounterConditionValueNames: count(1),
    };
    validateEncounterReferenceCensus(raw, sourceCensus);
    for (const [key, value] of Object.entries(sourceCensus)) {
      value.aggregate.count++;
      expect(() => validateEncounterReferenceCensus(raw, sourceCensus)).toThrow(
        key.endsWith("Names") ? "localized encounter names" : "Encounter reference census mismatch",
      );
      value.aggregate.count--;
    }
  });

  it("keeps species query encounter rows scalar-only and validates them using the shared lookup context", async () => {
    const operations = await loadOperations();
    const lookups = sourceLookups();
    operations.encounterReferences.validate(lookups, {});
    const speciesOperation = operations.species(mapEncounterReferences(lookups));
    for (const join of [
      "locationarea {",
      "encounterslot {",
      "locationnames",
      "locationareanames",
      "encountermethodnames",
      "encounterconditionnames",
      "encounterconditionvaluenames",
    ]) {
      expect(speciesOperation.document).not.toContain(join);
    }
    expect(speciesOperation.document).toContain("areaId: location_area_id");
    expect(speciesOperation.document).toContain("slotId: encounter_slot_id");
    expect(speciesOperation.document).toContain("valueId: encounter_condition_value_id");
    const raw = sourceSpecies();
    speciesOperation.validate({ species: [raw] }, { after: 0, limit: 1 });
    raw.varieties[0]!.encounters[0]!.areaId = 999999;
    expect(() => speciesOperation.validate({ species: [raw] }, { after: 0, limit: 1 })).toThrow(
      "encounter.area",
    );
  });

  it("preserves the observed Yellow Power Plant slot's red-blue provenance without changing its exact version", () => {
    const raw = sourceSpecies();
    raw.varieties[0]!.encounters = [
      {
        id: 62320,
        versionId: 3,
        areaId: 330,
        slotId: 561,
        minLevel: 40,
        maxLevel: 40,
        conditions: [],
        conditionsCount: { aggregate: { count: 0 } },
      },
    ];
    const source = sourceLookups();
    source.locations = [
      {
        id: 158,
        identifier: "kanto-power-plant",
        names: [{ languageId: 9, name: "Kanto Power Plant" }],
        namesCount: { aggregate: { count: 1 } },
        regionId: 1,
      },
    ];
    source.areas = [
      {
        id: 330,
        locationId: 158,
        identifier: "kanto-power-plant-area",
        names: [{ languageId: 9, name: "Power Plant" }],
        namesCount: { aggregate: { count: 1 } },
      },
    ];
    source.slots = [{ id: 561, versionGroupId: 1, methodId: 20, rarity: 100, slot: null }];
    source.methods = [
      {
        id: 20,
        identifier: "static",
        names: [{ languageId: 9, name: "Static encounter" }],
        namesCount: { aggregate: { count: 1 } },
      },
    ];
    const mapped = mapSpecies(raw, mapEncounterReferences(source));
    const snapshot = fixture();
    snapshot.species = [mapped];
    snapshot.references.encounterCoverage.find((row) => row.versionId === 3)!.rows = 1;
    validateSnapshot(snapshot);
    expect(mapped.varieties[0]!.encounters[0]).toMatchObject({
      id: 62320,
      versionId: 3,
      slot: { id: 561, versionGroupId: 1, rarity: 100 },
    });
  });
});
