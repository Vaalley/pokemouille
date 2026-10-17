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
