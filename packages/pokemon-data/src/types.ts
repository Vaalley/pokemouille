// Normalized application DTOs, not generated GraphQL operation types.
export type Language = "en" | "fr" | "ja";
export interface Name {
  languageId: number;
  name: string;
}
export interface NamedResource {
  id: number;
  identifier: string;
  names: Name[];
}
export interface Generation {
  id: number;
  identifier: string;
}
export interface VersionGroup {
  id: number;
  identifier: string;
  generationId: number;
  order: number;
}
export interface Version {
  id: number;
  identifier: string;
  versionGroupId: number;
  names: Name[];
}
export interface FlavorText {
  languageId: number;
  versionId: number;
  text: string;
}
export interface Ability extends NamedResource {
  generationId: number;
  flavorTexts: { languageId: number; versionGroupId: number; text: string }[];
  effects: { languageId: number; effect: string; shortEffect: string }[];
  /** Records describe effects BEFORE the change at versionGroupId and may
   * cover only the changed aspect, not the complete previous mechanics.
   * Missing records or translations do not establish unchanged mechanics.
   */
  effectChanges: {
    versionGroupId: number;
    effects: { languageId: number; effect: string }[];
  }[];
}
export interface Item extends NamedResource {
  flavorTexts: { languageId: number; versionGroupId: number; text: string }[];
  effects: { languageId: number; effect: string; shortEffect: string }[];
}
export interface Machine {
  id: number;
  versionGroupId: number;
  number: number;
  itemId: number;
  moveId: number;
}
export interface MoveMeta {
  ailment: NamedResource | null;
  category: {
    id: number;
    identifier: string;
    descriptions: { languageId: number; description: string }[];
  } | null;
  minHits: number | null;
  maxHits: number | null;
  minTurns: number | null;
  maxTurns: number | null;
  /** Signed source percentage: positive drain, negative recoil. */
  drain: number | null;
  /** Signed percentage of the user's maximum HP: positive recovery, negative HP cost. */
  healing: number | null;
  critRate: number | null;
  ailmentChance: number | null;
  flinchChance: number | null;
  statChance: number | null;
}
export interface Move extends NamedResource {
  generationId: number;
  typeId: number;
  damageClassId: number;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  effectChance: number | null;
  /** Current source mechanics, not verified historical game rules. */
  target: NamedResource | null;
  attributes: NamedResource[];
  statChanges: { statId: number; change: number }[];
  meta: MoveMeta | null;
  sourceCounts: { attributes: number; statChanges: number; meta: number };
  flavorTexts: { languageId: number; versionGroupId: number; text: string }[];
  effects: { languageId: number; effect: string; shortEffect: string }[];
}
export interface Coverage {
  versionGroupId: number;
  learnsetRows: number;
  speciesFlavorTextRows: number;
}
/** Upstream regional/national dex; `versionGroupIds` lists the games that use it. */
export interface Pokedex extends NamedResource {
  isMainSeries: boolean;
  regionId: number | null;
  versionGroupIds: number[];
}
export interface ReferenceData {
  generations: Generation[];
  versionGroups: VersionGroup[];
  versions: Version[];
  types: NamedResource[];
  stats: NamedResource[];
  abilities: Ability[];
  moves: Move[];
  machines: Machine[];
  /** Global source row presence per exact version; not availability evidence. */
  encounterCoverage: { versionId: number; rows: number }[];
  learnMethods: NamedResource[];
  items: Item[];
  evolutionTriggers: NamedResource[];
  eggGroups: NamedResource[];
  pokedexes: Pokedex[];
  regions: NamedResource[];
  coverage: Coverage[];
  // Exact upstream counts, taken independently from the exported row arrays.
  sourceCounts: Record<
    | "generations"
    | "versionGroups"
    | "versions"
    | "types"
    | "stats"
    | "abilities"
    | "moves"
    | "machines"
    | "learnMethods"
    | "items"
    | "evolutionTriggers"
    | "eggGroups"
    | "pokedexes"
    | "regions",
    number
  >;
  census: {
    species: number;
    pokemon: number;
    forms: number;
    learnsets: number;
    evolutions: number;
  };
}

