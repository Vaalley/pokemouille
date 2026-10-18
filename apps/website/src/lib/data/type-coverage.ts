import {
  introductionStatus,
  pokemonTypesAtGeneration,
} from "../../../../../packages/pokemon-data/src/resolve.ts";
import type { Language } from "#lib/i18n/core.ts";
import { defensiveMatchups, isIntroduced } from "./type-matchups.ts";
import { compareTypeMembers, type TypeMember } from "./type-membership.ts";

/** Every product of two single-type factors (0, ½, 1, 2) used by the main-series charts. */
export const MULTIPLIERS = [0, 0.25, 0.5, 1, 2, 4] as const;
export type Multiplier = (typeof MULTIPLIERS)[number];

const TYPE_ID = /^(?:[1-9]|1[0-8])$/;

export function typeCoverageHref(
  lang: Language,
  attacking: readonly number[],
  version: string | null,
): string {
  const params = new URLSearchParams();
  for (const id of [...new Set(attacking)].sort((a, b) => a - b))
    params.append("attack", String(id));
  if (version) params.set("version", version);
  return `${lang}/types/coverage/${params.size ? `?${params}` : ""}`;
}

/** Repeated `attack=<typeId>` values, deduplicated in ID order; any malformed value is flagged. */
export function readAttackSelection(params: URLSearchParams): { ids: number[]; invalid: boolean } {
  const ids = new Set<number>();
  let invalid = false;
  for (const value of params.getAll("attack")) {
    if (TYPE_ID.test(value)) ids.add(Number(value));
    else invalid = true;
  }
  return { ids: [...ids].sort((a, b) => a - b), invalid };
}

export function attackSelectionUrl(current: URL, ids: readonly number[]): URL {
  const url = new URL(current.href);
  url.searchParams.delete("attack");
  for (const id of [...new Set(ids)].sort((a, b) => a - b))
    url.searchParams.append("attack", String(id));
  return url;
}

export function formatMultiplier(multiplier: number): string {
  if (multiplier === 0.25) return "×¼";
  if (multiplier === 0.5) return "×½";
  return `×${multiplier}`;
}

/** Stable key for an unordered defending type combination. */
export function combinationKey(typeIds: readonly number[]): string {
  return [...new Set(typeIds)].sort((a, b) => a - b).join("-");
}

/**
 * Highest type-chart multiplier any selected attacking type deals to the defending types in
 * `generationId`. Null when nothing is selected, or an attacking/defending type did not exist.
 */
export function bestMultiplier(
  attacking: readonly number[],
  defending: readonly number[],
  generationId: number,
): number | null {
  if (!attacking.length || attacking.some((id) => !isIntroduced(id, generationId))) return null;
  const matchups = defensiveMatchups(defending, generationId);
  if (!matchups) return null;
  let best = -1;
  for (const row of matchups)
    if (attacking.includes(row.typeId)) best = Math.max(best, row.multiplier);
  return best < 0 ? null : best;
}

export interface CoverageBucket {
  multiplier: Multiplier;
  members: TypeMember[];
}

export interface TypeCoverage {
  /** One bucket per multiplier in ascending order, including empty buckets. */
  buckets: CoverageBucket[];
  /** Pokémon whose introduction in this game our data cannot establish. */
  missingIntroduction: number;
  /** Pokémon with no usable typing for this generation. */
  missingTypes: number;
}

/**
 * Best offensive multiplier against every variety introduced by `game`, using its typing in
 * that generation. Null when the selection is empty or contains a type absent from the chart.
 */
export function typeCoverage(
  members: readonly TypeMember[],
  attacking: readonly number[],
  game: { generationId: number; order: number },
): TypeCoverage | null {
  if (!attacking.length || attacking.some((id) => !isIntroduced(id, game.generationId)))
    return null;
  const buckets = new Map(MULTIPLIERS.map((m): [number, TypeMember[]] => [m, []]));
  let missingIntroduction = 0;
  let missingTypes = 0;
  for (const member of members) {
    const status = introductionStatus(member.generationId, member.introductionOrder, game);
    if (status === "not-introduced") continue;
    const types = pokemonTypesAtGeneration(member, game.generationId).map((row) => row.typeId);
    const best = types.length ? bestMultiplier(attacking, types, game.generationId) : null;
    const bucket = best === null ? undefined : buckets.get(best);
    if (!bucket) missingTypes += 1;
    else if (status === "unknown") missingIntroduction += 1;
    else bucket.push(member);
  }
  return {
    buckets: MULTIPLIERS.map((multiplier) => ({
      multiplier,
      members: buckets.get(multiplier)!.sort(compareTypeMembers),
    })),
    missingIntroduction,
    missingTypes,
  };
}

/**
 * Distinct defending combinations (single and dual) of varieties introduced by `game`, with
 * their typing in its generation. Varieties with unknown introduction are left out.
 */
export function existingCombinations(
  members: readonly TypeMember[],
  game: { generationId: number; order: number },
): number[][] {
  const combinations = new Map<string, number[]>();
  for (const member of members) {
    if (introductionStatus(member.generationId, member.introductionOrder, game) !== "available")
      continue;
    const types = [
      ...new Set(pokemonTypesAtGeneration(member, game.generationId).map((row) => row.typeId)),
    ].sort((a, b) => a - b);
    if (
      !types.length ||
      types.length > 2 ||
      types.some((id) => !isIntroduced(id, game.generationId))
    )
      continue;
    combinations.set(combinationKey(types), types);
  }
  return [...combinations.values()].sort((a, b) => a[0]! - b[0]! || (a[1] ?? 0) - (b[1] ?? 0));
}

/** Every single type and unordered pair of types introduced by `generationId`. */
export function theoreticalCombinations(generationId: number): number[][] {
  const combinations: number[][] = [];
  for (let first = 1; first <= 18; first++) {
    if (!isIntroduced(first, generationId)) continue;
    combinations.push([first]);
    for (let second = first + 1; second <= 18; second++)
      if (isIntroduced(second, generationId)) combinations.push([first, second]);
  }
  return combinations;
}

/** Combinations every selected attacking type resists or cannot affect, with the best multiplier. */
export function resistantCombinations(
  combinations: readonly (readonly number[])[],
  attacking: readonly number[],
  generationId: number,
): { types: readonly number[]; multiplier: number }[] {
  const rows: { types: readonly number[]; multiplier: number }[] = [];
  for (const types of combinations) {
    const multiplier = bestMultiplier(attacking, types, generationId);
    if (multiplier !== null && multiplier < 1) rows.push({ types, multiplier });
  }
  return rows;
}

/** Damage each attacking type introduced by `generationId` deals to each defending combination. */
export function defendingChart(
  combinations: readonly (readonly number[])[],
  generationId: number,
): { types: readonly number[]; multipliers: { typeId: number; multiplier: number }[] }[] {
  return combinations.flatMap((types) => {
    const multipliers = defensiveMatchups(types, generationId);
    return multipliers ? [{ types, multipliers }] : [];
  });
}
