/**
 * Game-mechanics figures derived from a species' values for one selected game: stat
 * ranges, Poké Ball capture chance and steps to hatch. Pure; every rule below follows
 * Bulbapedia (checked 18/10/2026):
 * - Stats: https://bulbapedia.bulbagarden.net/wiki/Stat#Formula ("Generations I and II",
 *   "Generation III onward", and the separate Let's Go, Pikachu!/Eevee! (Go Power) and
 *   Legends: Arceus (effort levels) formulas). Nature rounding: Stat#Nature.
 * - Stat experience cap: https://bulbapedia.bulbagarden.net/wiki/Effort_values#Stat_experience
 *   (the square root rounds up unless that would exceed 255).
 * - Capture: https://bulbapedia.bulbagarden.net/wiki/Catch_rate
 * - Hatching: https://bulbapedia.bulbagarden.net/wiki/Egg_cycle
 * - No Eggs in Generation I, Let's Go, Legends: Arceus and Legends: Z-A:
 *   https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Egg
 */

/** The selected game, as far as these formulas care. */
export interface MechanicsGame {
  generationId: number;
  /** Source version group identifier, e.g. `"scarlet-violet"`. */
  versionGroup: string;
}

const LETS_GO = "lets-go-pikachu-lets-go-eevee";
const LEGENDS_ARCEUS = "legends-arceus";
// Real-time battles, game-specific base stat and catch rate changes, no breeding; the
// sources document no stat formula for it, so nothing is computed rather than guessed.
const LEGENDS_ZA = "legends-za";

const HP_STAT_ID = 1;

// ---------------------------------------------------------------------------------------
// Stats

export type NatureEffect = "hindering" | "neutral" | "beneficial";
// The game multiplies by 90/100/110 and truncates; integer maths avoids float drift.
const NATURE_PERCENT: Record<NatureEffect, number> = {
  hindering: 90,
  neutral: 100,
  beneficial: 110,
};

/** Generation III onward. Base HP 1 (Shedinja) always gives 1 HP. */
export function modernStat(input: {
  base: number;
  level: number;
  iv: number;
  ev: number;
  nature: NatureEffect;
  hp: boolean;
}): number {
  const { base, level, iv, ev, nature, hp } = input;
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (hp) return base === 1 ? 1 : core + level + 10;
  return Math.floor(((core + 5) * NATURE_PERCENT[nature]) / 100);
}

/** Generations I and II: DVs 0–15 and stat experience 0–65535. */
export function classicStat(input: {
  base: number;
  level: number;
  dv: number;
  statExp: number;
  hp: boolean;
}): number {
  const { base, level, dv, statExp, hp } = input;
  const bonus = Math.floor(Math.min(255, Math.ceil(Math.sqrt(statExp))) / 4);
  const core = Math.floor((((base + dv) * 2 + bonus) * level) / 100);
  return core + (hp ? level + 10 : 5);
}

export const RANGE_LEVELS = [50, 100] as const;
export type RangeLevel = (typeof RANGE_LEVELS)[number];

export interface StatBounds {
  min: number;
  max: number;
}
export interface StatRange {
  statId: number;
  base: number;
  levels: Record<RangeLevel, StatBounds>;
}
export type StatRanges =
  | { status: "computed"; formula: "classic" | "modern"; rows: StatRange[] }
  | { status: "not-computed"; reason: "go-power" | "effort-levels" | "special-game" };

/**
 * Worst and best possible stats at levels 50 and 100. Modern: IV 0, no EVs and a
 * hindering Nature vs IV 31, 252 EVs and a beneficial Nature (HP ignores Nature).
 * Classic: DV 0 and no stat experience vs DV 15 and 65535 stat experience.
 */
