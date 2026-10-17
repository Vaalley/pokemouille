import { resolvePokemon } from "../../../../../packages/pokemon-data/src/index.ts";
import type {
  EvolutionChainProjection,
  PokemonReferences,
  ResolvedPokemon,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import type { PokemonContext } from "./context.ts";
import {
  DataError,
  getEvolutionChain,
  getManifest,
  getPokemonReferences,
  getSpecies,
} from "./loader.ts";

export interface PokemonData {
  record: SpeciesRecord;
  references: PokemonReferences;
}

export interface PokemonView extends PokemonData {
  pokemon: ResolvedPokemon;
}

/** Immutable inputs can load before the selected game and saved preference are known. */
export async function loadPokemonData(
  speciesId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<PokemonData> {
  const [record, references] = await Promise.all([
    getSpecies(speciesId, fetchImpl),
    getPokemonReferences(fetchImpl),
  ]);
  return { record, references };
}

/** Start as soon as the species arrives, independently of references and game context. */
export async function loadPokemonEvolution(
  speciesId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<EvolutionChainProjection | null> {
  const [manifest, record] = await Promise.all([
    getManifest(fetchImpl),
    getSpecies(speciesId, fetchImpl),
  ]);
  const chainId = record.evolutionChainId;
  return chainId !== null && manifest.files.evolution[String(chainId)]
    ? getEvolutionChain(chainId, fetchImpl)
    : null;
}

export function resolvePokemonView(data: PokemonData, context: PokemonContext): PokemonView {
  const { record, references } = data;
  const { language, version, form } = context;
  // resolvePokemon accepts variety and form identifiers; anything else is a bad URL.
  if (
    form !== null &&
    !record.varieties.some(
      (variety) =>
        variety.identifier === form || variety.forms.some((entry) => entry.identifier === form),
    )
  )
    throw new DataError("invalid", `Unknown form "${form}" for species ${record.id}`);
  const pokemon = resolvePokemon(
    record,
    references,
    form === null ? { language, version } : { language, version, form },
  );
  return { pokemon, record, references };
}
