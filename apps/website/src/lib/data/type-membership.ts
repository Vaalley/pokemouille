import type {
  LocalizedText,
  PokemonVariety,
} from "../../../../../packages/pokemon-data/src/index.ts";
import {
  introductionStatus,
  pokemonTypesAtGeneration,
} from "../../../../../packages/pokemon-data/src/resolve.ts";

/** One resolvable variety selection; cosmetic forms do not change its typing. */
export interface TypeMember {
  speciesId: number;
  pokemonId: number;
  form: string | null;
  name: LocalizedText;
  generationId: number;
  introductionOrder: number | null;
  types: PokemonVariety["types"];
  typeHistory: PokemonVariety["typeHistory"];
}

export function compareTypeMembers(a: TypeMember, b: TypeMember): number {
  return (
    a.speciesId - b.speciesId ||
    a.pokemonId - b.pokemonId ||
    (a.form ?? "").localeCompare(b.form ?? "", "en")
  );
}

/** A single type contains mono/dual types; two types require the exact unordered pair. */
export function matchesTypes(typeIds: readonly number[], selected: readonly number[]): boolean {
  if (selected.length < 1 || selected.length > 2 || new Set(selected).size !== selected.length)
    return false;
  return (
    selected.every((id) => typeIds.includes(id)) &&
    (selected.length === 1 || new Set(typeIds).size === 2)
  );
}

export function filterTypeMembers(
  members: readonly TypeMember[],
  selected: readonly number[],
  game: { generationId: number; order: number },
): { rows: TypeMember[]; missingIntroduction: number; missingTypes: number } {
  const rows: TypeMember[] = [];
  let missingIntroduction = 0;
  let missingTypes = 0;
  for (const member of members) {
    const status = introductionStatus(member.generationId, member.introductionOrder, game);
    if (status === "not-introduced") continue;
    const types = pokemonTypesAtGeneration(member, game.generationId);
    if (!types.length) {
      missingTypes += 1;
      continue;
    }
    if (
      !matchesTypes(
        types.map((row) => row.typeId),
        selected,
      )
    )
      continue;
    if (status === "unknown") missingIntroduction += 1;
    else rows.push(member);
  }
  return { rows: rows.sort(compareTypeMembers), missingIntroduction, missingTypes };
}
