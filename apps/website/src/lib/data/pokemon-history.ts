import {
  getMainSeriesGames,
  resolvePokemon,
} from "../../../../../packages/pokemon-data/src/index.ts";
import type {
  FlavorText,
  Language,
  LocalizedText,
  PokemonReferences,
  SpeciesRecord,
  Version,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";

/**
 * Game text keeps cartridge line breaks: soft-hyphen breaks join words; Japanese text
 * separates phrases with an ideographic space, other scripts with one space.
 */
export function normalizeFlavorText(text: string, sourceLanguageId: number | null): string {
  const japanese = sourceLanguageId === 1 || sourceLanguageId === 11;
  return text
    .replace(/\u00ad[\n\f]/g, "")
    .replace(/[\n\f\r]+/g, japanese ? "\u3000" : " ")
    .replace(/ {2,}/g, " ");
}

export interface DexEntryRow {
  /** Versions sharing this exact text, in release order. */
  versions: Version[];
  text: LocalizedText;
}

/**
 * One row per distinct text, versions in release order (version-group order, then the
 * references' version order). Each version uses only its own rows with the usual language
 * fallback; a version with no text in the fallback chain is left out, never filled from
 * another game. Identical texts (same source language) share a row.
 */
export function dexEntries(
  flavorTexts: readonly FlavorText[],
  references: Pick<PokemonReferences, "versions" | "versionGroups">,
  language: Language,
): DexEntryRow[] {
  const byVersion = new Map<number, FlavorText[]>();
  for (const row of flavorTexts) {
    const rows = byVersion.get(row.versionId);
    if (rows) rows.push(row);
    else byVersion.set(row.versionId, [row]);
  }
  const groupOrder = new Map(references.versionGroups.map((group) => [group.id, group.order]));
  const versions = references.versions
    .map((version, index) => ({ version, index, order: groupOrder.get(version.versionGroupId) }))
    .filter(
      (entry): entry is { version: Version; index: number; order: number } =>
        entry.order !== undefined && byVersion.has(entry.version.id),
    )
    .sort((a, b) => a.order - b.order || a.index - b.index);

  const rows: DexEntryRow[] = [];
  const byText = new Map<string, DexEntryRow>();
  for (const { version } of versions) {
    const text = localize(
      byVersion.get(version.id)!.map((row) => ({ languageId: row.languageId, name: row.text })),
      language,
      "",
    );
    if (text.sourceLanguageId === null) continue;
    const normalized = normalizeFlavorText(text.text, text.sourceLanguageId);
    const key = `${text.sourceLanguageId}\u0000${text.text}`;
    const existing = byText.get(key);
    if (existing) existing.versions.push(version);
    else {
      const row = { versions: [version], text: { ...text, text: normalized } };
      rows.push(row);
      byText.set(key, row);
    }
  }
  return rows;
}

/** A generation range with one value; `null` = not established by the source for that range. */
export interface Segment<T> {
  from: number;
  to: number;
  value: T | null;
}

/** Merges consecutive points with equal values (unknown only merges with unknown). */
export function toSegments<T>(
  points: readonly { generationId: number; value: T | null }[],
  same: (a: T, b: T) => boolean,
): Segment<T>[] {
  const segments: Segment<T>[] = [];
  for (const { generationId, value } of points) {
    const last = segments.at(-1);
    const equal =
      last !== undefined &&
      (last.value === null || value === null ? last.value === value : same(last.value, value));
    if (last && equal) last.to = generationId;
    else segments.push({ from: generationId, to: generationId, value });
  }
  return segments;
}

export interface HistoryType {
  id: number;
  name: LocalizedText;
}
export interface StatHistory {
  id: number;
  name: LocalizedText;
  base: Segment<number>[];
  effort: Segment<number>[];
}
/** `"none"`: the source records that the slot had no ability in that range. */
export type AbilityValue = { id: number; name: LocalizedText } | "none";
export interface AbilityHistory {
  slot: number;
  isHidden: boolean;
  segments: Segment<AbilityValue>[];
}
export interface PokemonHistory {
  /** Evaluated generations, ascending, from the selected Pokémon's introduction to the latest
   * generation with a selectable game. Empty when the source does not establish introduction. */
  generations: number[];
  types: Segment<HistoryType[]>[];
  /** In the latest generation's stat order; Generation I's Special comes last. */
  stats: StatHistory[];
  abilities: AbilityHistory[];
}

// Mirrors resolvePokemon's stat layouts (Generation I: single Special, id 9). Only used to
// mark every stat unknown in a generation whose stats the source does not establish.
const GENERATION_I_STATS = [1, 2, 3, 6, 9];
const MODERN_STATS = [1, 2, 3, 4, 5, 6];

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const rows = map.get(key);
  if (rows) rows.push(value);
  else map.set(key, [value]);
}

/**
 * Per-field histories by generation, using resolvePokemon itself on each generation's latest
 * selectable game so every value matches what the page shows for any game of that generation.
 * Generations without a selectable game are unknown, never interpolated.
 */
