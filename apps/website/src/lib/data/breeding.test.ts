import { describe, expect, it } from "vite-plus/test";
import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
import {
  breedingMechanic,
  compatibleParent,
  genderPercent,
  parentCandidates,
  type BreedingMember,
  type BreedingProjection,
} from "./breeding.ts";

const name: LocalizedText = {
  text: "Recorded Pokémon",
  requestedLanguage: "en",
  sourceLanguageId: 9,
  fallback: false,
};
function member(overrides: Partial<BreedingMember> = {}): BreedingMember {
  return {
    speciesId: 1,
    pokemonId: 1,
    form: null,
    names: { en: name, fr: name, ja: name },
    generationId: 1,
    introductionOrder: 1,
    genderRate: 4,
    eggGroupIds: [1],
    isBaby: false,
    ...overrides,
  };
}
const oldGame = { id: 3, identifier: "gold-silver", generationId: 2, order: 3 };
const newGame = { id: 15, identifier: "x-y", generationId: 6, order: 15 };
const scarlet = { id: 25, identifier: "scarlet-violet", generationId: 9, order: 25 };
function projection(members: BreedingMember[], versionGroupId = oldGame.id): BreedingProjection {
  return {
    speciesId: 1,
    members,
    moves: [
      {
        versionGroupId,
        moveId: 10,
        recipientPokemonIds: [members[0]!.pokemonId],
        sources: members.slice(1).map((row) => ({ pokemonId: row.pokemonId, direct: true })),
      },
    ],
  };
}

describe("egg-move candidate boundaries", () => {
  it("requires a male compatible source and recipient female in generations II–V", () => {
    const target = member();
    expect(compatibleParent(target, member({ speciesId: 2, genderRate: 0 }), 2)).toBe(true);
    expect(compatibleParent(target, member({ speciesId: 2, genderRate: 8 }), 5)).toBe(false);
    expect(compatibleParent(member({ genderRate: 0 }), member(), 5)).toBe(false);
    expect(compatibleParent(target, member({ eggGroupIds: [2] }), 5)).toBe(false);
  });
  it("allows a same-species female source from VI, never a different-species female", () => {
    const male = member({ genderRate: 0 });
    const female = member({ pokemonId: 2, genderRate: 8 });
    expect(compatibleParent(male, female, 5)).toBe(false);
    expect(compatibleParent(male, female, 6)).toBe(true);
    expect(compatibleParent(male, { ...female, speciesId: 2 }, 6)).toBe(false);
    expect(compatibleParent(member({ genderRate: 8 }), female, 6)).toBe(false);
  });
  it("does not assert ordinary inheritance for No Eggs, genderless, Ditto or babies", () => {
    for (const target of [
      member({ eggGroupIds: [15] }),
      member({ eggGroupIds: [13] }),
      member({ genderRate: -1 }),
      member({ isBaby: true }),
      member({ eggGroupIds: [] }),
    ]) {
      expect(compatibleParent(target, member(), 9)).toBe(false);
      expect(compatibleParent(member(), target, 9)).toBe(false);
    }
  });
  it("uses the exact version group and move, never adjacent groups", () => {
    const target = member();
    const donor = member({ speciesId: 2, pokemonId: 2 });
    const data = projection([target, donor]);
    expect(parentCandidates(data, target, 10, oldGame).direct).toEqual([donor]);
    expect(parentCandidates(data, target, 11, oldGame).direct).toEqual([]);
    expect(parentCandidates(data, target, 10, newGame).direct).toEqual([]);
  });
  it("requires the recipient variety's own egg row, including for Mirror Herb", () => {
    const target = member();
    const donor = member({ speciesId: 2, pokemonId: 2 });
    const data = projection([target, donor], scarlet.id);
    data.moves[0]!.recipientPokemonIds = [99];
    const result = parentCandidates(data, target, 10, scarlet);
    expect(result.direct).toEqual([]);
    expect(result.transfer).toEqual([]);
  });
  it("keeps egg-only sources as unresolved chains instead of calling them direct parents", () => {
    const target = member();
    const donor = member({ speciesId: 2, pokemonId: 2 });
    const data = projection([target, donor]);
    data.moves[0]!.sources[0]!.direct = false;
    const result = parentCandidates(data, target, 10, oldGame);
    expect(result.direct).toEqual([]);
    expect(result.chain).toEqual([donor]);
  });
  it("excludes later introductions and counts unknown chronology as a source gap", () => {
    const target = member();
    const later = member({ speciesId: 2, pokemonId: 2, introductionOrder: 4 });
    const unknown = member({ speciesId: 3, pokemonId: 3, introductionOrder: null });
    const result = parentCandidates(projection([target, later, unknown]), target, 10, oldGame);
    expect(result.direct).toEqual([]);
    expect(result.missingChronology).toBe(1);
  });
  it("does not assert parents for a recipient whose chronology is unknown", () => {
    const target = member({ introductionOrder: null });
    expect(
      parentCandidates(projection([target, member({ pokemonId: 2 })]), target, 10, oldGame).direct,
    ).toEqual([]);
  });
  it("separates Mirror Herb donors without egg-group or gender compatibility", () => {
    const target = member({ eggGroupIds: [15], isBaby: true });
    const donor = member({ speciesId: 2, pokemonId: 2, genderRate: -1, eggGroupIds: [2] });
    const result = parentCandidates(projection([target, donor], scarlet.id), target, 10, scarlet);
    expect(result.direct).toEqual([]);
    expect(result.transfer).toEqual([donor]);
    expect(
      parentCandidates(projection([target, donor], newGame.id), target, 10, newGame).transfer,
    ).toEqual([]);
  });
  it("marks egg-only Mirror Herb donors as needing acquisition chains", () => {
    const target = member();
    const donor = member({ pokemonId: 2, eggGroupIds: [15] });
    const data = projection([target, donor], scarlet.id);
    data.moves[0]!.sources[0]!.direct = false;
    const result = parentCandidates(data, target, 10, scarlet);
    expect(result.transfer).toEqual([]);
    expect(result.transferChain).toEqual([donor]);
  });
  it("disables egg mechanics in Generation I, Let's Go and Legends", () => {
    for (const game of [
      { identifier: "red-blue", generationId: 1 },
      { identifier: "lets-go-pikachu-lets-go-eevee", generationId: 7 },
      { identifier: "legends-arceus", generationId: 8 },
      { identifier: "legends-za", generationId: 9 },
    ])
      expect(breedingMechanic(game)).toBe("none");
  });
  it("preserves genderless and male/female boundaries without invented ratios", () => {
    expect(genderPercent(-1)).toBeNull();
    expect(genderPercent(0)).toEqual({ male: 100, female: 0 });
    expect(genderPercent(8)).toEqual({ male: 0, female: 100 });
    expect(genderPercent(1)).toEqual({ male: 87.5, female: 12.5 });
    expect(genderPercent(9)).toBeNull();
  });
});
