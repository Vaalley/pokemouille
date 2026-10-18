import { describe, expect, it } from "vite-plus/test";
import {
  captureChance,
  classicStat,
  eggSteps,
  modernStat,
  statRanges,
  type MechanicsGame,
} from "./stat-formulas.ts";

const game = (generationId: number, versionGroup: string): MechanicsGame => ({
  generationId,
  versionGroup,
});
const RED_BLUE = game(1, "red-blue");
const GOLD_SILVER = game(2, "gold-silver");
const EMERALD = game(3, "emerald");
const DIAMOND_PEARL = game(4, "diamond-pearl");
const BLACK_WHITE = game(5, "black-white");
const X_Y = game(6, "x-y");
const SUN_MOON = game(7, "sun-moon");
const SCARLET_VIOLET = game(9, "scarlet-violet");
const SPECIAL_GAMES = [
  game(7, "lets-go-pikachu-lets-go-eevee"),
  game(8, "legends-arceus"),
  game(9, "legends-za"),
];

describe("modernStat", () => {
  it("matches the source's worked Generation III+ example (level 78 Garchomp)", () => {
    expect(modernStat({ base: 108, level: 78, iv: 24, ev: 74, nature: "neutral", hp: true })).toBe(
      289,
    );
    expect(
      modernStat({ base: 130, level: 78, iv: 12, ev: 190, nature: "beneficial", hp: false }),
    ).toBe(278);
  });

  it("truncates after the Nature multiplier instead of rounding", () => {
    // ⌊(2 × 50 × 100 / 100)⌋ + 5 = 105: × 0.9 = 94.5 and × 1.1 = 115.5.
    const stat = (nature: "hindering" | "neutral" | "beneficial") =>
      modernStat({ base: 50, level: 100, iv: 0, ev: 0, nature, hp: false });
    expect([stat("hindering"), stat("neutral"), stat("beneficial")]).toEqual([94, 105, 115]);
  });

  it("ignores Nature for HP and keeps base HP 1 (Shedinja) at exactly 1", () => {
    expect(modernStat({ base: 108, level: 100, iv: 0, ev: 0, nature: "hindering", hp: true })).toBe(
      326,
    );
    expect(
      modernStat({ base: 1, level: 100, iv: 31, ev: 252, nature: "beneficial", hp: true }),
    ).toBe(1);
  });

  it("counts EVs in steps of 4", () => {
    const attack = (ev: number) =>
      modernStat({ base: 100, level: 100, iv: 0, ev, nature: "neutral", hp: false });
    expect(attack(251)).toBe(attack(248));
    expect(attack(252)).toBe(attack(248) + 1);
  });
});

describe("classicStat", () => {
  it("matches the source's worked Generation I–II example (level 81 Pikachu)", () => {
    expect(classicStat({ base: 35, level: 81, dv: 7, statExp: 22850, hp: true })).toBe(189);
    expect(classicStat({ base: 50, level: 81, dv: 9, statExp: 19625, hp: false })).toBe(128);
    expect(classicStat({ base: 90, level: 81, dv: 5, statExp: 24795, hp: false })).toBe(190);
  });

  it("caps the stat experience bonus at 63 points, reached from 63002", () => {
    const bonus = (statExp: number) =>
      classicStat({ base: 0, level: 100, dv: 0, statExp, hp: false }) - 5;
    expect([bonus(0), bonus(63001), bonus(63002), bonus(65535)]).toEqual([0, 62, 63, 63]);
    // A non-square just over 3² must ceil its square root before dividing by 4.
    expect([bonus(9), bonus(10), bonus(15), bonus(16)]).toEqual([0, 1, 1, 1]);
  });
});

describe("statRanges", () => {
  const garchomp = [
    { id: 1, value: 108 },
    { id: 2, value: 130 },
  ];

  it("gives worst and best stats at levels 50 and 100 from Generation III onward", () => {
    const ranges = statRanges(DIAMOND_PEARL, garchomp);
    expect(ranges).toEqual({
      status: "computed",
      formula: "modern",
      rows: [
        {
          statId: 1,
          base: 108,
          levels: { 50: { min: 168, max: 215 }, 100: { min: 326, max: 420 } },
        },
        {
          statId: 2,
          base: 130,
          levels: { 50: { min: 121, max: 200 }, 100: { min: 238, max: 394 } },
        },
      ],
    });
  });

  it("uses DVs and stat experience in Generations I–II, including the Special stat", () => {
    const ranges = statRanges(RED_BLUE, [
      { id: 1, value: 35 },
      { id: 9, value: 50 },
    ]);
    expect(ranges.status === "computed" && ranges.formula).toBe("classic");
    expect(ranges.status === "computed" && ranges.rows.map((row) => row.levels)).toEqual([
      { 50: { min: 95, max: 141 }, 100: { min: 180, max: 273 } },
      { 50: { min: 55, max: 101 }, 100: { min: 105, max: 198 } },
    ]);
    expect(statRanges(GOLD_SILVER, [{ id: 4, value: 50 }])).toMatchObject({ formula: "classic" });
    expect(statRanges(EMERALD, [{ id: 4, value: 50 }])).toMatchObject({ formula: "modern" });
  });

  it("keeps base HP 1 at 1 HP only where the modern formula applies", () => {
    const shedinja = statRanges(EMERALD, [{ id: 1, value: 1 }]);
    expect(shedinja.status === "computed" && shedinja.rows[0]!.levels).toEqual({
      50: { min: 1, max: 1 },
      100: { min: 1, max: 1 },
    });
    expect(statRanges(RED_BLUE, [{ id: 1, value: 1 }])).toMatchObject({
      rows: [{ levels: { 50: { min: 61, max: 107 }, 100: { min: 112, max: 205 } } }],
    });
  });

  it("refuses games with their own stat mechanics", () => {
    expect(SPECIAL_GAMES.map((entry) => statRanges(entry, garchomp))).toEqual([
      { status: "not-computed", reason: "go-power" },
      { status: "not-computed", reason: "effort-levels" },
      { status: "not-computed", reason: "special-game" },
    ]);
    expect(statRanges(SUN_MOON, garchomp).status).toBe("computed");
  });

  it("does not silently extend formulas to an unverified generation", () => {
    expect(statRanges(game(10, "unverified"), garchomp)).toEqual({
      status: "not-computed",
      reason: "special-game",
    });
  });
});

