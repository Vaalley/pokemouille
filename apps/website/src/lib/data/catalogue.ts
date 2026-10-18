import type {
  AbilitySlot,
  LearnsetRow,
  LocalizedText,
} from "../../../../../packages/pokemon-data/src/index.ts";

/** HP, Attack, Defense, Sp. Atk, Sp. Def, Speed, then their sum. */
export type CatalogueStats = [
  hp: number,
  attack: number,
  defense: number,
  specialAttack: number,
  specialDefense: number,
  speed: number,
  total: number,
];

export const SPECIES_CLASSES = ["legendary", "mythical", "baby", "ordinary"] as const;
export type SpeciesClass = (typeof SPECIES_CLASSES)[number];

/**
 * Compact National Pokédex row. Types, stats and abilities are the default
 * variety's current values, never those of a selected or historical game.
 */
export interface CatalogueSpecies {
  id: number;
  name: string;
  generationId: number;
  typeIds: number[];
  /** Null when the source lacks any of the six base stats. */
  stats: CatalogueStats | null;
  abilityIds: number[];
  hiddenAbilityIds: number[];
  classification: SpeciesClass;
  /** Exact source membership: [Pokédex ID, number], including number zero. */
  dexNumbers: [pokedexId: number, dexNumber: number][];
}

export interface Catalogue {
  species: CatalogueSpecies[];
  types: { id: number; name: LocalizedText }[];
  generations: number[];
  /** Only abilities some species currently has, in localized name order. */
  abilities: { id: number; name: LocalizedText }[];
  /** Source names of the six base stats, in `CatalogueStats` order. */
  statNames: LocalizedText[];
  pokedexes: { id: number; name: LocalizedText; versionGroupIds: number[] }[];
  /** Version identifiers map to exact groups, never introduction or encounter proxies. */
  versions: [identifier: string, versionGroupId: number][];
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