/** Detail-page references retain ability prose, but not move/item detail data. */
export interface PokemonReferences extends Omit<ReferenceData, "moves" | "items"> {
  moves: Pick<
    Move,
    | "id"
    | "identifier"
    | "names"
    | "typeId"
    | "damageClassId"
    | "power"
    | "accuracy"
    | "pp"
    | "priority"
  >[];
  items: NamedResource[];
}
export interface SearchReferences {
  moves: Pick<Move, "id" | "identifier" | "names" | "typeId">[];
  abilities: NamedResource[];
  items: NamedResource[];
}
export interface TypeSlot {
  slot: number;
  typeId: number;
}
export interface StatValue {
  statId: number;
  baseStat: number;
  effort: number;
}
export interface AbilitySlot {
  slot: number;
  abilityId: number | null;
  isHidden: boolean;
}
export interface LearnsetRow {
  moveId: number;
  versionGroupId: number;
  learnMethodId: number;
  level: number;
  order: number | null;
  mastery: number | null;
}
export interface PokemonForm {
  id: number;
  identifier: string;
  formIdentifier: string;
  names: Name[];
  formNames: Name[];
  versionGroupId: number | null;
  isDefault: boolean;
  isBattleOnly: boolean;
  isMega: boolean;
  order: number;
  formOrder: number;
}
/** Source location; `regionId` null when the source assigns no region. */
export interface EncounterLocation extends NamedResource {
  regionId: number | null;
}
/** Localized encounter resources may retain multiple distinct names per language. */
export interface Encounter {
  id: number;
  versionId: number;
  location: EncounterLocation;
  area: NamedResource;
  method: NamedResource;
  minLevel: number;
  maxLevel: number;
  /** Source slot provenance; its group may differ from the exact encounter version's group. */
  slot: { id: number; versionGroupId: number; slot: number | null; rarity: number };
  conditions: (NamedResource & { condition: NamedResource; isDefault: boolean })[];
  sourceCounts: { conditions: number };
}
export interface PokemonVariety {
  id: number;
  identifier: string;
  isDefault: boolean;
  height: number;
  weight: number;
  baseExperience: number | null;
  order: number;
  types: TypeSlot[];
  typeHistory: { generationId: number; types: TypeSlot[] }[];
  stats: StatValue[];
  statHistory: (StatValue & { generationId: number })[];
  abilities: AbilitySlot[];
  abilityHistory: (AbilitySlot & { generationId: number })[];
  forms: PokemonForm[];
  learnsets: LearnsetRow[];
  /** Exact-version source rows; absence does not prove unavailability. */
  encounters: Encounter[];
  media: { sprites: unknown; artwork: string | null };
  /** Current source cry audio URLs; null when the source has none. */
  cries: { latest: string | null; legacy: string | null };
  sourceCounts: Record<
    | "types"
    | "typeHistory"
    | "stats"
    | "statHistory"
    | "abilities"
    | "abilityHistory"
    | "forms"
    | "learnsets"
    | "encounters",
    number
  >;
}
export type SourceFactValue = string | number | boolean | null;
export interface EvolutionMethod {
  id: number;
  evolvedSpeciesId: number;
  versionGroupId: number | null;
  isDefault: boolean;
  triggerId: number;
  // Preserve every source condition, including expression/required-form fields.
  // Keys retain source column names; ID-valued conditions are not inferred applicability.
  conditions: Record<string, SourceFactValue>;
}
export interface SpeciesRecord {
  id: number;
  identifier: string;
  generationId: number;
  evolvesFromSpeciesId: number | null;
  evolutionChainId: number | null;
  names: Name[];
  genera: Name[];
  flavorTexts: FlavorText[];
  genderRate: number;
  captureRate: number;
  baseHappiness: number | null;
  isBaby: boolean;
  isLegendary: boolean;
  isMythical: boolean;
  // Additional source scalars retain their upstream column names and nulls.
  sourceFacts: Record<string, SourceFactValue>;
  /** Current source egg groups in source order; not game-specific. */
  eggGroupIds: number[];
  /** Every source dex entry; resolve regional entries via `Pokedex.versionGroupIds`. */
  pokedexNumbers: { pokedexId: number; number: number }[];
  varieties: PokemonVariety[];
  evolutions: EvolutionMethod[];
  sourceCounts: Record<
    | "names"
    | "genera"
    | "flavorTexts"
    | "varieties"
    | "evolutions"
    | "eggGroupIds"
    | "pokedexNumbers",
    number
  >;
}
export interface SnapshotInput {
  references: ReferenceData;
  species: SpeciesRecord[];
}
export interface LocalizedText {
  text: string;
  requestedLanguage: Language;
  sourceLanguageId: number | null;
  fallback: boolean;
}
export type Field<T> = { status: "available"; value: T } | { status: "missing"; reason: string };
export interface CoverageState {
  learnsets: "missing" | "source-rows-present";
  speciesFlavorTexts: "missing" | "source-rows-present";
}
export interface GameOption {
  version: Version;
  group: VersionGroup;
  expansions: {
    identifier: string;
    group: VersionGroup | null;
    versions: Version[];
    coverage: Coverage | null;
    coverageState: CoverageState;
  }[];
  coverage: Coverage | null;
  coverageState: CoverageState;
}
export interface SearchEntry {
  speciesId: number;
  pokemonId: number;
  formId: number | null;
  identifier: string;
  name: LocalizedText;
  speciesName: LocalizedText;
  aliases: string[];
  generationId: number;
  introducedVersionGroupId: number | null;
  isDefault: boolean;
}
export interface ResolvedPokemon {
  status: "available" | "not-introduced" | "unknown";
  reason?: string;
  speciesId: number;
  pokemonId: number;
  formId: number | null;
  name: LocalizedText;
  speciesName: LocalizedText;
  context: {
    language: Language;
    version: string;
    versionId: number;
    versionGroupId: number;
    generationId: number;
  };
  availability: { status: "unknown"; reason: string };
  mechanics: { status: "generation-based"; gameSpecificRules: "unverified" };
  types: Field<{ id: number; slot: number; name: LocalizedText }[]>;
  stats: Field<{ id: number; value: number; effort: number; name: LocalizedText }[]>;
  abilities:
    | Field<
        {
          id: number;
          slot: number;
          isHidden: boolean;
          name: LocalizedText;
          flavorText: Field<LocalizedText>;
          currentEffect: Field<LocalizedText>;
          effectScope: "current-not-game-specific";
        }[]
      >
    | { status: "not-applicable"; reason: string };
  learnset: Field<
    {
      moveId: number;
      name: LocalizedText;
      methodId: number;
      method: LocalizedText;
      level: number;
      order: number | null;
      mastery: number | null;
    }[]
  >;
  flavorText: Field<LocalizedText>;
  genus: LocalizedText;
  physical: Field<{
    scope: "current-not-game-specific";
    height: number;
    weight: number;
    baseExperience: number | null;
  }>;
  speciesFacts: Field<{
    scope: "current-not-game-specific";
    genderRate: number;
    captureRate: number;
    baseHappiness: number | null;
    isBaby: boolean;
    isLegendary: boolean;
    isMythical: boolean;
    sourceFacts: SpeciesRecord["sourceFacts"];
  }>;
  media: PokemonVariety["media"];
  /** Current cry URLs of the resolved variety; not game-specific. */
  cries: PokemonVariety["cries"] & { scope: "current-not-game-specific" };
  /** Current species egg groups; not historical/game-specific. */
  eggGroups: Field<{
    scope: "current-not-game-specific";
    groups: { id: number; name: LocalizedText }[];
  }>;
  /** Dex numbers in pokedexes used by the selected version group (national dex excluded). */
  regionalDexNumbers: Field<{ pokedexId: number; name: LocalizedText; number: number }[]>;
  forms: {
    id: number;
    pokemonId: number;
    identifier: string;
    name: LocalizedText;
    status: "available" | "not-introduced" | "unknown";
    isBattleOnly: boolean;
    isMega: boolean;
  }[];
  evolution: {
    applicability: "unresolved";
    methods: (EvolutionMethod & { trigger: LocalizedText; introduction: VersionGroup | null })[];
  };
  coverage: {
    base: Coverage | null;
    baseState: CoverageState;
    expansions: GameOption["expansions"];
    learnsetContext: "exact-version-group";
    flavorTextContext: "exact-version";
  };
}
export interface Provenance {
  endpoint: string;
  retrievalStartedAt: string;
  retrievalCompletedAt: string;
  refreshId: string;
  schemaRevision: string;
  operationRevision: string;
  consistency: "census-counts-and-maxima-matched-not-transactional";
}
export interface Asset {
  path: string;
  sha256: string;
  bytes: number;
}
export interface EvolutionChainProjection {
  chainId: number;
  applicability: "unresolved";
  nodes: (Pick<SpeciesRecord, "identifier" | "names" | "generationId" | "evolvesFromSpeciesId"> & {
    speciesId: number;
    methods: SpeciesRecord["evolutions"];
  })[];
}
export interface DatasetManifest {
  schemaVersion: number;
  datasetRevision: string;
  source: Provenance;
  languages: Language[];
  defaultVersion: "scarlet";
  counts: { species: number; pokemon: number; forms: number; learnsets: number };
  files: {
    references: Asset;
    pokemonReferences: Asset;
    searchReferences: Asset;
    /** Precomputed main-series `GameOption[]` (see getMainSeriesGames). */
    games: Asset;
    search: Record<Language, Asset>;
    pokemon: Record<string, Asset>;
    evolution: Record<string, Asset>;
  };
}
