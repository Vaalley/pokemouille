import { resolvePokemon } from "../../../../../packages/pokemon-data/src/index.ts";
import type {
  EvolutionChainProjection,
  ReferenceData,
  ResolvedPokemon,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import type { PokemonContext } from "./context.ts";
import { DataError, getEvolutionChain, getManifest, getReferences, getSpecies } from "./loader.ts";

export interface PokemonView {
  pokemon: ResolvedPokemon;
  record: SpeciesRecord;
  references: ReferenceData;
  chain: EvolutionChainProjection | null;
  datasetRevision: string;
}

export async function loadPokemonView(
  speciesId: number,
  context: PokemonContext,
  fetchImpl: typeof fetch = fetch,
): Promise<PokemonView> {
  const { language, version, form } = context;
  const [manifest, record, references] = await Promise.all([
    getManifest(fetchImpl),
    getSpecies(speciesId, fetchImpl),
    getReferences(fetchImpl),
  ]);
  // resolvePokemon accepts variety and form identifiers; anything else is a bad URL.
  if (
    form !== null &&
    !record.varieties.some(
      (variety) =>
        variety.identifier === form || variety.forms.some((entry) => entry.identifier === form),
    )
  )
    throw new DataError("invalid", `Unknown form "${form}" for species ${speciesId}`);
  const pokemon = resolvePokemon(
    record,
    references,
    form === null ? { language, version } : { language, version, form },
  );
  const chainId = record.evolutionChainId;
  const chain =
    chainId !== null && manifest.files.evolution[String(chainId)]
      ? await getEvolutionChain(chainId, fetchImpl)
      : null;
  return { pokemon, record, references, chain, datasetRevision: manifest.datasetRevision };
}
