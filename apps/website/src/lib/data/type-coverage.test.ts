import { describe, expect, it } from "vite-plus/test";
import {
  attackSelectionUrl,
  bestMultiplier,
  defendingChart,
  existingCombinations,
  formatMultiplier,
  readAttackSelection,
  resistantCombinations,
  theoreticalCombinations,
  typeCoverage,
  typeCoverageHref,
  type TypeCoverage,
} from "./type-coverage.ts";
import type { TypeMember } from "./type-membership.ts";

function member(speciesId: number, types: number[], extra: Partial<TypeMember> = {}): TypeMember {
  return {
    speciesId,
    pokemonId: speciesId,
    form: null,
    name: {
      text: String(speciesId),
      requestedLanguage: "en",
      fallback: false,
      sourceLanguageId: 9,
    },
    generationId: 1,
    introductionOrder: 1,
    types: types.map((typeId, index) => ({ slot: index + 1, typeId })),
    typeHistory: [],
    ...extra,
  };
}

const gen1 = { generationId: 1, order: 1 };
const gen9 = { generationId: 9, order: 25 };
const members = [
  // Clefairy was Normal until generation five.
  member(35, [18], { typeHistory: [{ generationId: 5, types: [{ slot: 1, typeId: 1 }] }] }),
  member(130, [11, 3]),
  member(92, [8, 4]),
  member(906, [12], { generationId: 9, introductionOrder: 25 }),
  member(150, [14], { pokemonId: 10051, form: "mega-x", introductionOrder: null }),
  member(151, []),
];

function bucket(result: TypeCoverage | null, multiplier: number) {
  return result?.buckets
    .find((row) => row.multiplier === multiplier)
    ?.members.map((row) => row.speciesId);
}

describe("bestMultiplier", () => {
  it("returns null for an empty selection", () => {
    expect(bestMultiplier([], [1], 9)).toBeNull();
  });

  it("lets a defending immunity override a weakness of the other type", () => {
    expect(bestMultiplier([13], [11, 5], 9)).toBe(0);
    expect(bestMultiplier([13], [5, 11], 9)).toBe(0);
  });

  it("keeps the best selected type, including ×4", () => {
    expect(bestMultiplier([13, 12], [11, 5], 9)).toBe(4);
    expect(bestMultiplier([6], [10, 3], 9)).toBe(4);
    expect(bestMultiplier([12], [9, 10], 9)).toBe(0.25);
  });

  it("uses the generation-one chart", () => {
    expect(bestMultiplier([8], [14], 1)).toBe(0);
    expect(bestMultiplier([8], [14], 2)).toBe(2);
    expect(bestMultiplier([7], [4], 1)).toBe(2);
    expect(bestMultiplier([7], [4], 2)).toBe(0.5);
    expect(bestMultiplier([15], [10], 1)).toBe(1);
  });

  it("rejects types absent from the generation", () => {
    expect(bestMultiplier([17], [1], 1)).toBeNull();
    expect(bestMultiplier([1], [18], 5)).toBeNull();
  });
});

describe("typeCoverage", () => {
  it("returns null for an empty or not-yet-introduced selection", () => {
    expect(typeCoverage(members, [], gen9)).toBeNull();
    expect(typeCoverage(members, [18], { generationId: 5, order: 14 })).toBeNull();
  });

  it("buckets introduced varieties by their historical typing", () => {
    const old = typeCoverage(members, [2], gen1);
    expect(old?.buckets.map((row) => row.multiplier)).toEqual([0, 0.25, 0.5, 1, 2, 4]);
    expect(bucket(old, 2)).toEqual([35]);
    expect(bucket(old, 0)).toEqual([92]);
    expect(bucket(old, 0.5)).toEqual([130]);
    expect(old).toMatchObject({ missingIntroduction: 1, missingTypes: 1 });

    const modern = typeCoverage(members, [2], gen9);
    expect(bucket(modern, 0.5)).toEqual([35, 130]);
    expect(bucket(modern, 1)).toEqual([906]);
  });

  it("takes the best of several attacking types", () => {
    const result = typeCoverage(members, [13, 8], gen9);
    expect(bucket(result, 4)).toEqual([130]);
    expect(bucket(result, 2)).toEqual([92]);
    expect(bucket(result, 1)).toEqual([35, 906]);
    expect(bucket(result, 0.5)).toEqual([]);
  });
});

describe("combinations", () => {
  it("lists distinct historical combinations of introduced varieties", () => {
    const duplicate = member(131, [3, 11], { pokemonId: 131 });
    expect(existingCombinations([...members, duplicate], gen1)).toEqual([[1], [3, 11], [4, 8]]);
    expect(existingCombinations(members, gen9)).toEqual([[3, 11], [4, 8], [12], [18]]);
  });

  it("counts every single type and pair in the generation", () => {
    expect(theoreticalCombinations(1)).toHaveLength(15 + 105);
    expect(theoreticalCombinations(6)).toHaveLength(18 + 153);
    expect(theoreticalCombinations(1)).not.toContainEqual([9]);
  });

  it("keeps only combinations resisting every selected type", () => {
    expect(resistantCombinations([[1], [8], [9], [8, 9]], [1, 2], 9)).toEqual([
      { types: [8], multiplier: 0 },
      { types: [8, 9], multiplier: 0 },
    ]);
    expect(resistantCombinations([[9]], [], 9)).toEqual([]);
  });

  it("charts multipliers for every attacking type of the generation", () => {
    const [row] = defendingChart([[14]], 1);
    expect(row?.multipliers).toHaveLength(15);
    expect(row?.multipliers).toContainEqual({ typeId: 8, multiplier: 0 });
    expect(defendingChart([[18]], 1)).toEqual([]);
  });
});

describe("attack selection URLs", () => {
  it("reads repeated attack values in ID order and flags malformed ones", () => {
    expect(readAttackSelection(new URLSearchParams("attack=13&attack=11&attack=13"))).toEqual({
      ids: [11, 13],
      invalid: false,
    });
    expect(readAttackSelection(new URLSearchParams("attack=19&attack=01&attack=5"))).toEqual({
      ids: [5],
      invalid: true,
    });
  });

  it("writes attack values and keeps other parameters", () => {
    const url = attackSelectionUrl(
      new URL("https://example.test/en/types/coverage/?attack=1&version=red"),
      [13, 11],
    );
    expect(url.search).toBe("?version=red&attack=11&attack=13");
    expect(typeCoverageHref("fr", [], "scarlet")).toBe("fr/types/coverage/?version=scarlet");
  });

  it("formats fractional multipliers", () => {
    expect([0, 0.25, 0.5, 4].map(formatMultiplier)).toEqual(["×0", "×¼", "×½", "×4"]);
  });
});
