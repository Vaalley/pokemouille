import type { Language } from "./types.ts";

/**
 * Revision-relative dataset file names. Publication writes and lists these names in the
 * manifest; a built site derives the same paths from the revision it was built with.
 */
export const datasetFiles = {
  references: "references.json",
  pokemonReferences: "pokemon-references.json",
  searchReferences: "search/references.json",
  games: "games.json",
  search: (language: Language) => `search/${language}.json`,
  species: (speciesId: number) => `pokemon/${speciesId}.json`,
  evolution: (chainId: number) => `evolution/${chainId}.json`,
} as const;

/** Path of a revision file below the dataset root (`static/data` locally, `/data` served). */
export function revisionPath(datasetRevision: string, file: string): string {
  return `revisions/${datasetRevision}/${file}`;
}
