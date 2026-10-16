import { describe, expect, it } from "vite-plus/test";
import { defensiveMatchups } from "./type-matchups.ts";

describe("defensiveMatchups", () => {
  it("multiplies dual weaknesses and resistances", () => {
    expect(defensiveMatchups([10, 3], 9)).toContainEqual({ typeId: 6, multiplier: 4 });
    expect(defensiveMatchups([9, 10], 9)).toContainEqual({ typeId: 12, multiplier: 0.25 });
  });

  it("lets immunity override weakness in either defending order", () => {
    expect(defensiveMatchups([11, 5], 9)).toContainEqual({ typeId: 13, multiplier: 0 });
    expect(defensiveMatchups([5, 11], 9)).toContainEqual({ typeId: 13, multiplier: 0 });
  });

  it("cancels a weakness with a resistance and includes neutral attacks", () => {
    expect(defensiveMatchups([11, 16], 9)).toContainEqual({ typeId: 13, multiplier: 1 });
    expect(defensiveMatchups([1], 9)).toContainEqual({ typeId: 10, multiplier: 1 });
  });

  it("deduplicates repeated defenders", () => {
    expect(defensiveMatchups([10, 10], 9)).toEqual(defensiveMatchups([10], 9));
    expect(defensiveMatchups([10, 3, 10], 9)).toEqual(defensiveMatchups([10, 3], 9));
  });

  it("applies every generation-one historical change until generation two", () => {
    for (const [attacking, defending, oldFactor, newFactor] of [
      [4, 7, 2, 1],
      [7, 4, 2, 0.5],
      [8, 14, 0, 2],
      [15, 10, 1, 0.5],
    ]) {
      expect(defensiveMatchups([defending!], 1)).toContainEqual({
        typeId: attacking,
        multiplier: oldFactor,
      });
      expect(defensiveMatchups([defending!], 2)).toContainEqual({
        typeId: attacking,
        multiplier: newFactor,
      });
    }
  });

  it("retains Steel's Ghost and Dark resistances through generation five", () => {
    for (const generation of [2, 5, 6]) {
      for (const typeId of [8, 17]) {
        expect(defensiveMatchups([9], generation)).toContainEqual({
          typeId,
          multiplier: generation < 6 ? 0.5 : 1,
        });
      }
    }
  });

  it("returns only introduced attacking types in ID order", () => {
    expect(defensiveMatchups([1], 1)?.map(({ typeId }) => typeId)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16,
    ]);
    for (const generation of [2, 5]) {
      expect(defensiveMatchups([1], generation)?.map(({ typeId }) => typeId)).toEqual(
        Array.from({ length: 17 }, (_, index) => index + 1),
      );
    }
    for (const generation of [6, 9]) {
      expect(defensiveMatchups([1], generation)?.map(({ typeId }) => typeId)).toEqual(
        Array.from({ length: 18 }, (_, index) => index + 1),
      );
      expect(defensiveMatchups([18], generation)).toContainEqual({ typeId: 16, multiplier: 0 });
    }
  });

  it("rejects absent, unknown, nonstandard and not-yet-introduced defenders", () => {
    for (const defenders of [[], [0], [-1], [19], [10001], [10002], [1.5], [NaN], [1, 19]]) {
      expect(defensiveMatchups(defenders, 9)).toBeNull();
    }
    for (const typeId of [9, 17, 18]) {
      expect(defensiveMatchups([typeId], 1)).toBeNull();
    }
    expect(defensiveMatchups([18], 5)).toBeNull();
    for (const generation of [0, -1, 1.5, NaN, Infinity]) {
      expect(defensiveMatchups([1], generation)).toBeNull();
    }
  });
});
