/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
export type CensusBeforeQueryVariables = Exact<{ [key: string]: never }>;

export type CensusBeforeQuery = {
  machines: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveAttributes: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveStatChanges: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveMeta: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounters: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterLocations: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterAreas: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterSlots: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterMethods: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditionKinds: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterConditionValues: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterLocationNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterAreaNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterMethodNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditionNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterConditionValueNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  species: { aggregate: { count: number; max: { id: number | null } | null } | null };
  pokemon: { aggregate: { count: number; max: { id: number | null } | null } | null };
  forms: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnsets: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  names: { aggregate: { count: number; max: { id: number | null } | null } | null };
  flavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  types: { aggregate: { count: number; max: { id: number | null } | null } | null };
  typeHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  stats: { aggregate: { count: number; max: { id: number | null } | null } | null };
  statHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilities: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  sprites: { aggregate: { count: number; max: { id: number | null } | null } | null };
  formNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  generations: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versionGroups: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceTypes: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceStats: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceAbilities: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moves: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnMethods: { aggregate: { count: number; max: { id: number | null } | null } | null };
  items: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutionTriggers: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffectChanges: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffectChangeTexts: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  moveFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveEffectTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  typeNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  statNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnMethodNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutionTriggerNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versionNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
};

export type CensusAfterQueryVariables = Exact<{ [key: string]: never }>;

export type CensusAfterQuery = {
  machines: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveAttributes: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveStatChanges: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveMeta: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounters: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterLocations: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterAreas: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterSlots: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterMethods: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditionKinds: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterConditionValues: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterLocationNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterAreaNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterMethodNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditionNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterConditionValueNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  species: { aggregate: { count: number; max: { id: number | null } | null } | null };
  pokemon: { aggregate: { count: number; max: { id: number | null } | null } | null };
  forms: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnsets: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  names: { aggregate: { count: number; max: { id: number | null } | null } | null };
  flavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  types: { aggregate: { count: number; max: { id: number | null } | null } | null };
  typeHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  stats: { aggregate: { count: number; max: { id: number | null } | null } | null };
  statHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilities: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  sprites: { aggregate: { count: number; max: { id: number | null } | null } | null };
  formNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  generations: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versionGroups: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceTypes: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceStats: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceAbilities: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moves: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnMethods: { aggregate: { count: number; max: { id: number | null } | null } | null };
  items: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutionTriggers: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffectChanges: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffectChangeTexts: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  moveFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveEffectTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  typeNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  statNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnMethodNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutionTriggerNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versionNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
};

export type SourceCensusFragment = {
  machines: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveAttributes: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveStatChanges: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveMeta: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounters: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterLocations: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterAreas: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterSlots: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterMethods: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditionKinds: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterConditionValues: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterLocationNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterAreaNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterMethodNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  encounterConditionNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  encounterConditionValueNames: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  species: { aggregate: { count: number; max: { id: number | null } | null } | null };
  pokemon: { aggregate: { count: number; max: { id: number | null } | null } | null };
  forms: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnsets: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  names: { aggregate: { count: number; max: { id: number | null } | null } | null };
  flavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  types: { aggregate: { count: number; max: { id: number | null } | null } | null };
  typeHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  stats: { aggregate: { count: number; max: { id: number | null } | null } | null };
  statHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilities: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityHistory: { aggregate: { count: number; max: { id: number | null } | null } | null };
  sprites: { aggregate: { count: number; max: { id: number | null } | null } | null };
  formNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  generations: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versionGroups: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versions: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceTypes: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceStats: { aggregate: { count: number; max: { id: number | null } | null } | null };
  referenceAbilities: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moves: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnMethods: { aggregate: { count: number; max: { id: number | null } | null } | null };
  items: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutionTriggers: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffectChanges: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityEffectChangeTexts: {
    aggregate: { count: number; max: { id: number | null } | null } | null;
  };
  moveFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveEffectTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemFlavorTexts: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemEffects: { aggregate: { count: number; max: { id: number | null } | null } | null };
  typeNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  statNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  abilityNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  moveNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  learnMethodNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  itemNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  evolutionTriggerNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
  versionNames: { aggregate: { count: number; max: { id: number | null } | null } | null };
};

export type EncounterReferencesQueryVariables = Exact<{ [key: string]: never }>;

