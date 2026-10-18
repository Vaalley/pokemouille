import { describe, expect, it } from "vite-plus/test";
import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
import type { RelatedPokemon, RelatedPokemonData } from "./catalogue.ts";
import { machinesForGroup, projectMachines } from "./machines.ts";

const name: LocalizedText = {
  text: "Source disc",
  requestedLanguage: "en",
  sourceLanguageId: 9,
  fallback: false,
};
const refs = {
  machines: [
    { id: 1, itemId: 10, moveId: 20, versionGroupId: 5, number: 1 },
    { id: 2, itemId: 10, moveId: 21, versionGroupId: 6, number: 1 },
    { id: 3, itemId: 11, moveId: 20, versionGroupId: 6, number: 37 },
  ],
  items: [
    { id: 10, identifier: "source-disc", names: [{ languageId: 9, name: "Source disc" }] },
    { id: 11, identifier: "other-disc", names: [{ languageId: 9, name: "Other disc" }] },
  ],
  moves: [
    { id: 20, identifier: "first-move", typeId: 1, names: [{ languageId: 9, name: "First move" }] },
    {
      id: 21,
      identifier: "second-move",
      typeId: 2,
      names: [{ languageId: 9, name: "Second move" }],
    },
  ],
  versionGroups: [
    { id: 28, generationId: 1, order: 1 },
    { id: 5, generationId: 2, order: 5 },
    { id: 6, generationId: 3, order: 6 },
  ],
  learnMethods: [
    { id: 17, identifier: "machine" },
    { id: 1, identifier: "level-up" },
  ],
};

function learner(pokemonId: number, learnsets: RelatedPokemon["learnsets"]): RelatedPokemon {
  return {
    speciesId: pokemonId,
    pokemonId,
    form: pokemonId === 3 ? "alternate" : null,
    name,
    generationId: 1,
    introducedVersionGroupId: 28,
    learnsets,
    abilityGenerations: [],
    hiddenAbilityGenerations: [],
  };
}

const related = new Map<number, RelatedPokemonData>([
  [
    20,
    {
      pokemon: [
        learner(1, [{ versionGroupId: 5, learnMethodId: 17, level: 0 }]),
        learner(2, [{ versionGroupId: 5, learnMethodId: 1, level: 20 }]),
        learner(3, [{ versionGroupId: 6, learnMethodId: 17, level: 0 }]),
        learner(4, [{ versionGroupId: 5, learnMethodId: 3, level: 0 }]),
      ],
      learnMethods: [],
    },
  ],
  [
    21,
    {
      pokemon: [learner(3, [{ versionGroupId: 6, learnMethodId: 17, level: 0 }])],
      learnMethods: [],
    },
  ],
]);

describe("machine navigation", () => {
  it("uses source item labels and only exact-group machine learners for the item's taught move", () => {
    const data = projectMachines(refs, "en", { kind: "item", id: 10 }, related);
    expect(machinesForGroup(data, 5)).toEqual([
      {
        id: 1,
        versionGroupId: 5,
        item: { id: 10, identifier: "source-disc", name },
        move: { id: 20, typeId: 1, name: { ...name, text: "First move" } },
        pokemonIds: [1],
        missingIntroduction: 0,
      },
    ]);
    expect(machinesForGroup(data, 6).map((row) => [row.move.id, row.pokemonIds])).toEqual([
      [21, [3]],
    ]);
    expect(machinesForGroup(data, 7)).toEqual([]);
    expect(data.pokemon).toEqual([
      { speciesId: 1, pokemonId: 1, form: null, name },
      { speciesId: 3, pokemonId: 3, form: "alternate", name },
    ]);
  });

  it("confirms only introduced exact-group machine learners and reports unknown chronology separately", () => {
    const exactMachine = [{ versionGroupId: 5, learnMethodId: 17, level: 0 }];
    const learners: RelatedPokemonData = {
      pokemon: [
        learner(1, exactMachine),
        { ...learner(2, exactMachine), introducedVersionGroupId: 6 },
        { ...learner(3, exactMachine), introducedVersionGroupId: null },
        learner(4, [{ versionGroupId: 5, learnMethodId: 1, level: 20 }]),
        { ...learner(5, exactMachine), generationId: 3 },
        {
          ...learner(6, [{ versionGroupId: 6, learnMethodId: 17, level: 0 }]),
          introducedVersionGroupId: null,
        },
      ],
      learnMethods: [],
    };
    const data = projectMachines(refs, "en", { kind: "item", id: 10 }, new Map([[20, learners]]));
    expect(
      machinesForGroup(data, 5).map((row) => ({
        pokemonIds: row.pokemonIds,
        missingIntroduction: row.missingIntroduction,
      })),
    ).toEqual([{ pokemonIds: [1], missingIntroduction: 1 }]);
    // A default variety's known introduction counts; an unknown form's does not.
    expect(data.pokemon).toEqual([{ speciesId: 1, pokemonId: 1, form: null, name }]);
  });

  it("treats unmapped introduction and mapping groups as source gaps, not confirmed learners", () => {
    const exactMachine = [{ versionGroupId: 5, learnMethodId: 17, level: 0 }];
    const unknownIntroduction = projectMachines(
      refs,
      "en",
      { kind: "item", id: 10 },
      new Map([
        [
          20,
          {
            pokemon: [{ ...learner(1, exactMachine), introducedVersionGroupId: 999 }],
            learnMethods: [],
          },
        ],
      ]),
    );
    expect(
      machinesForGroup(unknownIntroduction, 5).map((row) => ({
        pokemonIds: row.pokemonIds,
        missingIntroduction: row.missingIntroduction,
      })),
    ).toEqual([{ pokemonIds: [], missingIntroduction: 1 }]);
    expect(unknownIntroduction.pokemon).toEqual([]);

    const unknownGroup = projectMachines(
      { ...refs, versionGroups: refs.versionGroups.filter((group) => group.id !== 5) },
      "en",
      { kind: "item", id: 10 },
      related,
    );
    expect(
      machinesForGroup(unknownGroup, 5).map((row) => ({
        pokemonIds: row.pokemonIds,
        missingIntroduction: row.missingIntroduction,
      })),
    ).toEqual([{ pokemonIds: [], missingIntroduction: 1 }]);
    expect(machinesForGroup(unknownGroup, 6).map((row) => row.pokemonIds)).toEqual([[3]]);
  });

  it("links a move back to only the exact group's source items without duplicating its learners", () => {
    const data = projectMachines(refs, "en", { kind: "move", id: 20 }, related);
    expect(machinesForGroup(data, 5).map((row) => row.item.id)).toEqual([10]);
    expect(machinesForGroup(data, 6).map((row) => row.item.id)).toEqual([11]);
    expect(data.pokemon).toEqual([]);
    expect(data.mappings.map((row) => row.pokemonIds)).toEqual([[], []]);
  });

  it("does not infer mappings from an item name or learners without a source machine method", () => {
    expect(projectMachines(refs, "en", { kind: "item", id: 99 }, related)).toEqual({
      mappings: [],
      pokemon: [],
    });
    const missingMethod = projectMachines(
      { ...refs, learnMethods: [] },
      "en",
      { kind: "item", id: 10 },
      related,
    );
    expect(missingMethod.mappings.map((row) => row.pokemonIds)).toEqual([[], []]);
    expect(missingMethod.pokemon).toEqual([]);
    const missingMove = projectMachines(
      { ...refs, moves: [] },
      "en",
      { kind: "item", id: 10 },
      related,
    );
    expect(missingMove).toEqual({ mappings: [], pokemon: [] });
  });
});