export function statRanges(
  game: MechanicsGame,
  stats: readonly { id: number; value: number }[],
): StatRanges {
  if (game.versionGroup === LETS_GO) return { status: "not-computed", reason: "go-power" };
  if (game.versionGroup === LEGENDS_ARCEUS)
    return { status: "not-computed", reason: "effort-levels" };
  if (game.versionGroup === LEGENDS_ZA || game.generationId < 1 || game.generationId > 9)
    return { status: "not-computed", reason: "special-game" };
  const classic = game.generationId <= 2;
  const bounds = (base: number, level: number, hp: boolean): StatBounds =>
    classic
      ? {
          min: classicStat({ base, level, hp, dv: 0, statExp: 0 }),
          max: classicStat({ base, level, hp, dv: 15, statExp: 65535 }),
        }
      : {
          min: modernStat({ base, level, hp, iv: 0, ev: 0, nature: "hindering" }),
          max: modernStat({ base, level, hp, iv: 31, ev: 252, nature: "beneficial" }),
        };
  return {
    status: "computed",
    formula: classic ? "classic" : "modern",
    rows: stats.map((stat) => {
      const hp = stat.id === HP_STAT_ID;
      return {
        statId: stat.id,
        base: stat.value,
        levels: { 50: bounds(stat.value, 50, hp), 100: bounds(stat.value, 100, hp) },
      };
    }),
  };
}

// ---------------------------------------------------------------------------------------
// Capture

export type CaptureChance =
  | {
      status: "computed";
      /** Probabilities in [0, 1]; equal unless the result depends on the target's HP. */
      min: number;
      max: number;
      /** Generation V+ rounding is documented only loosely: the value is approximate. */
      approximate: boolean;
    }
  | { status: "not-computed"; reason: "different-system" | "formula-unverified" };

/**
 * Chance that one Poké Ball catches a wild Pokémon at full HP with no status condition
 * and no other modifier (critical captures, dark grass, capture powers, level-based
 * bonuses or penalties all excluded).
 */
export function captureChance(game: MechanicsGame, captureRate: number): CaptureChance {
  if (
    game.versionGroup === LETS_GO ||
    game.versionGroup === LEGENDS_ARCEUS ||
    game.versionGroup === LEGENDS_ZA
  )
    return { status: "not-computed", reason: "different-system" };
  if (game.generationId < 1 || game.generationId > 9)
    return { status: "not-computed", reason: "formula-unverified" };
  const rate = captureRate;
  if (game.generationId === 1) return exact(generation1Capture(rate));
  if (game.generationId === 2) {
    let min = 1;
    let max = 0;
    // Bulbapedia: no legitimately encountered Pokémon has 342 HP or more.
    for (let hp = 1; hp <= 341; hp += 1) {
      const chance = generation2Capture(rate, hp);
      min = Math.min(min, chance);
      max = Math.max(max, chance);
    }
    return { status: "computed", min, max, approximate: false };
  }
  if (game.generationId <= 4) return exact(generation3Capture(rate));
  const chance = modernCapture(rate, game.generationId === 5 ? "three-checks" : "four-checks");
  return { status: "computed", min: chance, max: chance, approximate: true };
}

function exact(chance: number): CaptureChance {
  return { status: "computed", min: chance, max: chance, approximate: false };
}

// N (0–255) must not exceed the rate, then M (0–255) must not exceed f; at full HP with a
// Poké Ball (Ball = 12), f = ⌊255 × 4 / 12⌋ = 85.
function generation1Capture(rate: number): number {
  const f = Math.floor((255 * 4) / 12);
  return ((rate + 1) / 256) * ((f + 1) / 256);
}

// Caught when a random 0–255 is ≤ a. The HP terms are 8-bit: above 255, 3 × HPmax and
// 2 × HPcurrent are halved twice, which makes a depend slightly on the maximum HP.
function generation2Capture(rate: number, hp: number): number {
  let maxTerm = 3 * hp;
  let currentTerm = 2 * hp;
  if (maxTerm > 255) {
    maxTerm = Math.floor(Math.floor(maxTerm / 2) / 2);
    currentTerm = Math.max(1, Math.floor(Math.floor(currentTerm / 2) / 2));
  }
  const a = Math.min(255, Math.max(1, Math.floor(((maxTerm - currentTerm) * rate) / maxTerm)));
  return (a + 1) / 256;
}