export function pokemonHistory(
  record: SpeciesRecord,
  references: PokemonReferences,
  context: { language: Language; form?: string },
): PokemonHistory {
  // Games are sorted by release order, so the last one seen per generation is its latest.
  const representative = new Map<number, string>();
  for (const game of getMainSeriesGames(references))
    representative.set(game.group.generationId, game.version.identifier);
  const latest = Math.max(...representative.keys());
  const generationIds = references.generations
    .map((generation) => generation.id)
    .filter((id) => id <= latest)
    .sort((a, b) => a - b);

  type Point<T> = { generationId: number; value: T | null };
  const generations: number[] = [];
  const typePoints: Point<HistoryType[]>[] = [];
  const basePoints = new Map<number, Point<number>[]>();
  const effortPoints = new Map<number, Point<number>[]>();
  const statNames = new Map<number, LocalizedText>();
  let statOrder: number[] = [];
  const abilityPoints = new Map<number, Point<AbilityValue>[]>();
  /** Ability slot → hidden flag, from every current and historical row of the variety. */
  let abilitySlots: Map<number, boolean> | undefined;

  for (const generationId of generationIds) {
    const version = representative.get(generationId);
    const pokemon =
      version === undefined
        ? null
        : resolvePokemon(
            record,
            references,
            context.form === undefined
              ? { language: context.language, version }
              : { language: context.language, version, form: context.form },
          );
    // Before introduction (or with unestablished introduction) nothing is placed; a
    // generation without a selectable game after introduction is explicitly unknown.
    if (pokemon ? pokemon.status !== "available" : !generations.length) continue;
    generations.push(generationId);
    if (pokemon && !abilitySlots) {
      const variety = record.varieties.find((entry) => entry.id === pokemon.pokemonId);
      abilitySlots = new Map();
      for (const row of [...(variety?.abilityHistory ?? []), ...(variety?.abilities ?? [])])
        abilitySlots.set(row.slot, row.isHidden);
    }

    typePoints.push({
      generationId,
      value:
        pokemon?.types.status === "available"
          ? pokemon.types.value.map(({ id, name }) => ({ id, name }))
          : null,
    });

    if (pokemon?.stats.status === "available") {
      statOrder = pokemon.stats.value.map((stat) => stat.id);
      for (const stat of pokemon.stats.value) {
        statNames.set(stat.id, stat.name);
        push(basePoints, stat.id, { generationId, value: stat.value });
        push(effortPoints, stat.id, { generationId, value: stat.effort });
      }
    } else
      for (const id of generationId === 1 ? GENERATION_I_STATS : MODERN_STATS) {
        push(basePoints, id, { generationId, value: null });
        push(effortPoints, id, { generationId, value: null });
      }

    // Abilities exist from Generation III; resolvePokemon reports earlier ones as not applicable.
    if (pokemon?.abilities.status === "not-applicable" || (!pokemon && generationId < 3)) continue;
    const abilities = pokemon?.abilities.status === "available" ? pokemon.abilities.value : null;
    for (const slot of abilitySlots?.keys() ?? []) {
      const ability = abilities?.find((row) => row.slot === slot);
      push(abilityPoints, slot, {
        generationId,
        value:
          abilities === null ? null : ability ? { id: ability.id, name: ability.name } : "none",
      });
    }
  }

  const sameNumber = (a: number, b: number) => a === b;
  // Latest layout first (HP … Speed), then stats only older layouts had (Generation I Special).
  const statIds = [...statOrder, ...[...basePoints.keys()].filter((id) => !statOrder.includes(id))];
  return {
    generations,
    types: toSegments(
      typePoints,
      (a, b) => a.length === b.length && a.every((type, index) => type.id === b[index]!.id),
    ),
    stats: statIds.map((id) => {
      const resource = references.stats.find((stat) => stat.id === id);
      return {
        id,
        name:
          statNames.get(id) ??
          localize(resource?.names ?? [], context.language, resource?.identifier ?? String(id)),
        base: toSegments(basePoints.get(id)!, sameNumber),
        effort: toSegments(effortPoints.get(id)!, sameNumber),
      };
    }),
    abilities: [...abilityPoints]
      .sort(([a], [b]) => a - b)
      .map(([slot, points]) => ({
        slot,
        isHidden: abilitySlots?.get(slot) ?? false,
        segments: toSegments(points, (a, b) =>
          a === "none" || b === "none" ? a === b : a.id === b.id,
        ),
      })),
  };
}

/** Unknown ranges are source gaps, not evidence that a value changed. */
function hasDistinctKnownValues<T>(
  segments: readonly Segment<T>[],
  same: (a: T, b: T) => boolean,
): boolean {
  let first: T | null = null;
  for (const { value } of segments) {
    if (value === null) continue;
    if (first === null) first = value;
    else if (!same(first, value)) return true;
  }
  return false;
}

/** Whether the source establishes at least two different values for a field. */
export function hasRecordedChange(history: PokemonHistory): boolean {
  return (
    hasDistinctKnownValues(
      history.types,
      (a, b) => a.length === b.length && a.every((type, index) => type.id === b[index]!.id),
    ) ||
    history.stats.some(
      (stat) =>
        hasDistinctKnownValues(stat.base, (a, b) => a === b) ||
        hasDistinctKnownValues(stat.effort, (a, b) => a === b),
    ) ||
    history.abilities.some((ability) =>
      hasDistinctKnownValues(ability.segments, (a, b) =>
        a === "none" || b === "none" ? a === b : a.id === b.id,
      ),
    )
  );
}
