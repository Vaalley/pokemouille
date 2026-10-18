import { browser } from "$app/env";
import { getEvolutionChain } from "#lib/data/loader.ts";
import { loadPokemonData } from "#lib/data/pokemon.ts";
import type { PageLoad } from "./$types";

// Runs in the browser before the page mounts, including when SvelteKit preloads a hovered
// link, so the downloads start early. The page reads the same loader caches: it shares an
// in-flight request, and a settled failure is evicted so the page fetches again.
export const load: PageLoad = ({ data }) => {
  if (browser) {
    loadPokemonData(data.speciesId).catch(() => {});
    if (data.evolutionChainId !== null) getEvolutionChain(data.evolutionChainId).catch(() => {});
  }
  return data;
};
