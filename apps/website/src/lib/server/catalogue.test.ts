import { describe, expect, it } from "vite-plus/test";
import type {
  PokemonForm,
  PokemonVariety,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { resolvePokemon } from "../../../../../packages/pokemon-data/src/resolve.ts";
import { fixture } from "../../../../../packages/pokemon-data/tests/fixtures.ts";
import { filterTypeMembers } from "../data/type-membership.ts";
import {
  projectCatalogueSpecies,
  projectRelatedIdentity,
  projectTypeMembers,
} from "./catalogue.ts";

function form(overrides: Partial<PokemonForm> = {}): PokemonForm {
  return {
    id: 125,
    identifier: "sample-mouse",
    formIdentifier: "",
    names: [],
    formNames: [],
    versionGroupId: 28,
    isDefault: true,
    isBattleOnly: false,
    isMega: false,
    order: 1,
    formOrder: 1,
    ...overrides,
  };
}

function variety(overrides: Partial<PokemonVariety> = {}): PokemonVariety {
  return {
    id: 125,
    identifier: "sample-mouse",
    isDefault: true,
    height: 1,
    weight: 1,
    baseExperience: null,
    order: 1,
    types: [{ slot: 1, typeId: 18 }],
    typeHistory: [{ generationId: 5, types: [{ slot: 1, typeId: 1 }] }],
    stats: [],
    statHistory: [],
    abilities: [],
    abilityHistory: [],
    forms: [form()],
    learnsets: [],
    encounters: [],
    media: { sprites: null, artwork: null },
    cries: { latest: null, legacy: null },
    sourceCounts: {
      types: 1,
      typeHistory: 1,
      stats: 0,
      statHistory: 0,
      abilities: 0,
      abilityHistory: 0,
      forms: 1,
      learnsets: 0,
      encounters: 0,
    },
    ...overrides,
  };
}

function species(varieties: PokemonVariety[] = [variety()]): SpeciesRecord {
  return {
    id: 25,
    identifier: "sample-mouse",
    generationId: 2,
    evolvesFromSpeciesId: null,
    evolutionChainId: null,
    names: [
      { languageId: 9, name: "Sample Mouse" },
      { languageId: 5, name: "Souris Exemple" },
      { languageId: 11, name: "サンプル" },
    ],
    genera: [],
    flavorTexts: [],
    genderRate: -1,
    captureRate: 0,
    baseHappiness: null,
    isBaby: false,
    isLegendary: false,
    isMythical: false,
    eggGroupIds: [],
    pokedexNumbers: [],
    sourceFacts: {},
    varieties,
    evolutions: [],
    sourceCounts: {
      names: 3,
      genera: 0,
      flavorTexts: 0,
      varieties: varieties.length,
      evolutions: 0,
      eggGroupIds: 0,
      pokedexNumbers: 0,
    },
  };
}

describe("projectCatalogueSpecies", () => {
  it("uses species identity/generation and current default-variety types, not historical or alternative types", () => {
    const record = species([
      variety({ id: 10025, isDefault: false, types: [{ slot: 1, typeId: 10 }] }),
      variety({
        types: [
          { slot: 1, typeId: 18 },
          { slot: 2, typeId: 3 },
        ],
      }),
    ]);
    const projected = projectCatalogueSpecies(record);
    expect(projected.en).toEqual({
      id: 25,
      name: "Sample Mouse",
      generationId: 2,
      typeIds: [18, 3],
      stats: null,
      abilityIds: [],
      hiddenAbilityIds: [],
      classification: "ordinary",
      dexNumbers: [],
    });
    expect(projected.fr.name).toBe("Souris Exemple");
    expect(projected.ja.name).toBe("サンプル");
  });

  it("projects current default-variety stats, abilities and classification, not history", () => {
    const current = [35, 55, 40, 50, 50, 90].map((baseStat, index) => ({
      statId: index + 1,
      baseStat,
      effort: 0,
    }));
    const record = {
      ...species([
        variety({
          id: 10025,
          isDefault: false,
          abilities: [{ slot: 1, abilityId: 99, isHidden: false }],
        }),
        variety({
          // Source order is not slot order; history must never leak into current values.
          stats: current.toReversed(),
          statHistory: [{ statId: 1, baseStat: 1, effort: 0, generationId: 5 }],
          abilities: [
            { slot: 3, abilityId: 31, isHidden: true },
            { slot: 2, abilityId: null, isHidden: false },
            { slot: 1, abilityId: 9, isHidden: false },
          ],
          abilityHistory: [{ slot: 1, abilityId: 77, isHidden: false, generationId: 5 }],
        }),
      ]),
      isLegendary: true,
    };
    expect(projectCatalogueSpecies(record).en).toMatchObject({
      stats: [35, 55, 40, 50, 50, 90, 320],
      abilityIds: [9],
      hiddenAbilityIds: [31],
      classification: "legendary",
    });
    const baby = projectCatalogueSpecies({ ...record, isLegendary: false, isBaby: true });
    expect(baby.en.classification).toBe("baby");
  });

  it("keeps stats unknown when any of the six is missing instead of inventing zero", () => {
    const stats = [1, 2, 3, 4, 5].map((statId) => ({ statId, baseStat: 50, effort: 0 }));
    expect(projectCatalogueSpecies(species([variety({ stats })])).en.stats).toBeNull();
  });

  it("does not silently substitute an alternative for a missing default variety", () => {
    expect(() => projectCatalogueSpecies(species([variety({ isDefault: false })]))).toThrow(
      "Species 25 has no default variety",
    );
  });

  it("projects compact regional and DLC numbers including zero without introduction filtering", () => {
    const record = species();
    record.pokedexNumbers = [
      { pokedexId: 1, number: 25 },
      { pokedexId: 31, number: 74 },
      { pokedexId: 32, number: 0 },
      { pokedexId: 33, number: 21 },
    ];
    const projected = projectCatalogueSpecies(record);
    expect(projected.en.dexNumbers).toEqual([
      [1, 25],
      [31, 74],
      [32, 0],
      [33, 21],
    ]);
    expect(projected.fr.dexNumbers).toEqual(projected.en.dexNumbers);
    expect(projected.ja.dexNumbers).toEqual(projected.en.dexNumbers);
    expect(record.pokedexNumbers[2]).toEqual({ pokedexId: 32, number: 0 });
  });
});

describe("projectRelatedIdentity", () => {
  it("chooses the default form, not array order, without duplicating cosmetic forms", () => {
    const selected = variety({
      forms: [
        form({
          id: 901,
          identifier: "sample-mouse-festive",
          isDefault: false,
          versionGroupId: 20,
          names: [{ languageId: 9, name: "Festive Mouse" }],
        }),
        form({ versionGroupId: 28 }),
      ],
    });
    const projected = projectRelatedIdentity(species([selected]), selected);
    expect(projected.speciesId).toBe(25);
    expect(projected.pokemonId).toBe(125);
    expect(projected.form).toBeNull();
    expect(projected.introducedVersionGroupId).toBe(28);
    expect(projected.generationId).toBe(2);
    expect(projected.names.en.text).toBe("Sample Mouse");
    expect(projected.names.fr.text).toBe("Souris Exemple");
    expect(projected.names.ja.text).toBe("サンプル");
  });

  it("retains an alternative's resolvable form identity, source introduction and localized name fallback", () => {
    const selected = variety({
      id: 10025,
      identifier: "sample-mouse-storm",
      isDefault: false,
      forms: [
        form({
          id: 100025,
          identifier: "sample-mouse-storm-form",
          formIdentifier: "storm",
          versionGroupId: 25,
          names: [
            { languageId: 9, name: "Storm Mouse" },
            { languageId: 11, name: "あらしサンプル" },
          ],
        }),
      ],
    });
    const projected = projectRelatedIdentity(species([variety(), selected]), selected);
    expect(projected.speciesId).toBe(25);
    expect(projected.pokemonId).toBe(10025);
    expect(projected.form).toBe("sample-mouse-storm-form");
    expect(projected.introducedVersionGroupId).toBe(25);
    expect(projected.names.fr).toEqual({
      text: "Storm Mouse",
      requestedLanguage: "fr",
      sourceLanguageId: 9,
      fallback: true,
    });
    expect(projected.names.ja.text).toBe("あらしサンプル");
  });

  it("uses a sole non-default form and composes sparse form labels like detail resolution", () => {
    const selected = variety({
      id: 10025,
      identifier: "sample-mouse-tidal",
      isDefault: false,
      forms: [
        form({
          identifier: "sample-mouse-tidal-form",
          formIdentifier: "tidal",
          isDefault: false,
          versionGroupId: 18,
          formNames: [
            { languageId: 9, name: "Tidal" },
            { languageId: 5, name: "Marée" },
          ],
        }),
      ],
    });
    const projected = projectRelatedIdentity(species([selected]), selected);
    expect(projected.form).toBe("sample-mouse-tidal-form");
    expect(projected.introducedVersionGroupId).toBe(18);
    expect(projected.names.en.text).toBe("Sample Mouse (Tidal)");
    expect(projected.names.fr.text).toBe("Souris Exemple (Marée)");
  });

  it("preserves unknown introduction rather than choosing an arbitrary cosmetic form", () => {
    const selected = variety({
      id: 10025,
      identifier: "sample-mouse-unknown",
      isDefault: false,
      forms: [
        form({ identifier: "cosmetic-one", isDefault: false, versionGroupId: 20 }),
        form({ identifier: "cosmetic-two", isDefault: false, versionGroupId: 25 }),
      ],
    });
    const projected = projectRelatedIdentity(species([selected]), selected);
    expect(projected.form).toBe("sample-mouse-unknown");
    expect(projected.introducedVersionGroupId).toBeNull();
    expect(projected.names.en).toEqual({
      text: "Sample Mouse (sample-mouse-unknown)",
      requestedLanguage: "en",
      sourceLanguageId: null,
      fallback: true,
    });
  });

  it("does not invent introduction metadata when the source has no forms", () => {
    const selected = variety({
      id: 10025,
      identifier: "sample-mouse-unlisted",
      isDefault: false,
      forms: [],
    });
    const projected = projectRelatedIdentity(species([selected]), selected);
    expect(projected.form).toBe("sample-mouse-unlisted");
    expect(projected.introducedVersionGroupId).toBeNull();
  });
});

describe("projectTypeMembers", () => {
  it("links grouped varieties to the earliest known cosmetic form with matching detail chronology", () => {
    const selected = variety({
      forms: [
        form({ identifier: "sample-mouse-later", isDefault: false, versionGroupId: 17 }),
        form({ identifier: "sample-mouse-unknown", isDefault: false, versionGroupId: null }),
        form({
          identifier: "sample-mouse-first",
          isDefault: false,
          versionGroupId: 15,
          names: [{ languageId: 9, name: "Early Mouse" }],
        }),
        form({ identifier: "sample-mouse-unmapped", isDefault: false, versionGroupId: 99 }),
      ],
    });
    const record = species([selected]);
    const { references } = fixture();
    const projected = projectTypeMembers(
      record,
      new Map(references.versionGroups.map((group) => [group.id, group.order])),
    ).en;
    expect(filterTypeMembers(projected, [18], { generationId: 6, order: 14 }).rows).toEqual([]);
    const result = filterTypeMembers(projected, [18], { generationId: 6, order: 15 });
    expect(result.missingIntroduction).toBe(0);
    expect(result.rows.map((row) => row.pokemonId)).toEqual([125]);
    const member = result.rows[0]!;
    expect(member.name.text).toBe("Early Mouse");
    const detail = resolvePokemon(record, references, {
      language: "en",
      version: "x",
      form: member.form ?? undefined,
    });
    expect(detail.status).toBe("available");
    expect(detail.name.text).toBe(member.name.text);
  });

  it("reports unknown chronology when no cosmetic form has a known introduction", () => {
    const selected = variety({
      forms: [
        form({ identifier: "sample-mouse-first", isDefault: false, versionGroupId: 99 }),
        form({ identifier: "sample-mouse-second", isDefault: false, versionGroupId: null }),
      ],
    });
    const projected = projectTypeMembers(species([selected]), new Map([[28, 10]])).en;
    expect(filterTypeMembers(projected, [18], { generationId: 6, order: 20 })).toMatchObject({
      missingIntroduction: 1,
      rows: [],
    });
  });
});