// a = ⌊rate / 3⌋ at full HP (minimum 1); four shake checks pass when a random 0–65535 < b.
function generation3Capture(rate: number): number {
  const a = Math.max(1, Math.floor(rate / 3));
  if (a >= 255) return 1;
  const b = Math.floor(
    1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680 / a))))),
  );
  return (Math.min(b, 65536) / 65536) ** 4;
}

// 4096-based modified rate (maximum 255 × 4096 = 1044480). Generation V: three checks
// with b = 65536 × (a / 1044480)^(1/4); Generation VI onward: four checks with ^(3/16).
function modernCapture(rate: number, checks: "three-checks" | "four-checks"): number {
  const a = Math.floor((rate * 4096) / 3);
  if (a >= 1044480) return 1;
  const ratio = a / 1044480;
  if (checks === "three-checks") return (Math.floor(65536 * ratio ** 0.25) / 65536) ** 3;
  return (Math.floor(65536 * ratio ** 0.1875) / 65536) ** 4;
}

// ---------------------------------------------------------------------------------------
// Hatching

export type EggNote = "extra-cycle" | "special-dates";
export type EggSteps =
  | {
      status: "computed";
      /** Egg cycles to walk (one more than the counter where hatching checks first). */
      cycles: number;
      stepsPerCycle: number;
      steps: number;
      notes: EggNote[];
    }
  | { status: "cycles-only"; cycles: number }
  | { status: "no-breeding" }
  | { status: "not-recorded" };

interface Hatching {
  stepsPerCycle: number;
  /** Generations III, IV and IX check for 0 before decrementing: one extra cycle. */
  extraCycle: boolean;
  notes: EggNote[];
}

function hatching(game: MechanicsGame): Hatching | "no-breeding" | "cycles-only" {
  if (
    game.generationId === 1 ||
    game.versionGroup === LETS_GO ||
    game.versionGroup === LEGENDS_ARCEUS ||
    game.versionGroup === LEGENDS_ZA
  )
    return "no-breeding";
  switch (game.versionGroup) {
    case "platinum":
      return { stepsPerCycle: 255, extraCycle: true, notes: ["special-dates"] };
    case "sun-moon":
    case "ultra-sun-ultra-moon":
      return { stepsPerCycle: 256, extraCycle: false, notes: [] };
    // Their step lengths are known, but the source explicitly leaves counter/hatch
    // handling unconfirmed. Do not turn that uncertainty into a computed step count.
    case "sword-shield":
    case "brilliant-diamond-shining-pearl":
      return "cycles-only";
  }
  if (game.generationId === 2) return { stepsPerCycle: 256, extraCycle: false, notes: [] };
  if (game.generationId === 3) return { stepsPerCycle: 256, extraCycle: true, notes: [] };
  if (game.generationId === 4) return { stepsPerCycle: 255, extraCycle: true, notes: [] };
  if (game.generationId === 5 || game.generationId === 6)
    return { stepsPerCycle: 257, extraCycle: false, notes: [] };
  // Scarlet/Violet (Egg Powers, picnics) and anything newer: documented incompletely.
  return "cycles-only";
}

/** Approximate steps to hatch an Egg with the given hatch counter (Egg cycles). */
export function eggSteps(game: MechanicsGame, hatchCounter: number | null): EggSteps {
  const rules = hatching(game);
  if (rules === "no-breeding") return { status: "no-breeding" };
  if (hatchCounter === null) return { status: "not-recorded" };
  if (rules === "cycles-only") return { status: "cycles-only", cycles: hatchCounter };
  const cycles = hatchCounter + (rules.extraCycle ? 1 : 0);
  return {
    status: "computed",
    cycles,
    stepsPerCycle: rules.stepsPerCycle,
    steps: cycles * rules.stepsPerCycle,
    notes: rules.extraCycle ? ["extra-cycle", ...rules.notes] : rules.notes,
  };
}
