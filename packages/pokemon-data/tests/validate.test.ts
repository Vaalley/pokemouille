import { describe, expect, it } from "vite-plus/test";
import { resolvePokemon, validateSnapshot } from "../src/index.ts";
import { fixture } from "./fixtures.ts";

describe("snapshot integrity", () => {
  it("uses numeric resource identity while rejecting duplicate primary IDs", () => {
    const snapshot = fixture();
    snapshot.references.items = [
      { id: 723, identifier: "roseli-berry", names: [], flavorTexts: [], effects: [] },
      { id: 2279, identifier: "roseli-berry", names: [], flavorTexts: [], effects: [] },
    ];
    snapshot.references.sourceCounts.items = 2;
    validateSnapshot(snapshot);
    snapshot.references.items[1]!.id = 723;
    expect(() => validateSnapshot(snapshot)).toThrow("duplicate identity 723");
  });

  it("resolves an unambiguous source form without a default flag", () => {
    const snapshot = fixture();
    const record = snapshot.species[0]!;
    record.varieties[0]!.forms[0]!.isDefault = false;
    validateSnapshot(snapshot);
    const result = resolvePokemon(record, snapshot.references, { language: "en", version: "red" });
    expect(result.status).toBe("available");
    expect(result.formId).toBe(25);
    expect(result.types).toMatchObject({ status: "available", value: [{ id: 13 }] });
  });

  it("rejects a truncated species export independently of its remaining valid records", () => {
    const snapshot = fixture();
    snapshot.species = [];
    expect(() => validateSnapshot(snapshot)).toThrow();
  });

  it("rejects truncated bounded nested collections and reference collections", () => {
    const nested = fixture();
    nested.species[0]!.varieties[0]!.learnsets.pop();
    expect(() => validateSnapshot(nested)).toThrow();
    const references = fixture();
    references.references.moves.pop();
    expect(() => validateSnapshot(references)).toThrow();
  });

  it("rejects invalid IDs and relationships instead of passing malformed rows to consumers", () => {
    const negative = fixture();
    negative.species[0]!.id = -25;
    expect(() => validateSnapshot(negative)).toThrow();
    const broken = fixture();
    broken.species[0]!.varieties[0]!.learnsets[0]!.moveId = 999999;
    expect(() => validateSnapshot(broken)).toThrow();
    const malformed: unknown = { references: null, species: [] };
    expect(() => validateSnapshot(malformed)).toThrow();
  });

  it("requires ability introduction and history collections and validates their references", () => {
    const snapshot = fixture();
    const ability = snapshot.references.abilities[0]!;
    ability.effectChanges = [
      { versionGroupId: 11, effects: [{ languageId: 9, effect: "Previous mechanics." }] },
      { versionGroupId: 15, effects: [] },
    ];
    validateSnapshot(snapshot);
    ability.generationId = 999999;
    expect(() => validateSnapshot(snapshot)).toThrow("ability.generationId");
    ability.generationId = 3;
    ability.effectChanges[0]!.versionGroupId = 999999;
    expect(() => validateSnapshot(snapshot)).toThrow("ability.effectChange.versionGroupId");
    ability.effectChanges[0]!.versionGroupId = 11;
    ability.effectChanges[0]!.effects[0]!.languageId = 0;
    expect(() => validateSnapshot(snapshot)).toThrow("ability.effectChange.effect.languageId");
    ability.effectChanges[0]!.effects[0]!.languageId = 9;
    ability.effectChanges = [];
    validateSnapshot(snapshot);
    Reflect.deleteProperty(ability, "effectChanges");
    expect(() => validateSnapshot(snapshot)).toThrow("ability.effectChanges");
    ability.effectChanges = [];
    Reflect.deleteProperty(ability, "generationId");
    expect(() => validateSnapshot(snapshot)).toThrow("ability.generationId");
  });

  it("rejects duplicate change boundaries and translations without requiring complete history", () => {
    const snapshot = fixture();
    const ability = snapshot.references.abilities[0]!;
    ability.effectChanges = [
      { versionGroupId: 11, effects: [{ languageId: 9, effect: "Previous mechanics." }] },
      { versionGroupId: 11, effects: [] },
    ];
    expect(() => validateSnapshot(snapshot)).toThrow("ability.effectChanges");
    ability.effectChanges.pop();
    ability.effectChanges[0]!.effects.push({ languageId: 9, effect: "Conflicting prose." });
    expect(() => validateSnapshot(snapshot)).toThrow("ability.effectChange.effects");
    ability.effectChanges[0]!.effects.pop();
    validateSnapshot(snapshot);
  });

  it("validates real move stats while preserving nullable source values", () => {
    const snapshot = fixture();
    const move = snapshot.references.moves[0]!;
    move.power = null;
    move.accuracy = null;
    move.pp = null;
    move.effectChance = null;
    move.priority = -6;
    validateSnapshot(snapshot);
    move.power = -1;
    expect(() => validateSnapshot(snapshot)).toThrow("move.power");
    move.power = null;
    move.damageClassId = 0;
    expect(() => validateSnapshot(snapshot)).toThrow("move.damageClassId");
  });

  it("rejects missing move fields and invalid detail relationships", () => {
    const missing = fixture();
    Reflect.deleteProperty(missing.references.moves[0]!, "power");
    expect(() => validateSnapshot(missing)).toThrow("move.power");
    const invalidType = fixture();
    invalidType.references.moves[0]!.typeId = 999999;
    expect(() => validateSnapshot(invalidType)).toThrow("move.typeId");
    const invalidGeneration = fixture();
    invalidGeneration.references.moves[0]!.generationId = 999999;
    expect(() => validateSnapshot(invalidGeneration)).toThrow("move.generationId");
    const invalidVersion = fixture();
    invalidVersion.references.moves[0]!.flavorTexts[0]!.versionGroupId = 999999;
    expect(() => validateSnapshot(invalidVersion)).toThrow("move.flavorText.versionGroupId");
  });

  it("rejects duplicate localized move descriptions and effects", () => {
    const flavors = fixture();
    const move = flavors.references.moves[0]!;
    move.flavorTexts.push({ ...move.flavorTexts[0]! });
    expect(() => validateSnapshot(flavors)).toThrow("move.flavorTexts");
    const effects = fixture();
    const effectMove = effects.references.moves[0]!;
    effectMove.effects.push({ ...effectMove.effects[0]! });
    expect(() => validateSnapshot(effects)).toThrow("move.effects");
  });

  it("requires item text collections and validates exact game/language identities", () => {
    const snapshot = fixture();
    snapshot.references.items = [
      {
        id: 83,
        identifier: "thunder-stone",
        names: [{ languageId: 5, name: "Pierre Foudre" }],
        flavorTexts: [{ languageId: 5, versionGroupId: 25, text: "Une pierre particulière." }],
        effects: [{ languageId: 9, effect: "Evolves certain Pokémon.", shortEffect: "Evolution." }],
      },
    ];
    snapshot.references.sourceCounts.items = 1;
    validateSnapshot(snapshot);
    const item = snapshot.references.items[0]!;
    item.flavorTexts[0]!.versionGroupId = 999999;
    expect(() => validateSnapshot(snapshot)).toThrow("item.flavorText.versionGroupId");
    item.flavorTexts[0]!.versionGroupId = 25;
    item.flavorTexts.push({ ...item.flavorTexts[0]! });
    expect(() => validateSnapshot(snapshot)).toThrow("item.flavorTexts");
    item.flavorTexts.pop();
    item.effects.push({ ...item.effects[0]! });
    expect(() => validateSnapshot(snapshot)).toThrow("item.effects");
    item.effects = [];
    item.flavorTexts = [];
    validateSnapshot(snapshot);
    Reflect.deleteProperty(item, "effects");
    expect(() => validateSnapshot(snapshot)).toThrow("item.effects");
  });

  it("rejects duplicate historical identities even if all extraction counts agree", () => {
    const snapshot = fixture();
    const variety = snapshot.species[0]!.varieties[0]!;
    variety.abilityHistory.push({ ...variety.abilityHistory[0]! });
    variety.sourceCounts.abilityHistory = 2;
    expect(() => validateSnapshot(snapshot)).toThrow();
  });

  it("rejects duplicated form identities and false aggregate coverage", () => {
    const duplicate = fixture();
    const variety = duplicate.species[0]!.varieties[0]!;
    variety.forms.push({ ...variety.forms[0]!, isDefault: false });
    variety.sourceCounts.forms = 2;
    duplicate.references.census.forms = 2;
    expect(() => validateSnapshot(duplicate)).toThrow();
    const coverage = fixture();
    coverage.references.coverage[0]!.learnsetRows = 0;
    expect(() => validateSnapshot(coverage)).toThrow();
  });

  it("rejects ancestry cycles across otherwise valid species", () => {
    const snapshot = fixture();
    const first = snapshot.species[0]!;
    const second = structuredClone(first);
    second.id = 26;
    second.identifier = "raichu";
    second.evolvesFromSpeciesId = 25;
    second.varieties[0]!.id = 26;
    second.varieties[0]!.identifier = "raichu";
    second.varieties[0]!.forms[0]!.id = 26;
    second.varieties[0]!.forms[0]!.identifier = "raichu";
    first.evolvesFromSpeciesId = 26;
    snapshot.species.push(second);
    snapshot.references.census = { species: 2, pokemon: 2, forms: 2, learnsets: 6, evolutions: 0 };
    for (const row of snapshot.references.coverage) {
      row.learnsetRows *= 2;
      row.speciesFlavorTextRows *= 2;
    }
    expect(() => validateSnapshot(snapshot)).toThrow();
  });

  it("preserves valid absence rather than requiring fabricated modern fallback values", () => {
    const snapshot = fixture();
    const record = snapshot.species[0]!;
    const variety = record.varieties[0]!;
    variety.statHistory.pop();
    variety.sourceCounts.statHistory = 2;
    variety.abilities = [];
    variety.abilityHistory = [];
    variety.sourceCounts.abilities = 0;
    variety.sourceCounts.abilityHistory = 0;
    validateSnapshot(snapshot);
    expect(
      resolvePokemon(record, snapshot.references, { language: "en", version: "red" }).stats.status,
    ).toBe("missing");
    expect(
      resolvePokemon(record, snapshot.references, { language: "en", version: "x" }).abilities
        .status,
    ).toBe("missing");
  });
  it("requires counted structured move fields while preserving missing metadata and signed HP costs", () => {
    const snapshot = fixture();
    const move = snapshot.references.moves[0]!;
    move.meta = {
      ailment: { id: -1, identifier: "unknown", names: [] },
      category: { id: 0, identifier: "damage", descriptions: [] },
      minHits: null,
      maxHits: null,
      minTurns: null,
      maxTurns: null,
      drain: -25,
      healing: 0,
      critRate: 0,
      ailmentChance: null,
      flinchChance: 0,
      statChance: 0,
    };
    move.sourceCounts.meta = 1;
    move.statChanges = [{ statId: 2, change: -1 }];
    move.sourceCounts.statChanges = 1;
    validateSnapshot(snapshot);
    // Actual upstream semantics: Struggle uses -25 and Clangorous Soul uses -33 healing.
    move.meta.drain = 0;
    for (const healing of [-25, -33, 0, 50, null]) {
      move.meta.healing = healing;
      validateSnapshot(snapshot);
    }
    move.meta.healing = -101;
    expect(() => validateSnapshot(snapshot)).toThrow("move.meta.healing");
    move.meta.healing = -25.5;
    expect(() => validateSnapshot(snapshot)).toThrow("move.meta.healing");
    move.meta.healing = -25;
    move.statChanges = [];
    expect(() => validateSnapshot(snapshot)).toThrow("statChanges");
    move.sourceCounts.statChanges = 0;
    move.meta = null;
    expect(() => validateSnapshot(snapshot)).toThrow("move.meta");
    move.sourceCounts.meta = 0;
    validateSnapshot(snapshot);
    Reflect.deleteProperty(move, "attributes");
    expect(() => validateSnapshot(snapshot)).toThrow("attributes");
  });

  it("validates machine item/move/game relationships without deriving a label from the number", () => {
    const snapshot = fixture();
    snapshot.references.items = [
      { id: 1131, identifier: "tr01", names: [], effects: [], flavorTexts: [] },
    ];
    snapshot.references.sourceCounts.items = 1;
    snapshot.references.machines = [
      { id: 1, versionGroupId: 25, number: 1001, itemId: 1131, moveId: 85 },
    ];
    snapshot.references.sourceCounts.machines = 1;
    validateSnapshot(snapshot);
    snapshot.references.machines[0]!.itemId = 999999;
    expect(() => validateSnapshot(snapshot)).toThrow("machine.itemId");
  });

  it("validates exact-version encounter coverage, slot scopes and independent condition counts", () => {
    const snapshot = fixture();
    const variety = snapshot.species[0]!.varieties[0]!;
    variety.encounters = [
      {
        id: 1,
        versionId: 1,
        minLevel: 3,
        maxLevel: 5,
        location: {
          id: 1,
          identifier: "viridian-forest",
          names: [{ languageId: 5, name: "Forêt de Jade" }],
        },
        area: { id: 1, identifier: "", names: [] },
        method: { id: 1, identifier: "walk", names: [] },
        slot: { id: 1, versionGroupId: 1, slot: null, rarity: 5 },
        conditions: [
          {
            id: 1,
            identifier: "time-morning",
            names: [],
            isDefault: false,
            condition: { id: 1, identifier: "time", names: [] },
          },
        ],
        sourceCounts: { conditions: 1 },
      },
    ];
    variety.sourceCounts.encounters = 1;
    snapshot.references.encounterCoverage.find((row) => row.versionId === 1)!.rows = 1;
    validateSnapshot(snapshot);
    const encounter = variety.encounters[0]!;
    encounter.area.names = [
      { languageId: 9, name: "Terminus Cave (unknown area 343)" },
      { languageId: 9, name: "Terminus Cave (1F)" },
      { languageId: 1, name: "" },
    ];
    validateSnapshot(snapshot);
    encounter.area.names.push({ languageId: 9, name: "Terminus Cave (1F)" });
    expect(() => validateSnapshot(snapshot)).toThrow("duplicate localized alias");
    encounter.area.names.pop();
    encounter.slot.versionGroupId = 999999;
    expect(() => validateSnapshot(snapshot)).toThrow("encounter.slot.versionGroupId");
    encounter.slot.versionGroupId = 1;
    encounter.conditions = [];
    expect(() => validateSnapshot(snapshot)).toThrow("conditions");
    encounter.sourceCounts.conditions = 0;
    encounter.minLevel = 6;
    expect(() => validateSnapshot(snapshot)).toThrow("inverted level");
    encounter.minLevel = 3;
    snapshot.references.encounterCoverage.find((row) => row.versionId === 1)!.rows = 0;
    expect(() => validateSnapshot(snapshot)).toThrow("encounter row count");
    snapshot.references.encounterCoverage.find((row) => row.versionId === 1)!.rows = 1;
    variety.encounters = [];
    expect(() => validateSnapshot(snapshot)).toThrow("encounters");
    variety.sourceCounts.encounters = 0;
    expect(() => validateSnapshot(snapshot)).toThrow("encounter row count");
  });
});
