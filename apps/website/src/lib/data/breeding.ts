import type {
  Language,
  LocalizedText,
  VersionGroup,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { introductionStatus } from "../../../../../packages/pokemon-data/src/resolve.ts";

/** Current source species facts; group membership and sex ratios have no historical bounds. */
export interface BreedingMember {
  speciesId: number;
  pokemonId: number;
  form: string | null;
  names: Record<Language, LocalizedText>;
  generationId: number;
  introductionOrder: number | null;
  genderRate: number;
  eggGroupIds: number[];
  isBaby: boolean;
}
export interface MoveSource {
  pokemonId: number;
  /** At least one non-egg method in this exact group; otherwise inheritance/chain only. */
  direct: boolean;
}
export interface BreedingProjection {
  speciesId: number;
  members: BreedingMember[];
  /** Only moves recorded as egg moves for a variety of the requested species. */
  moves: {
    versionGroupId: number;
    moveId: number;
    recipientPokemonIds: number[];
    sources: MoveSource[];
  }[];
}

// PokéAPI's stable source egg-group IDs (Ditto and Undiscovered).
export const DITTO_GROUP = 13;
export const NO_EGGS_GROUP = 15;
export function breedingMechanic(
  group: Pick<VersionGroup, "identifier" | "generationId">,
): "none" | "breeding" | "mirror-herb" {
  if (
    group.generationId === 1 ||
    group.identifier.startsWith("lets-go") ||
    group.identifier.startsWith("legends-")
  )
    return "none";
  return group.identifier === "scarlet-violet" ? "mirror-herb" : "breeding";
}
export function hasMale(rate: number): boolean {
  return rate >= 0 && rate < 8;
}
export function hasFemale(rate: number): boolean {
  return rate > 0 && rate <= 8;
}
export function ordinaryBreeder(
  member: Pick<BreedingMember, "genderRate" | "eggGroupIds" | "isBaby">,
): boolean {
  return (
    !member.isBaby &&
    member.genderRate >= 0 &&
    member.genderRate <= 8 &&
    member.eggGroupIds.length > 0 &&
    !member.eggGroupIds.includes(NO_EGGS_GROUP) &&
    !member.eggGroupIds.includes(DITTO_GROUP)
  );
}

/** A candidate for a recipient-species egg, not a proof of form/combination legality. */
export function compatibleParent(
  target: BreedingMember,
  donor: BreedingMember,
  generationId: number,
): boolean {
  if (!ordinaryBreeder(target) || !ordinaryBreeder(donor)) return false;
  if (!target.eggGroupIds.some((id) => donor.eggGroupIds.includes(id))) return false;
  // Different-species female donors produce their own species, not the recipient.
  return (
    (hasFemale(target.genderRate) && hasMale(donor.genderRate)) ||
    (generationId >= 6 &&
      target.speciesId === donor.speciesId &&
      hasMale(target.genderRate) &&
      hasFemale(donor.genderRate))
  );
}

export function parentCandidates(
  projection: BreedingProjection,
  target: BreedingMember,
  moveId: number,
  game: Pick<VersionGroup, "id" | "identifier" | "generationId" | "order">,
) {
  const result = {
    direct: [] as BreedingMember[],
    chain: [] as BreedingMember[],
    transfer: [] as BreedingMember[],
    transferChain: [] as BreedingMember[],
    missingChronology: 0,
  };
  const mechanic = breedingMechanic(game);
  if (mechanic === "none") return result;
  if (introductionStatus(target.generationId, target.introductionOrder, game) !== "available")
    return result;
  const sources =
    projection.moves.find(
      (row) =>
        row.versionGroupId === game.id &&
        row.moveId === moveId &&
        row.recipientPokemonIds.includes(target.pokemonId),
    )?.sources ?? [];
  const members = new Map(projection.members.map((member) => [member.pokemonId, member]));
  for (const source of sources) {
    const donor = members.get(source.pokemonId);
    if (!donor) continue;
    const parent = compatibleParent(target, donor, game.generationId);
    if (!parent && mechanic !== "mirror-herb") continue;
    const chronology = introductionStatus(donor.generationId, donor.introductionOrder, game);
    if (chronology === "not-introduced") continue;
    if (chronology === "unknown") {
      result.missingChronology++;
      continue;
    }
    if (parent) (source.direct ? result.direct : result.chain).push(donor);
    // Mirror Herb ignores sex, species and egg groups. An egg-only donor still
    // needs an unresolved acquisition chain before it can know the move.
    if (mechanic === "mirror-herb")
      (source.direct ? result.transfer : result.transferChain).push(donor);
  }
  return result;
}

export function genderPercent(rate: number): { male: number; female: number } | null {
  return Number.isInteger(rate) && rate >= 0 && rate <= 8
    ? { male: (8 - rate) * 12.5, female: rate * 12.5 }
    : null;
}
