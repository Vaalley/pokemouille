import { describe, expect, it } from "vite-plus/test";
import { validateBoundedRelationships } from "../src/operations.ts";

// These are raw upstream relationship boundaries, not normalized DTO fixtures.
describe("bounded upstream response validation", () => {
  it("rejects a nested learnset silently truncated by the upstream row cap", () => {
    const response = {
      species: [
        {
          id: 25,
          varieties: [
            { id: 25, learnsets: [{ id: 1 }], learnsetsCount: { aggregate: { count: 2 } } },
          ],
          varietiesCount: { aggregate: { count: 1 } },
        },
      ],
    };
    expect(() => validateBoundedRelationships(response)).toThrow("truncated relationship");
  });

  it("rejects a missing independent relationship count even for an empty result", () => {
    const response = { species: [{ id: 25, varieties: [] }] };
    expect(() => validateBoundedRelationships(response)).toThrow("missing relationship aggregate");
  });

  it("rejects truncated move flavor text and shared effect relationships", () => {
    const response = {
      moves: [
        {
          id: 85,
          flavorTexts: [{ languageId: 9, versionGroupId: 25, text: "An electric attack." }],
          flavorTextsCount: { aggregate: { count: 2 } },
        },
      ],
      movesCount: { aggregate: { count: 1 } },
    };
    expect(() => validateBoundedRelationships(response)).toThrow("$.moves[0].flavorTexts");
    const effects = {
      moveEffects: [
        {
          id: 5,
          effects: [],
          effectsCount: { aggregate: { count: 1 } },
        },
      ],
      moveEffectsCount: { aggregate: { count: 1 } },
    };
    expect(() => validateBoundedRelationships(effects)).toThrow("$.moveEffects[0].effects");
  });

  it("rejects truncated item flavor text and effect relationships", () => {
    const response = {
      items: [
        {
          id: 83,
          flavorTexts: [],
          flavorTextsCount: { aggregate: { count: 1 } },
          effects: [],
          effectsCount: { aggregate: { count: 0 } },
        },
      ],
      itemsCount: { aggregate: { count: 1 } },
    };
    expect(() => validateBoundedRelationships(response)).toThrow("$.items[0].flavorTexts");
    response.items[0]!.flavorTextsCount.aggregate.count = 0;
    response.items[0]!.effectsCount.aggregate.count = 1;
    expect(() => validateBoundedRelationships(response)).toThrow("$.items[0].effects");
  });

  it("rejects truncated ability change records and their nested localized effects", () => {
    const response = {
      abilities: [
        {
          id: 31,
          effectChanges: [
            {
              versionGroupId: 11,
              effects: [],
              effectsCount: { aggregate: { count: 0 } },
            },
          ],
          effectChangesCount: { aggregate: { count: 2 } },
        },
      ],
      abilitiesCount: { aggregate: { count: 1 } },
    };
    expect(() => validateBoundedRelationships(response)).toThrow("$.abilities[0].effectChanges");
    response.abilities[0]!.effectChangesCount.aggregate.count = 1;
    response.abilities[0]!.effectChanges[0]!.effectsCount.aggregate.count = 1;
    expect(() => validateBoundedRelationships(response)).toThrow(
      "$.abilities[0].effectChanges[0].effects",
    );
  });

  it.each([
    "machines",
    "attributes",
    "statChanges",
    "meta",
    "encounters",
    "locations",
    "areas",
    "slots",
    "methods",
    "conditions",
    "conditionValues",
  ])("rejects truncated %s rows even when the result is empty", (relationship) => {
    const response = {
      [relationship]: [],
      [`${relationship}Count`]: { aggregate: { count: 1 } },
    };
    expect(() => validateBoundedRelationships(response)).toThrow("truncated relationship");
  });

  it.each(["locations", "areas", "methods", "conditions", "conditionValues"])(
    "rejects truncated shared %s names independently of the complete lookup table",
    (table) => {
      const response = {
        [table]: [{ id: 1, names: [], namesCount: { aggregate: { count: 1 } } }],
        [`${table}Count`]: { aggregate: { count: 1 } },
      };
      expect(() => validateBoundedRelationships(response)).toThrow(`$.${table}[0].names`);
    },
  );

  it("validates localized arrays behind object relationships without interpreting sprite JSON as rows", () => {
    const response = {
      target: { names: [], namesCount: { aggregate: { count: 1 } } },
    };
    expect(() => validateBoundedRelationships(response)).toThrow("$.target.names");
    expect(() =>
      validateBoundedRelationships({
        sprites: [{ sprites: { other: { frames: [1, 2] } } }],
        spritesCount: { aggregate: { count: 1 } },
      }),
    ).not.toThrow();
  });

  it("accepts complete bounded relationships, including truthful zero-row histories", () => {
    const response = {
      species: [
        {
          id: 25,
          varieties: [
            { id: 25, abilityHistory: [], abilityHistoryCount: { aggregate: { count: 0 } } },
          ],
          varietiesCount: { aggregate: { count: 1 } },
        },
      ],
    };
    expect(() => validateBoundedRelationships(response)).not.toThrow();
  });
});
