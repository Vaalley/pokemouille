import { browser } from "$app/env";
import { asset } from "$app/paths";
import type { AssetPath } from "$app/types";
import type {
  Asset,
  DatasetManifest,
  EvolutionChainProjection,
  GameOption,
  Language,
  PokemonReferences,
  SearchEntry,
  SearchReferences,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";

export class DataError extends Error {
  readonly kind: "not-found" | "network" | "invalid";
  constructor(kind: DataError["kind"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DataError";
    this.kind = kind;
  }
}

/**
 * Promise cache keyed by manifest-relative path: concurrent requests share one fetch,
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

async function loadJson<T>(
  path: string,
  fetchImpl: typeof fetch,
  isValid: (value: unknown) => boolean,
  init?: RequestInit,
): Promise<T> {
  // Paths come from the runtime manifest, not the build-time static file list.
  const url = asset(`data/${path}` as AssetPath);
  let response: Response;
  try {
    response = await fetchImpl(url, init);
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

// The first manifest that loads successfully pins the dataset revision for the whole
// session, so every later asset comes from one consistent snapshot.
let manifest: Promise<DatasetManifest> | undefined;

export function getManifest(fetchImpl: typeof fetch = fetch): Promise<DatasetManifest> {
  if (!manifest) {
    const attempt = loadJson<DatasetManifest>(
      "manifest.json",
      fetchImpl,
      (value) =>
        isObject(value) &&
        typeof value.datasetRevision === "string" &&
        isObject(value.files) &&
        isObject(value.files.references) &&
        isObject(value.files.pokemonReferences) &&
        isObject(value.files.searchReferences) &&
        isObject(value.files.games) &&
        isObject(value.files.search) &&
        isObject(value.files.pokemon) &&
        isObject(value.files.evolution),
      // The root manifest is mutable; revalidate it instead of trusting the HTTP cache.
      browser ? { cache: "no-cache" } : undefined,
    );
    manifest = attempt;
    attempt.catch(() => {
      if (manifest === attempt) manifest = undefined;
    });
  }
  return manifest;
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
  const { path } = (await getManifest(fetchImpl)).files.pokemonReferences;
  return pokemonReferencesCache.get(path, () =>
    loadJson(
      path,
      fetchImpl,
      (value) =>
        isObject(value) &&
        Array.isArray(value.versions) &&
        Array.isArray(value.versionGroups) &&
        Array.isArray(value.moves) &&
        Array.isArray(value.items),
    ),
  );
}

export async function getSearchReferences(
  fetchImpl: typeof fetch = fetch,
): Promise<SearchReferences> {
  const { path } = (await getManifest(fetchImpl)).files.searchReferences;
  return searchReferencesCache.get(path, () =>
    loadJson(
      path,
      fetchImpl,
      (value) =>
        isObject(value) &&
        Array.isArray(value.moves) &&
        Array.isArray(value.abilities) &&
        Array.isArray(value.items),
    ),
  );
}

/** Main-series games of the pinned revision, without loading the full references. */
export async function getGames(fetchImpl: typeof fetch = fetch): Promise<GameOption[]> {
  const { path } = (await getManifest(fetchImpl)).files.games;
  return gamesCache.get(path, () => loadJson(path, fetchImpl, Array.isArray));
}

export async function getSpecies(
  speciesId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<SpeciesRecord> {
  const entry: Asset | undefined = (await getManifest(fetchImpl)).files.pokemon[String(speciesId)];
  if (!entry) throw new DataError("not-found", `Species ${speciesId} is not in the dataset`);
  return speciesCache.get(entry.path, () =>
    loadJson(
      entry.path,
      fetchImpl,
      (value) => isObject(value) && value.id === speciesId && Array.isArray(value.varieties),
    ),
  );
}

export async function getEvolutionChain(
  chainId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<EvolutionChainProjection> {
  const entry: Asset | undefined = (await getManifest(fetchImpl)).files.evolution[String(chainId)];
  if (!entry) throw new DataError("not-found", `Evolution chain ${chainId} is not in the dataset`);
  return evolutionCache.get(entry.path, () =>
    loadJson(
      entry.path,
      fetchImpl,
      (value) => isObject(value) && value.chainId === chainId && Array.isArray(value.nodes),
    ),
  );
}

export async function getSearchIndex(
  lang: Language,
  fetchImpl: typeof fetch = fetch,
): Promise<SearchEntry[]> {
  const entry: Asset | undefined = (await getManifest(fetchImpl)).files.search[lang];
  if (!entry) throw new DataError("not-found", `No search index for ${lang}`);
  return searchCache.get(entry.path, () => loadJson(entry.path, fetchImpl, Array.isArray));
}
