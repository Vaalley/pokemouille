import { describe, expect, it } from "vite-plus/test";
import type { LearnsetRow } from "../../../../../packages/pokemon-data/src/index.ts";
import { projectAbilityMembership, projectMoveMembership } from "./catalogue.ts";

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

describe("projectAbilityMembership", () => {
  it("merges independent slots with the earliest inclusive history bound and explicit null removal", () => {
    const membership = projectAbilityMembership(
      [
        { slot: 1, abilityId: 30, isHidden: false },
        { slot: 2, abilityId: 40, isHidden: false },
        { slot: 3, abilityId: 50, isHidden: true },
      ],
      [
        { slot: 1, abilityId: 20, isHidden: false, generationId: 6 },
        { slot: 2, abilityId: null, isHidden: false, generationId: 7 },
        { slot: 4, abilityId: 60, isHidden: false, generationId: 5 },
        { slot: 1, abilityId: 10, isHidden: false, generationId: 4 },
      ],
      GENERATIONS,
    );
    expect(membership.get(10)).toEqual({
      abilityGenerations: [3, 4],
      hiddenAbilityGenerations: [],
    });
    expect(membership.get(20)).toEqual({
      abilityGenerations: [5, 6],
      hiddenAbilityGenerations: [],
    });
    expect(membership.get(30)).toEqual({
      abilityGenerations: [7, 8, 9],
      hiddenAbilityGenerations: [],
    });
    expect(membership.get(40)).toEqual({
      abilityGenerations: [8, 9],
      hiddenAbilityGenerations: [],
    });
    // Sparse hidden-slot history must not project a modern hidden ability into Gen III/IV.
    expect(membership.get(50)).toEqual({
      abilityGenerations: [],
      hiddenAbilityGenerations: [5, 6, 7, 8, 9],
    });
    // A historical slot absent from current data disappears beyond its upper bound.
    expect(membership.get(60)).toEqual({
      abilityGenerations: [3, 4, 5],
      hiddenAbilityGenerations: [],
    });
    expect([...membership.keys()].sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it("separates ordinary and hidden roles, deduplicates slots and sorts generation membership", () => {
    const membership = projectAbilityMembership(
      [
        { slot: 1, abilityId: 10, isHidden: false },
        { slot: 2, abilityId: 10, isHidden: false },
        { slot: 3, abilityId: 10, isHidden: true },
        { slot: 4, abilityId: 20, isHidden: true },
      ],
      [],
      [9, 2, 5, 3, 5, 1, 4],
    );
    expect(membership.get(10)).toEqual({
      abilityGenerations: [3, 4, 5, 9],
      hiddenAbilityGenerations: [5, 9],
    });
    expect(membership.get(20)).toEqual({
      abilityGenerations: [],
      hiddenAbilityGenerations: [5, 9],
    });
  });

  it("keeps a hidden slot removed through its explicit null bound", () => {
    const membership = projectAbilityMembership(
      [{ slot: 3, abilityId: 50, isHidden: true }],
      [{ slot: 3, abilityId: null, isHidden: true, generationId: 6 }],
      GENERATIONS,
    );
    expect(membership.get(50)).toEqual({
      abilityGenerations: [],
      hiddenAbilityGenerations: [7, 8, 9],
    });
  });

  it("does not invent membership for empty facts or generations before abilities existed", () => {
    expect(projectAbilityMembership([], [], GENERATIONS).size).toBe(0);
    expect(
      projectAbilityMembership([{ slot: 1, abilityId: 10, isHidden: false }], [], [1, 2]).size,
    ).toBe(0);
  });
});

function learnset(overrides: Partial<LearnsetRow> = {}): LearnsetRow {
  return {
    moveId: 7,
    versionGroupId: 25,
    learnMethodId: 1,
    level: 10,
    order: null,
    mastery: null,
    ...overrides,
  };
}

describe("projectMoveMembership", () => {
  it("keeps exact version groups and genuine alternative methods/levels, not order/mastery duplicates", () => {
    const membership = projectMoveMembership([
      learnset(),
      learnset({ order: 9, mastery: 20 }),
      learnset({ versionGroupId: 26 }),
      learnset({ learnMethodId: 4, level: 0 }),
      learnset({ level: 20 }),
      learnset({ moveId: 8 }),
    ]);
    expect(membership.get(7)).toEqual([
      { versionGroupId: 25, learnMethodId: 1, level: 10 },
      { versionGroupId: 26, learnMethodId: 1, level: 10 },
      { versionGroupId: 25, learnMethodId: 4, level: 0 },
      { versionGroupId: 25, learnMethodId: 1, level: 20 },
    ]);
    expect(membership.get(7)!.filter((row) => row.versionGroupId === 25)).toEqual([
      { versionGroupId: 25, learnMethodId: 1, level: 10 },
      { versionGroupId: 25, learnMethodId: 4, level: 0 },
      { versionGroupId: 25, learnMethodId: 1, level: 20 },
    ]);
    expect(membership.get(8)).toEqual([{ versionGroupId: 25, learnMethodId: 1, level: 10 }]);
    expect(membership.has(9)).toBe(false);
  });

  it("does not fabricate a learnset for empty source rows", () => {
    expect(projectMoveMembership([]).size).toBe(0);
  });
});
