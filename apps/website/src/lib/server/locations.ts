import type {
  DatasetManifest,
  Encounter,
  EncounterLocation,
  Language,
  LocalizedText,
  NamedResource,
  ReferenceData,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";
import type {
  LocalizedResource,
  LocationCatalogue,
  LocationEncounterData,
  LocationEncounterRow,
} from "../data/location-encounters.ts";
import { projectRelatedIdentity } from "./catalogue.ts";
import { createSnapshotCache, forEachSpecies, readDataJson } from "./snapshot.ts";

type Condition = Encounter["conditions"][number];

/** Locale-independent inversion of one location's variety-level, exact-version rows. */
export interface IndexedLocation {
  location: EncounterLocation;
  areas: Map<number, NamedResource>;
  methods: Map<number, NamedResource>;
  conditions: Map<number, Condition>;
  pokemon: Map<
    number,
    {
      speciesId: number;
      pokemonId: number;
      variety: string;
      form: string | null;
      names: Record<Language, LocalizedText>;
    }
  >;
  rows: LocationEncounterRow[];
}

interface Snapshot {
  locations: Map<number, IndexedLocation>;
  regions: NamedResource[];
  encounterCoverage: ReferenceData["encounterCoverage"];
}

/**
 * Add one species' encounter rows to their locations. Records are per variety, so
 * cosmetic forms are never split out; each source row stays its own slot row with its
 * exact version, level range, slot rarity and complete condition list.
 */
export function indexSpeciesEncounters(
  index: Map<number, IndexedLocation>,
  record: SpeciesRecord,
): void {
  for (const variety of record.varieties) {
    if (variety.encounters.length === 0) continue;
    const identity = projectRelatedIdentity(record, variety);
    for (const encounter of variety.encounters) {
      let entry = index.get(encounter.location.id);
      if (!entry) {
        entry = {
          location: encounter.location,
          areas: new Map(),
          methods: new Map(),
          conditions: new Map(),
          pokemon: new Map(),
          rows: [],
        };
        index.set(encounter.location.id, entry);
      }
      if (!entry.areas.has(encounter.area.id)) entry.areas.set(encounter.area.id, encounter.area);
      if (!entry.methods.has(encounter.method.id))
        entry.methods.set(encounter.method.id, encounter.method);
      for (const condition of encounter.conditions)
        if (!entry.conditions.has(condition.id)) entry.conditions.set(condition.id, condition);
      if (!entry.pokemon.has(variety.id))
        entry.pokemon.set(variety.id, {
          speciesId: identity.speciesId,
          pokemonId: identity.pokemonId,
          variety: variety.identifier,
          form: identity.form,
          names: identity.names,
        });
      entry.rows.push({
        id: encounter.id,
        versionId: encounter.versionId,
        areaId: encounter.area.id,
        methodId: encounter.method.id,
        pokemonId: variety.id,
        minLevel: encounter.minLevel,
        maxLevel: encounter.maxLevel,
        slot: encounter.slot,
        conditionIds: encounter.conditions.map((condition) => condition.id),
        incompleteConditions: encounter.sourceCounts.conditions > encounter.conditions.length,
      });
    }
  }
}

/** Deterministic row order independent of species read completion order. */
export function sortLocationRows(entry: IndexedLocation): void {
  const species = (pokemonId: number) => entry.pokemon.get(pokemonId)!.speciesId;
  entry.rows.sort(
    (a, b) =>
      a.versionId - b.versionId ||
      a.areaId - b.areaId ||
      a.methodId - b.methodId ||
      species(a.pokemonId) - species(b.pokemonId) ||
      a.pokemonId - b.pokemonId ||
      (a.slot.slot ?? Number.POSITIVE_INFINITY) - (b.slot.slot ?? Number.POSITIVE_INFINITY) ||
      a.minLevel - b.minLevel ||
      a.id - b.id,
  );
}

function localizeResource(resource: NamedResource, lang: Language): LocalizedResource {
  return {
    id: resource.id,
    identifier: resource.identifier,
    name: localize(resource.names, lang, resource.identifier),
  };
}

/** A region ID without a reference row stays visible as its ID, never a guessed name. */
function regionResource(
  regions: readonly NamedResource[],
  regionId: number,
  lang: Language,
): LocalizedResource {
  const region = regions.find((row) => row.id === regionId);
  return region
    ? localizeResource(region, lang)
    : { id: regionId, identifier: String(regionId), name: localize([], lang, String(regionId)) };
}

const byId = (a: { id: number }, b: { id: number }) => a.id - b.id;

export function projectLocationPage(
  entry: IndexedLocation,
  regions: readonly NamedResource[],
  encounterCoverage: ReferenceData["encounterCoverage"],
  lang: Language,
): LocationEncounterData {
  const { regionId } = entry.location;
  return {
    location: localizeResource(entry.location, lang),
    region: regionId === null ? null : regionResource(regions, regionId, lang),
    areas: [...entry.areas.values()].sort(byId).map((area) => localizeResource(area, lang)),
    methods: [...entry.methods.values()].sort(byId).map((method) => localizeResource(method, lang)),
    conditions: [...entry.conditions.values()].sort(byId).map((condition) => ({
      ...localizeResource(condition, lang),
      isDefault: condition.isDefault,
      condition: localizeResource(condition.condition, lang),
    })),
    pokemon: [...entry.pokemon.values()]
      .sort((a, b) => a.pokemonId - b.pokemonId)
      .map(({ names, ...identity }) => ({
        ...identity,
        name: names[lang],
      })),
    rows: entry.rows,
    encounterCoverage,
  };
}

export function projectLocationCatalogue(
  locations: Iterable<IndexedLocation>,
  regions: readonly NamedResource[],
  lang: Language,
): LocationCatalogue {
  const collator = new Intl.Collator(lang);
  const entries = [...locations].map(({ location }) => ({
    id: location.id,
    identifier: location.identifier,
    name: localize(location.names, lang, location.identifier),
    englishName: localize(location.names, "en", location.identifier).text,
    regionId: location.regionId,
  }));
  entries.sort((a, b) => collator.compare(a.name.text, b.name.text) || a.id - b.id);
  const regionIds = [
    ...new Set(entries.flatMap((entry) => (entry.regionId === null ? [] : [entry.regionId]))),
  ].sort((a, b) => a - b);
  return {
    locations: entries,
    regions: regionIds.map((id) => regionResource(regions, id, lang)),
  };
}

/** One bounded species pass per immutable dataset revision, shared by all location routes. */
async function buildSnapshot(manifest: DatasetManifest): Promise<Snapshot> {
  const { regions, encounterCoverage } = await readDataJson<ReferenceData>(
    manifest.files.references.path,
  );
  const locations = new Map<number, IndexedLocation>();
  await forEachSpecies(manifest, (record) => indexSpeciesEncounters(locations, record));
  for (const entry of locations.values()) sortLocationRows(entry);
  return { locations, regions, encounterCoverage };
}

const getSnapshot = createSnapshotCache(buildSnapshot);

/** Locations with at least one source encounter row, in source ID order. */
export async function getLocationIds(): Promise<number[]> {
  return [...(await getSnapshot()).locations.keys()].sort((a, b) => a - b);
}

export async function getLocationCatalogue(lang: Language): Promise<LocationCatalogue> {
  const snapshot = await getSnapshot();
  return projectLocationCatalogue(snapshot.locations.values(), snapshot.regions, lang);
}

/** All exact versions' rows for one location; the browser selects the game. */
export async function getLocationEncounters(
  id: number,
  lang: Language,
): Promise<LocationEncounterData | null> {
  const snapshot = await getSnapshot();
  const entry = snapshot.locations.get(id);
  return entry
    ? projectLocationPage(entry, snapshot.regions, snapshot.encounterCoverage, lang)
    : null;
}
