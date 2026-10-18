import type {
  DatasetManifest,
  Language,
  LocalizedText,
  PokemonVariety,
  ReferenceData,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";
import { pokemonName } from "../../../../../packages/pokemon-data/src/resolve.ts";
import {
  projectAbilityMembership,
  projectMoveMembership,
  type Catalogue,
  type CatalogueSpecies,
  type CatalogueStats,
  type RelatedPokemon,
  type RelatedPokemonData,
  type SpeciesClass,
} from "../data/catalogue.ts";
import type { ResourceCatalogue, ResourceEntry, ResourceKind } from "../data/resource-catalogue.ts";
import { compareTypeMembers, type TypeMember } from "../data/type-membership.ts";
import { createSnapshotCache, forEachSpecies, readDataJson } from "./snapshot.ts";

const LANGUAGES: readonly Language[] = ["en", "fr", "ja"];

type RelatedIdentity = Omit<
  RelatedPokemon,
  "name" | "learnsets" | "abilityGenerations" | "hiddenAbilityGenerations"
> & { names: Record<Language, LocalizedText> };

interface MoveRelation {
  identity: RelatedIdentity;
  learnsets: RelatedPokemon["learnsets"];
}

interface AbilityRelation {
  identity: RelatedIdentity;
  abilityGenerations: number[];
  hiddenAbilityGenerations: number[];
}

interface SnapshotIndex {
  catalogue: Record<Language, Catalogue>;
  resources: Record<Language, Record<ResourceKind, ResourceCatalogue>>;
  learnMethods: Record<Language, RelatedPokemonData["learnMethods"]>;
  moves: Map<number, MoveRelation[]>;
  abilities: Map<number, AbilityRelation[]>;
  typeMembers: Record<Language, TypeMember[]>;
  types: ReferenceData["types"];
}

// Source stat IDs for HP, Attack, Defense, Sp. Atk, Sp. Def and Speed.
const BASE_STAT_IDS = [1, 2, 3, 4, 5, 6] as const;

/** Missing or ambiguous source stats stay unknown rather than becoming a misleading zero. */
function projectStats(variety: PokemonVariety): CatalogueStats | null {
  const stats = BASE_STAT_IDS.flatMap((statId) =>
    variety.stats.filter((row) => row.statId === statId).map((row) => row.baseStat),
  );
  if (stats.length !== BASE_STAT_IDS.length) return null;
  const [hp = 0, attack = 0, defense = 0, spAtk = 0, spDef = 0, speed = 0] = stats;
  return [hp, attack, defense, spAtk, spDef, speed, hp + attack + defense + spAtk + spDef + speed];
}

/** Source flags are exclusive in practice; mythical is the most specific if not. */
function projectClass(record: SpeciesRecord): SpeciesClass {
  if (record.isMythical) return "mythical";
  if (record.isLegendary) return "legendary";
  if (record.isBaby) return "baby";
  return "ordinary";
}

/** Current default-variety typing, stats and abilities; never a historical game's values. */
export function projectCatalogueSpecies(record: SpeciesRecord): Record<Language, CatalogueSpecies> {
  const variety = record.varieties.find((entry) => entry.isDefault);
  if (!variety) throw new Error(`Species ${record.id} has no default variety`);
  const typeIds = [...new Set(variety.types.map((row) => row.typeId))];
  const abilities = (hidden: boolean) => [
    ...new Set(
      variety.abilities
        .filter((row) => row.isHidden === hidden)
        .toSorted((a, b) => a.slot - b.slot)
        .flatMap((row) => (row.abilityId === null ? [] : [row.abilityId])),
    ),
  ];
  const stats = projectStats(variety);
  const abilityIds = abilities(false);
  const hiddenAbilityIds = abilities(true);
  const classification = projectClass(record);
  const dexNumbers: CatalogueSpecies["dexNumbers"] = record.pokedexNumbers.map((row) => [
    row.pokedexId,
    row.number,
  ]);
  const row = (language: Language): CatalogueSpecies => ({
    id: record.id,
    name: localize(record.names, language, record.identifier).text,
    generationId: record.generationId,
    typeIds,
    stats,
    abilityIds,
    hiddenAbilityIds,
    classification,
    dexNumbers,
  });
  return { en: row("en"), fr: row("fr"), ja: row("ja") };
}

/**
 * One identity per variety, not per cosmetic form. Match detail resolution's
 * default-form selection and pokemonName localization, retaining source gaps.
 * null form means the species' default selection; an alternative always carries
 * a resolvable form/variety identifier. Introduction is not obtainability.
 */
export function projectRelatedIdentity(
  record: SpeciesRecord,
  variety: PokemonVariety,
): RelatedIdentity {
  const form =
    variety.forms.find((entry) => entry.isDefault) ??
    (variety.forms.length === 1 ? variety.forms[0]! : null);
  return {
    speciesId: record.id,
    pokemonId: variety.id,
    form: variety.isDefault ? null : (form?.identifier ?? variety.identifier),
    generationId: record.generationId,
    introducedVersionGroupId: form?.versionGroupId ?? null,
    names: {
      en: pokemonName(record, variety, form, "en"),
      fr: pokemonName(record, variety, form, "fr"),
      ja: pokemonName(record, variety, form, "ja"),
    },
  };
}

/** Typing belongs to a variety; cosmetic forms share its current and historical types. */
export function projectTypeMembers(
  record: SpeciesRecord,
  groups: ReadonlyMap<number, number>,
): Record<Language, TypeMember[]> {
  const projected: Record<Language, TypeMember[]> = { en: [], fr: [], ja: [] };
  for (const variety of record.varieties) {
    let form =
      variety.forms.find((entry) => entry.isDefault) ??
      (variety.forms.length === 1 ? variety.forms[0]! : null);
    const groupedFallback = form === null;
    let introductionOrder =
      form?.versionGroupId == null ? null : (groups.get(form.versionGroupId) ?? null);
    if (!form) {
      // Keep chronology and navigation tied to the same earliest known form.
      for (const candidate of variety.forms) {
        const order =
          candidate.versionGroupId == null ? undefined : groups.get(candidate.versionGroupId);
        if (order !== undefined && (introductionOrder === null || order < introductionOrder)) {
          introductionOrder = order;
          form = candidate;
        }
      }
    }
    for (const lang of LANGUAGES) {
      projected[lang].push({
        speciesId: record.id,
        pokemonId: variety.id,
        form:
          variety.isDefault && !groupedFallback ? null : (form?.identifier ?? variety.identifier),
        name:
          variety.isDefault && !groupedFallback
            ? localize(record.names, lang, record.identifier)
            : pokemonName(record, variety, form, lang),
        generationId: record.generationId,
        introductionOrder,
        types: variety.types,
        typeHistory: variety.typeHistory,
      });
    }
  }
  for (const lang of LANGUAGES) projected[lang].sort(compareTypeMembers);
  return projected;
}

function byIdentity(a: { identity: RelatedIdentity }, b: { identity: RelatedIdentity }): number {
  return a.identity.speciesId - b.identity.speciesId || a.identity.pokemonId - b.identity.pokemonId;
}

/**
 * One bounded pass over already-published species assets per snapshot. At most
 * four full records are read/parsed concurrently, and none are retained. Compact
 * identities are shared by all resource indexes; each source learnset keeps only
 * its exact version group, method and level after membership deduplication.
 * This deliberately spends cold-start I/O once rather than shipping 1,025 full
 * records to a browser or reparsing them for every resource, route and locale.
 */
async function buildSnapshot(manifest: DatasetManifest): Promise<SnapshotIndex> {
  // Do not retain the full reference payload (move text/effects are irrelevant here).
  const {
    types,
    stats,
    generations: sourceGenerations,
    learnMethods,
    moves: sourceMoves,
    abilities: sourceAbilities,
    items: sourceItems,
    versionGroups,
    pokedexes,
    versions,
  } = await readDataJson<ReferenceData>(manifest.files.references.path);
  const generations = sourceGenerations.map((row) => row.id).sort((a, b) => a - b);
  const groupOrders = new Map(versionGroups.map((group) => [group.id, group.order]));
  const statRows = BASE_STAT_IDS.map((id) => {
    const row = stats.find((stat) => stat.id === id);
    if (!row) throw new Error(`References lack base stat ${id}`);
    return row;
  });
  const catalogue = (language: Language): Catalogue => ({
    species: [],
    types: types.map((row) => ({
      id: row.id,
      name: localize(row.names, language, row.identifier),
    })),
    generations,
    abilities: [],
    statNames: statRows.map((row) => localize(row.names, language, row.identifier)),
    pokedexes: pokedexes.map((row) => ({
      id: row.id,
      name: localize(row.names, language, row.identifier),
      versionGroupIds: [...new Set(row.versionGroupIds)],
    })),
    versions: versions.map((row) => [row.identifier, row.versionGroupId]),
  });
  const methods = (language: Language): RelatedPokemonData["learnMethods"] =>
    learnMethods.map((row) => ({
      id: row.id,
      name: localize(row.names, language, row.identifier),
    }));
  const resources = (language: Language): Record<ResourceKind, ResourceCatalogue> => {
    const identity = (row: ReferenceData["items"][number]): ResourceEntry => ({
      id: row.id,
      identifier: row.identifier,
      name: localize(row.names, language, row.identifier),
      englishName: localize(row.names, "en", row.identifier).text,
    });
    return {
      move: {
        kind: "move",
        entries: sourceMoves
          .toSorted((a, b) => a.id - b.id)
          .map((row) => ({
            ...identity(row),
            typeId: row.typeId,
            damageClassId: row.damageClassId,
            power: row.power,
            accuracy: row.accuracy,
            pp: row.pp,
          })),
        types: catalogue(language).types,
        categories: [...new Set(sourceMoves.map((row) => row.damageClassId))].sort((a, b) => a - b),
      },
      ability: {
        kind: "ability",
        entries: sourceAbilities.toSorted((a, b) => a.id - b.id).map(identity),
        types: [],
        categories: [],
      },
      item: {
        kind: "item",
        entries: sourceItems.toSorted((a, b) => a.id - b.id).map(identity),
        types: [],
        categories: [],
      },
    };
  };
  const index: SnapshotIndex = {
    types,
    catalogue: { en: catalogue("en"), fr: catalogue("fr"), ja: catalogue("ja") },
    resources: { en: resources("en"), fr: resources("fr"), ja: resources("ja") },
    learnMethods: { en: methods("en"), fr: methods("fr"), ja: methods("ja") },
    moves: new Map(),
    abilities: new Map(),
    typeMembers: { en: [], fr: [], ja: [] },
  };
  await forEachSpecies(manifest, (record) => {
    const species = projectCatalogueSpecies(record);
    const typeMembers = projectTypeMembers(record, groupOrders);
    for (const language of LANGUAGES) index.typeMembers[language].push(...typeMembers[language]);
    for (const language of LANGUAGES) index.catalogue[language].species.push(species[language]);
    const speciesGenerations = generations.filter((id) => id >= record.generationId);
    for (const variety of record.varieties) {
      const identity = projectRelatedIdentity(record, variety);
      for (const [moveId, learnsets] of projectMoveMembership(variety.learnsets)) {
        const relation = { identity, learnsets };
        const rows = index.moves.get(moveId);
        if (rows) rows.push(relation);
        else index.moves.set(moveId, [relation]);
      }
      for (const [abilityId, membership] of projectAbilityMembership(
        variety.abilities,
        variety.abilityHistory,
        speciesGenerations,
      )) {
        const relation = { identity, ...membership };
        const rows = index.abilities.get(abilityId);
        if (rows) rows.push(relation);
        else index.abilities.set(abilityId, [relation]);
      }
    }
  });
  // Only abilities a species currently has: any other choice would always be empty.
  const currentAbilityIds = new Set(
    index.catalogue.en.species.flatMap((row) => [...row.abilityIds, ...row.hiddenAbilityIds]),
  );
  for (const language of LANGUAGES) {
    const collator = new Intl.Collator(language);
    index.catalogue[language].species.sort((a, b) => a.id - b.id);
    index.catalogue[language].abilities = sourceAbilities
      .filter((row) => currentAbilityIds.has(row.id))
      .map((row) => ({ id: row.id, name: localize(row.names, language, row.identifier) }))
      .sort((a, b) => collator.compare(a.name.text, b.name.text) || a.id - b.id);
  }
  for (const language of LANGUAGES) index.typeMembers[language].sort(compareTypeMembers);
  for (const rows of index.moves.values()) rows.sort(byIdentity);
  for (const rows of index.abilities.values()) rows.sort(byIdentity);
  return index;
}

const getSnapshot = createSnapshotCache(buildSnapshot);

export async function getCatalogue(lang: Language): Promise<Catalogue> {
  return (await getSnapshot()).catalogue[lang];
}

/** Reference-only list metadata; no detail payload or client-side record fanout. */
export async function getResourceCatalogue(
  kind: ResourceKind,
  lang: Language,
): Promise<ResourceCatalogue> {
  return (await getSnapshot()).resources[lang][kind];
}

/** Compact historical typing and form chronology, shared by all static locale pages. */
export async function getTypeMembers(lang: Language): Promise<TypeMember[]> {
  return (await getSnapshot()).typeMembers[lang];
}

/** Type names only; keeps the full server references out of browser page loads. */
export async function getTypes(): Promise<ReferenceData["types"]> {
  return (await getSnapshot()).types;
}

/** Only the requested resource's projected relationships cross the page boundary. */
export async function getRelatedPokemon(
  kind: "move" | "ability",
  id: number,
  lang: Language,
): Promise<RelatedPokemonData> {
  const snapshot = await getSnapshot();
  if (kind === "ability") {
    return {
      pokemon: (snapshot.abilities.get(id) ?? []).map((row) => ({
        speciesId: row.identity.speciesId,
        pokemonId: row.identity.pokemonId,
        form: row.identity.form,
        name: row.identity.names[lang],
        generationId: row.identity.generationId,
        introducedVersionGroupId: row.identity.introducedVersionGroupId,
        learnsets: [],
        abilityGenerations: row.abilityGenerations,
        hiddenAbilityGenerations: row.hiddenAbilityGenerations,
      })),
      learnMethods: [],
    };
  }
  const methodIds = new Set<number>();
  const pokemon = (snapshot.moves.get(id) ?? []).map((row): RelatedPokemon => {
    for (const method of row.learnsets) methodIds.add(method.learnMethodId);
    return {
      speciesId: row.identity.speciesId,
      pokemonId: row.identity.pokemonId,
      form: row.identity.form,
      name: row.identity.names[lang],
      generationId: row.identity.generationId,
      introducedVersionGroupId: row.identity.introducedVersionGroupId,
      learnsets: row.learnsets,
      abilityGenerations: [],
      hiddenAbilityGenerations: [],
    };
  });
  return {
    pokemon,
    learnMethods: snapshot.learnMethods[lang].filter((row) => methodIds.has(row.id)),
  };
}
