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
