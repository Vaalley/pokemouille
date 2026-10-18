import { asset } from "$app/paths";
import type { AssetPath } from "$app/types";
import { datasetFiles } from "../../../../../packages/pokemon-data/src/index.ts";
import type {
  EvolutionChainProjection,
  GameOption,
  Language,
  PokemonReferences,
  SearchEntry,
  SearchReferences,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { datasetPath } from "./dataset.ts";

export class DataError extends Error {
  readonly kind: "not-found" | "network" | "invalid";
  constructor(kind: DataError["kind"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DataError";
    this.kind = kind;
  }
}

/**
 * Promise cache keyed by revision-relative file: concurrent requests share one fetch,
 * the least recently used entry is dropped beyond `limit`, and rejected loads are
 * evicted so a retry fetches again.
 */
class PromiseCache<T> {
  readonly #entries = new Map<string, Promise<T>>();
  readonly #limit: number;
  constructor(limit: number) {
    this.#limit = limit;
  }
  get(key: string, load: () => Promise<T>): Promise<T> {
    const existing = this.#entries.get(key);
    if (existing) {
      this.#entries.delete(key);
      this.#entries.set(key, existing);
      return existing;
    }
    const promise = load();
    this.#entries.set(key, promise);
    promise.catch(() => {
      if (this.#entries.get(key) === promise) this.#entries.delete(key);
    });
    if (this.#entries.size > this.#limit) {
      const oldest = this.#entries.keys().next();
      if (!oldest.done) this.#entries.delete(oldest.value);
    }
    return promise;
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value);
const isNullableInteger = (value: unknown): boolean => value === null || isInteger(value);

function hasMoveListStats(value: unknown): boolean {
  return (
    isObject(value) &&
    isInteger(value.damageClassId) &&
    isNullableInteger(value.power) &&
    isNullableInteger(value.accuracy) &&
    isNullableInteger(value.pp) &&
    isInteger(value.priority)
  );
}

function hasEncounters(value: unknown): boolean {
  if (
    !isObject(value) ||
    !Array.isArray(value.encounters) ||
    !isObject(value.sourceCounts) ||
    value.sourceCounts.encounters !== value.encounters.length
  )
    return false;
  return value.encounters.every(
    (row) =>
      isObject(row) &&
      isInteger(row.id) &&
      isInteger(row.versionId) &&
      isObject(row.location) &&
      isNullableInteger(row.location.regionId) &&
      isObject(row.area) &&
      isObject(row.method) &&
      isInteger(row.minLevel) &&
      isInteger(row.maxLevel) &&
      isObject(row.slot) &&
      isInteger(row.slot.rarity) &&
      isInteger(row.slot.versionGroupId) &&
      Array.isArray(row.conditions) &&
      isObject(row.sourceCounts) &&
      row.sourceCounts.conditions === row.conditions.length,
  );
}

async function loadJson<T>(
  file: string,
  fetchImpl: typeof fetch,
  isValid: (value: unknown) => boolean,
): Promise<T> {
  const url = asset(datasetPath(file) as AssetPath);
  let response: Response;
  try {
    response = await fetchImpl(url);
  } catch (cause) {
    throw new DataError("network", `Could not fetch ${url}`, { cause });
  }
  if (response.status === 404) throw new DataError("not-found", `${url} was not found`);
  if (!response.ok) throw new DataError("network", `${url} responded with HTTP ${response.status}`);
  let value: unknown;
  try {
    value = await response.json();
  } catch (cause) {
    throw new DataError("invalid", `${url} is not valid JSON`, { cause });
  }
  if (!isValid(value)) throw new DataError("invalid", `${url} has an unexpected shape`);
  return value as T;
}

const pokemonReferencesCache = new PromiseCache<PokemonReferences>(1);
const searchReferencesCache = new PromiseCache<SearchReferences>(1);
const gamesCache = new PromiseCache<GameOption[]>(1);
const searchCache = new PromiseCache<SearchEntry[]>(3);
const speciesCache = new PromiseCache<SpeciesRecord>(24);
const evolutionCache = new PromiseCache<EvolutionChainProjection>(24);

export async function getPokemonReferences(
  fetchImpl: typeof fetch = fetch,
): Promise<PokemonReferences> {
  const file = datasetFiles.pokemonReferences;
  return pokemonReferencesCache.get(file, () =>
    loadJson(
      file,
      fetchImpl,
      (value) =>
        isObject(value) &&
        Array.isArray(value.versions) &&
        Array.isArray(value.versionGroups) &&
        Array.isArray(value.moves) &&
        value.moves.every(hasMoveListStats) &&
        Array.isArray(value.items) &&
        Array.isArray(value.eggGroups) &&
        Array.isArray(value.regions) &&
        Array.isArray(value.pokedexes) &&
        value.pokedexes.every(
          (row) =>
            isObject(row) &&
            isInteger(row.id) &&
            typeof row.isMainSeries === "boolean" &&
            isNullableInteger(row.regionId) &&
            Array.isArray(row.versionGroupIds) &&
            row.versionGroupIds.every(isInteger),
        ) &&
        Array.isArray(value.machines) &&
        value.machines.every(
          (row) =>
            isObject(row) &&
            isInteger(row.id) &&
            isInteger(row.number) &&
            isInteger(row.versionGroupId) &&
            isInteger(row.itemId) &&
            isInteger(row.moveId),
        ) &&
        Array.isArray(value.encounterCoverage) &&
        value.encounterCoverage.every(
          (row) => isObject(row) && isInteger(row.versionId) && isInteger(row.rows),
        ),
    ),
  );
}

export async function getSearchReferences(
  fetchImpl: typeof fetch = fetch,
): Promise<SearchReferences> {
  const file = datasetFiles.searchReferences;
  return searchReferencesCache.get(file, () =>
    loadJson(
      file,
      fetchImpl,
      (value) =>
        isObject(value) &&
        Array.isArray(value.moves) &&
        Array.isArray(value.abilities) &&
        Array.isArray(value.items),
    ),
  );
}

/** Main-series games, without loading the full references. */
export async function getGames(fetchImpl: typeof fetch = fetch): Promise<GameOption[]> {
  const file = datasetFiles.games;
  return gamesCache.get(file, () => loadJson(file, fetchImpl, Array.isArray));
}

export async function getSpecies(
  speciesId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<SpeciesRecord> {
  const file = datasetFiles.species(speciesId);
  return speciesCache.get(file, () =>
    loadJson(
      file,
      fetchImpl,
      (value) =>
        isObject(value) &&
        value.id === speciesId &&
        Array.isArray(value.eggGroupIds) &&
        value.eggGroupIds.every(isInteger) &&
        Array.isArray(value.pokedexNumbers) &&
        value.pokedexNumbers.every(
          (row) => isObject(row) && isInteger(row.pokedexId) && isInteger(row.number),
        ) &&
        isObject(value.sourceCounts) &&
        value.sourceCounts.eggGroupIds === value.eggGroupIds.length &&
        value.sourceCounts.pokedexNumbers === value.pokedexNumbers.length &&
        Array.isArray(value.varieties) &&
        value.varieties.every(
          (row) =>
            hasEncounters(row) &&
            isObject(row) &&
            isObject(row.cries) &&
            (row.cries.latest === null || typeof row.cries.latest === "string") &&
            (row.cries.legacy === null || typeof row.cries.legacy === "string"),
        ),
    ),
  );
}

export async function getEvolutionChain(
  chainId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<EvolutionChainProjection> {
  const file = datasetFiles.evolution(chainId);
  return evolutionCache.get(file, () =>
    loadJson(
      file,
      fetchImpl,
      (value) => isObject(value) && value.chainId === chainId && Array.isArray(value.nodes),
    ),
  );
}

export async function getSearchIndex(
  lang: Language,
  fetchImpl: typeof fetch = fetch,
): Promise<SearchEntry[]> {
  const file = datasetFiles.search(lang);
  return searchCache.get(file, () => loadJson(file, fetchImpl, Array.isArray));
}