export type EncounterReferencesQuery = {
  locations: Array<{
    id: number;
    identifier: string;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  locationsCount: { aggregate: { count: number } | null };
  areas: Array<{
    id: number;
    identifier: string;
    locationId: number | null;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  areasCount: { aggregate: { count: number } | null };
  slots: Array<{
    id: number;
    slot: number | null;
    rarity: number;
    versionGroupId: number | null;
    methodId: number | null;
  }>;
  slotsCount: { aggregate: { count: number } | null };
  methods: Array<{
    id: number;
    identifier: string;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  methodsCount: { aggregate: { count: number } | null };
  conditions: Array<{
    id: number;
    identifier: string;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  conditionsCount: { aggregate: { count: number } | null };
  conditionValues: Array<{
    id: number;
    identifier: string;
    conditionId: number | null;
    isDefault: boolean;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  conditionValuesCount: { aggregate: { count: number } | null };
};

export type ReferencesQueryVariables = Exact<{ [key: string]: never }>;

export type ReferencesQuery = {
  generations: Array<{ id: number; identifier: string }>;
  generationsCount: { aggregate: { count: number } | null };
  versionGroups: Array<{
    id: number;
    order: number | null;
    identifier: string;
    generationId: number | null;
    learnsetsCount: { aggregate: { count: number } | null };
    versions: Array<{
      id: number;
      identifier: string;
      versionGroupId: number | null;
      encountersCount: { aggregate: { count: number } | null };
      names: Array<{ name: string; languageId: number | null }>;
      namesCount: { aggregate: { count: number } | null };
      flavorTextsCount: { aggregate: { count: number } | null };
    }>;
    versionsCount: { aggregate: { count: number } | null };
  }>;
  versionGroupsCount: { aggregate: { count: number } | null };
  versionsCount: { aggregate: { count: number } | null };
  types: Array<{
    id: number;
    identifier: string;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  typesCount: { aggregate: { count: number } | null };
  stats: Array<{
    id: number;
    identifier: string;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  statsCount: { aggregate: { count: number } | null };
  abilities: Array<{
    id: number;
    identifier: string;
    generationId: number | null;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
    flavorTexts: Array<{ languageId: number | null; versionGroupId: number | null; text: string }>;
    flavorTextsCount: { aggregate: { count: number } | null };
    effects: Array<{ effect: string; languageId: number | null; shortEffect: string }>;
    effectsCount: { aggregate: { count: number } | null };
    effectChanges: Array<{
      versionGroupId: number | null;
      effects: Array<{ effect: string; languageId: number | null }>;
      effectsCount: { aggregate: { count: number } | null };
    }>;
    effectChangesCount: { aggregate: { count: number } | null };
  }>;
  abilitiesCount: { aggregate: { count: number } | null };
  moves: Array<{
    id: number;
    power: number | null;
    accuracy: number | null;
    pp: number | null;
    priority: number | null;
    identifier: string;
    generationId: number | null;
    typeId: number | null;
    damageClassId: number | null;
    effectChance: number | null;
    effectId: number | null;
    target: {
      id: number;
      identifier: string;
      names: Array<{ name: string; languageId: number | null }>;
      namesCount: { aggregate: { count: number } | null };
    } | null;
    attributes: Array<{
      id: number;
      attribute: {
        id: number;
        identifier: string;
        names: Array<{ name: string; languageId: number | null }>;
        namesCount: { aggregate: { count: number } | null };
      } | null;
    }>;
    attributesCount: { aggregate: { count: number } | null };
    statChanges: Array<{ id: number; change: number; statId: number | null }>;
    statChangesCount: { aggregate: { count: number } | null };
    meta: Array<{
      id: number;
      drain: number | null;
      healing: number | null;
      minHits: number | null;
      maxHits: number | null;
      minTurns: number | null;
      maxTurns: number | null;
      critRate: number | null;
      ailmentChance: number | null;
      flinchChance: number | null;
      statChance: number | null;
      ailment: {
        id: number;
        identifier: string;
        names: Array<{ name: string; languageId: number | null }>;
        namesCount: { aggregate: { count: number } | null };
      } | null;
      category: {
        id: number;
        identifier: string;
        descriptions: Array<{ description: string; languageId: number | null }>;
        descriptionsCount: { aggregate: { count: number } | null };
      } | null;
    }>;
    metaCount: { aggregate: { count: number } | null };
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
    flavorTexts: Array<{ languageId: number | null; versionGroupId: number | null; text: string }>;
    flavorTextsCount: { aggregate: { count: number } | null };
  }>;
  movesCount: { aggregate: { count: number } | null };
  moveEffects: Array<{
    id: number;
    effects: Array<{ effect: string; languageId: number | null; shortEffect: string }>;
    effectsCount: { aggregate: { count: number } | null };
  }>;
  moveEffectsCount: { aggregate: { count: number } | null };
  machines: Array<{
    id: number;
    versionGroupId: number | null;
    number: number;
    itemId: number | null;
    moveId: number | null;
  }>;
  machinesCount: { aggregate: { count: number } | null };
  learnMethods: Array<{
    id: number;
    identifier: string;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  learnMethodsCount: { aggregate: { count: number } | null };
  items: Array<{
    id: number;
    identifier: string;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
    flavorTexts: Array<{ languageId: number | null; versionGroupId: number | null; text: string }>;
    flavorTextsCount: { aggregate: { count: number } | null };
    effects: Array<{ effect: string; languageId: number | null; shortEffect: string }>;
    effectsCount: { aggregate: { count: number } | null };
  }>;
  itemsCount: { aggregate: { count: number } | null };
  evolutionTriggers: Array<{
    id: number;
    identifier: string;
    names: Array<{ name: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
  }>;
  evolutionTriggersCount: { aggregate: { count: number } | null };
};

export type SpeciesPageQueryVariables = Exact<{
  after: number;
  limit: number;
}>;

export type SpeciesPageQuery = {
  species: Array<{
    id: number;
    hatch_counter: number | null;
    growth_rate_id: number | null;
    pokemon_color_id: number | null;
    pokemon_shape_id: number | null;
    pokemon_habitat_id: number | null;
    order: number | null;
    forms_switchable: boolean;
    has_gender_differences: boolean;
    identifier: string;
    generationId: number | null;
    evolvesFromSpeciesId: number | null;
    evolutionChainId: number | null;
    genderRate: number | null;
    captureRate: number | null;
    baseHappiness: number | null;
    isBaby: boolean;
    isLegendary: boolean;
    isMythical: boolean;
    names: Array<{ name: string; genus: string; languageId: number | null }>;
    namesCount: { aggregate: { count: number } | null };
    flavorTexts: Array<{ languageId: number | null; versionId: number | null; text: string }>;
    flavorTextsCount: { aggregate: { count: number } | null };
    evolutions: Array<{
      id: number;
      condition_expression: string;
      evolution_item_id: number | null;
      evolved_pokemon_form_id: number | null;
      gender_id: number | null;
      held_item_id: number | null;
      known_move_id: number | null;
      known_move_type_id: number | null;
      location_id: number | null;
      min_affection: number | null;
      min_beauty: number | null;
      min_damage_taken: number | null;
      min_happiness: number | null;
      min_level: number | null;
      min_move_count: number | null;
      min_steps: number | null;
      nature_bitmask: number | null;
      near_special_rock: boolean;
      needs_multiplayer: boolean;
      needs_overworld_rain: boolean;
      party_species_id: number | null;
      party_type_id: number | null;
      percentage_chance: number | null;
      region_id: number | null;
      relative_physical_stats: number | null;
      required_pokemon_form_id: number | null;
      time_of_day: string;
      trade_species_id: number | null;
      turn_upside_down: boolean;
      used_move_id: number | null;
      evolvedSpeciesId: number | null;
      versionGroupId: number | null;
      isDefault: boolean;
      triggerId: number | null;
    }>;
    evolutionsCount: { aggregate: { count: number } | null };
    varieties: Array<{
      id: number;
      height: number | null;
      weight: number | null;
      order: number | null;
      identifier: string;
      isDefault: boolean;
      baseExperience: number | null;
      speciesId: number | null;
      types: Array<{ slot: number; typeId: number | null }>;
      typesCount: { aggregate: { count: number } | null };
      typeHistory: Array<{ slot: number; generationId: number | null; typeId: number | null }>;
      typeHistoryCount: { aggregate: { count: number } | null };
      stats: Array<{ effort: number; statId: number | null; baseStat: number }>;
      statsCount: { aggregate: { count: number } | null };
      statHistory: Array<{
        effort: number;
        generationId: number | null;
        statId: number | null;
        baseStat: number;
      }>;
      statHistoryCount: { aggregate: { count: number } | null };
      abilities: Array<{ slot: number; abilityId: number | null; isHidden: boolean }>;
      abilitiesCount: { aggregate: { count: number } | null };
      abilityHistory: Array<{
        slot: number;
        generationId: number | null;
        abilityId: number | null;
        isHidden: boolean;
      }>;
      abilityHistoryCount: { aggregate: { count: number } | null };
      forms: Array<{
        id: number;
        order: number | null;
        pokemonId: number | null;
        identifier: string;
        formIdentifier: string;
        versionGroupId: number | null;
        isDefault: boolean;
        isBattleOnly: boolean;
        isMega: boolean;
        formOrder: number | null;
        names: Array<{ name: string; languageId: number | null; pokemonName: string }>;
        namesCount: { aggregate: { count: number } | null };
      }>;
      formsCount: { aggregate: { count: number } | null };
      learnsets: Array<{
        id: number;
        level: number;
        mastery: number | null;
        order: number | null;
        moveId: number | null;
        versionGroupId: number | null;
        learnMethodId: number | null;
      }>;
      learnsetsCount: { aggregate: { count: number } | null };
      encounters: Array<{
        id: number;
        versionId: number | null;
        minLevel: number;
        maxLevel: number;
        areaId: number | null;
        slotId: number | null;
        conditions: Array<{ id: number; encounterId: number | null; valueId: number | null }>;
        conditionsCount: { aggregate: { count: number } | null };
      }>;
      encountersCount: { aggregate: { count: number } | null };
      sprites: Array<{ sprites: unknown }>;
      spritesCount: { aggregate: { count: number } | null };
    }>;
    varietiesCount: { aggregate: { count: number } | null };
  }>;
};