describe("captureChance", () => {
  it("uses the Generation I method: (rate + 1) / 256 × 86 / 256 at full HP", () => {
    expect(captureChance(RED_BLUE, 255)).toEqual({
      status: "computed",
      min: (256 / 256) * (86 / 256),
      max: (256 / 256) * (86 / 256),
      approximate: false,
    });
    expect(captureChance(RED_BLUE, 45)).toMatchObject({ min: (46 / 256) * (86 / 256) });
  });

  it("gives a Generation II range because the 8-bit HP terms depend on maximum HP", () => {
    const chance = captureChance(GOLD_SILVER, 45);
    expect(chance.status).toBe("computed");
    if (chance.status !== "computed") return;
    // Up to 85 HP the modified rate is exactly ⌊45 / 3⌋ = 15.
    expect(chance.min).toBeLessThan(16 / 256);
    expect(chance.max).toBeGreaterThanOrEqual(16 / 256);
    expect(chance.approximate).toBe(false);
  });

  it("uses the Generation III–IV shake checks", () => {
    // a = 85 → b = ⌊1048560 / ⌊√⌊√196608⌋⌋⌋ = 49931; four checks.
    expect(captureChance(EMERALD, 255)).toMatchObject({
      min: (49931 / 65536) ** 4,
      approximate: false,
    });
    // a never falls below 1: b = ⌊1048560 / 63⌋ = 16643.
    expect(captureChance(DIAMOND_PEARL, 3)).toMatchObject({ min: (16643 / 65536) ** 4 });
  });

  it("approximates Generation V+ as (a / 1044480)^0.75 with either shake scheme", () => {
    for (const entry of [BLACK_WHITE, X_Y, SCARLET_VIOLET]) {
      const chance = captureChance(entry, 255);
      expect(chance).toMatchObject({ status: "computed", approximate: true });
      if (chance.status === "computed") expect(chance.min).toBeCloseTo((1 / 3) ** 0.75, 3);
    }
  });

  it("refuses games with a different capture system", () => {
    for (const entry of SPECIAL_GAMES)
      expect(captureChance(entry, 45)).toEqual({
        status: "not-computed",
        reason: "different-system",
      });
  });

  it("does not silently reuse the modern formula for an unverified generation", () => {
    expect(captureChance(game(10, "unverified"), 45)).toEqual({
      status: "not-computed",
      reason: "formula-unverified",
    });
  });
});

describe("eggSteps", () => {
  it("has no Eggs in Generation I and the Let's Go and Legends games", () => {
    for (const entry of [RED_BLUE, ...SPECIAL_GAMES])
      expect(eggSteps(entry, 20)).toEqual({ status: "no-breeding" });
  });

  it("multiplies cycles by the generation's steps per cycle", () => {
    expect(eggSteps(GOLD_SILVER, 20)).toEqual({
      status: "computed",
      cycles: 20,
      stepsPerCycle: 256,
      steps: 5120,
      notes: [],
    });
    expect(eggSteps(BLACK_WHITE, 20)).toMatchObject({ stepsPerCycle: 257, steps: 5140 });
    expect(eggSteps(X_Y, 20)).toMatchObject({ stepsPerCycle: 257, steps: 5140 });
    expect(eggSteps(SUN_MOON, 20)).toMatchObject({ stepsPerCycle: 256, steps: 5120 });
  });

  it("adds the extra cycle walked in Generations III–IV", () => {
    expect(eggSteps(EMERALD, 20)).toEqual({
      status: "computed",
      cycles: 21,
      stepsPerCycle: 256,
      steps: 5376,
      notes: ["extra-cycle"],
    });
    expect(eggSteps(DIAMOND_PEARL, 5)).toMatchObject({ cycles: 6, steps: 1530 });
    expect(eggSteps(game(4, "platinum"), 5)).toMatchObject({
      notes: ["extra-cycle", "special-dates"],
    });
  });

  it("only reports cycles when counter/hatching mechanics remain unconfirmed", () => {
    for (const entry of [
      game(8, "sword-shield"),
      game(8, "brilliant-diamond-shining-pearl"),
      SCARLET_VIOLET,
      game(10, "unverified"),
    ]) {
      expect(eggSteps(entry, 20)).toEqual({ status: "cycles-only", cycles: 20 });
    }
  });

  it("distinguishes a missing hatch counter from a game without Eggs", () => {
    expect(eggSteps(EMERALD, null)).toEqual({ status: "not-recorded" });
    expect(eggSteps(SCARLET_VIOLET, null)).toEqual({ status: "not-recorded" });
    expect(eggSteps(RED_BLUE, null)).toEqual({ status: "no-breeding" });
    expect(eggSteps(game(8, "legends-arceus"), null)).toEqual({ status: "no-breeding" });
  });
});
