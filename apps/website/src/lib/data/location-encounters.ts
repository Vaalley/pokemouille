import type { Encounter, LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
import { normalizeSearchText } from "../search/rank.ts";

export interface LocalizedResource {
  id: number;
  identifier: string;
  name: LocalizedText;
}

/** One identity per variety: cosmetic forms share the variety's encounter records. */
export interface LocationPokemon {
  speciesId: number;
  pokemonId: number;
  variety: string;
  /** null for the species default variety; otherwise the form/variety URL value. */
  form: string | null;
  name: LocalizedText;
}

/** A source condition value; `isDefault` is source metadata, not "unconditional". */
export interface LocationConditionValue extends LocalizedResource {
  isDefault: boolean;
  condition: LocalizedResource;
}

/** One exact-version source slot row; rows are never merged or summed. */
export interface LocationEncounterRow {
  id: number;
  versionId: number;
  areaId: number;
  methodId: number;
  pokemonId: number;
  minLevel: number;
  maxLevel: number;
  slot: Encounter["slot"];
  conditionIds: number[];
  /** The source counted more conditions than were joined into this row. */
  incompleteConditions: boolean;
}

/** Compact per-location page data for every exact version; names localized for one language. */
export interface LocationEncounterData {
  location: LocalizedResource;
  /** null: the source assigns no region to this location. */
  region: LocalizedResource | null;
  areas: LocalizedResource[];
  methods: LocalizedResource[];
  conditions: LocationConditionValue[];
  pokemon: LocationPokemon[];
  rows: LocationEncounterRow[];
  /** Global source row presence per exact version; not availability evidence. */
  encounterCoverage: { versionId: number; rows: number }[];
}

export interface LocationEncounterView {
  /**
   * `location-empty`: the source has rows for this game elsewhere, none here.
   * `game-empty`: the source has no encounter rows at all for this game.
   * `coverage-unknown`: global coverage for this game is not recorded.
   */
  status: "rows" | "location-empty" | "game-empty" | "coverage-unknown";
  areas: {
    area: LocalizedResource;
    methods: {
      method: LocalizedResource;
      rows: {
        row: LocationEncounterRow;
        pokemon: LocationPokemon;
        conditions: LocationConditionValue[];
      }[];
    }[];
  }[];
  /** Exact versions that do have rows at this location, in source ID order. */
  versionIds: number[];
}

/** Select only the exact version's rows, grouped by area then method in page-data order. */
export function selectLocationEncounters(
  data: LocationEncounterData,
  versionId: number,
): LocationEncounterView {
  const versionIds = [...new Set(data.rows.map((row) => row.versionId))].sort((a, b) => a - b);
  const rows = data.rows.filter((row) => row.versionId === versionId);
  if (rows.length === 0) {
    const coverage = data.encounterCoverage.find((entry) => entry.versionId === versionId);
    const status = !coverage
      ? "coverage-unknown"
      : coverage.rows === 0
        ? "game-empty"
        : "location-empty";
    return { status, areas: [], versionIds };
  }
  const pokemon = new Map(data.pokemon.map((entry) => [entry.pokemonId, entry]));
  const conditions = new Map(data.conditions.map((entry) => [entry.id, entry]));
  const areas = data.areas
    .map((area) => ({
      area,
      methods: data.methods
        .map((method) => ({
          method,
          rows: rows
            .filter((row) => row.areaId === area.id && row.methodId === method.id)
            .map((row) => ({
              row,
              pokemon: pokemon.get(row.pokemonId)!,
              conditions: row.conditionIds.map((id) => conditions.get(id)!),
            })),
        }))
        .filter((group) => group.rows.length > 0),
    }))
    .filter((group) => group.methods.length > 0);
  return { status: "rows", areas, versionIds };
}

export interface LocationSummary {
  id: number;
  identifier: string;
  name: LocalizedText;
  englishName: string;
  regionId: number | null;
}

export interface LocationCatalogue {
  /** Sorted by localized name. */
  locations: LocationSummary[];
  /** Every region referenced by a location, in source ID order. */
  regions: LocalizedResource[];
}

export interface PreparedLocation {
  entry: LocationSummary;
  names: string[];
}

export function prepareLocations(entries: readonly LocationSummary[]): PreparedLocation[] {
  return entries.map((entry) => ({
    entry,
    names: [
      entry.name.text,
      entry.englishName,
      entry.identifier,
      entry.identifier.replaceAll("-", " "),
    ].map(normalizeSearchText),
  }));
}

/** Localized and canonical names share the catalogue search normalization. */
export function filterLocations(
  prepared: readonly PreparedLocation[],
  q: string,
): LocationSummary[] {
  const query = normalizeSearchText(q);
  return prepared
    .filter(({ names }) => !query || names.some((name) => name.includes(query)))
    .map(({ entry }) => entry);
}

/** Keep game context, drop unrelated Pokémon form context, and replace the name filter. */
export function locationFilterUrl(url: { readonly href: string }, q: string): URL {
  const next = new URL(url.href);
  next.searchParams.delete("q");
  next.searchParams.delete("form");
  if (q) next.searchParams.set("q", q);
  return next;
}

export interface LocationRegionGroup {
  regionId: number | null;
  /** Missing only if the region ID is absent from the catalogue's region list. */
  region: LocalizedResource | null;
  locations: LocationSummary[];
}

/**
 * Regions in catalogue order, then unlisted region IDs, then locations whose source
 * records no region. Locations keep their input order and are never assigned a region
 * the source does not record.
 */
export function groupLocationsByRegion(
  locations: readonly LocationSummary[],
  regions: readonly LocalizedResource[],
): LocationRegionGroup[] {
  const groups = new Map<number | null, LocationSummary[]>();
  for (const location of locations) {
    const group = groups.get(location.regionId);
    if (group) group.push(location);
    else groups.set(location.regionId, [location]);
  }
  const order = new Map(regions.map((region, index) => [region.id, index]));
  const rank = (id: number | null) =>
    id === null ? Number.POSITIVE_INFINITY : (order.get(id) ?? regions.length + id);
  return [...groups]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([regionId, entries]) => ({
      regionId,
      region: regionId === null ? null : (regions.find((region) => region.id === regionId) ?? null),
      locations: entries,
    }));
}
