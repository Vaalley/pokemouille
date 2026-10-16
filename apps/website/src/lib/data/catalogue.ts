import type {
  AbilitySlot,
  LearnsetRow,
  LocalizedText,
} from "../../../../../packages/pokemon-data/src/index.ts";

export interface CatalogueSpecies {
  id: number;
  name: string;
  generationId: number;
  typeIds: number[];
}

export interface Catalogue {
  species: CatalogueSpecies[];
  types: { id: number; name: LocalizedText }[];
  generations: number[];
}

export interface RelatedPokemon {
  speciesId: number;
  pokemonId: number;
  form: string | null;
  name: LocalizedText;
  generationId: number;
  introducedVersionGroupId: number | null;
  learnsets: { versionGroupId: number; learnMethodId: number; level: number }[];
  abilityGenerations: number[];
  hiddenAbilityGenerations: number[];
}

export interface RelatedPokemonData {
  pokemon: RelatedPokemon[];
  learnMethods: { id: number; name: LocalizedText }[];
}

interface AbilityMembership {
  abilityGenerations: number[];
  hiddenAbilityGenerations: number[];
}

/**
 * Generation-based membership, not game-specific mechanics or obtainability.
 * Like resolvePokemon's historicalByKey, histories are independent per slot:
 * the earliest applicable inclusive upper bound wins, including an explicit null.
 * Hidden slots do not exist before Generation V, even when history is sparse.
 * abilityGenerations records ordinary slots only; hiddenAbilityGenerations
 * records hidden slots. A generation can occur in both when both roles exist.
 */
export function projectAbilityMembership(
  current: readonly AbilitySlot[],
  history: readonly (AbilitySlot & { generationId: number })[],
  generations: readonly number[],
): Map<number, AbilityMembership> {
  const membership = new Map<number, AbilityMembership>();
  for (const generationId of [...new Set(generations)].sort((a, b) => a - b)) {
    if (generationId < 3) continue;
    const slots = new Map(current.map((row) => [row.slot, row]));
    const bounds = new Map<number, number>();
    for (const row of history) {
      const bound = bounds.get(row.slot);
      if (row.generationId >= generationId && (bound === undefined || row.generationId < bound)) {
        slots.set(row.slot, row);
        bounds.set(row.slot, row.generationId);
      }
    }
    for (const row of slots.values()) {
      if (row.abilityId === null || (row.isHidden && generationId < 5)) continue;
      let entry = membership.get(row.abilityId);
      if (!entry) {
        entry = { abilityGenerations: [], hiddenAbilityGenerations: [] };
        membership.set(row.abilityId, entry);
      }
      // The same ability can occupy several slots: emit each role once per generation.
      const role = row.isHidden ? entry.hiddenAbilityGenerations : entry.abilityGenerations;
      if (role.at(-1) !== generationId) role.push(generationId);
    }
  }
  return membership;
}

/**
 * Keep exact source version groups: no latest-game fallback or cross-game union.
 * Source order/mastery do not change membership. Distinct methods and levels do.
 */
export function projectMoveMembership(
  rows: readonly LearnsetRow[],
): Map<number, RelatedPokemon["learnsets"]> {
  const membership = new Map<number, RelatedPokemon["learnsets"]>();
  const seenByMove = new Map<number, Set<string>>();
  for (const row of rows) {
    let seen = seenByMove.get(row.moveId);
    if (!seen) {
      seen = new Set();
      seenByMove.set(row.moveId, seen);
      membership.set(row.moveId, []);
    }
    const key = `${row.versionGroupId}:${row.learnMethodId}:${row.level}`;
    if (seen.has(key)) continue;
    seen.add(key);
    membership.get(row.moveId)!.push({
      versionGroupId: row.versionGroupId,
      learnMethodId: row.learnMethodId,
      level: row.level,
    });
  }
  return membership;
}
