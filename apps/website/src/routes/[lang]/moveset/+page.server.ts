import { error } from "@sveltejs/kit";
import type { LocalizedText } from "../../../../../../packages/pokemon-data/src/index.ts";
import { compactNames } from "#lib/data/moveset.ts";
import type { ResourceEntry } from "#lib/data/resource-catalogue.ts";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import { getRelatedPokemon, getResourceCatalogue } from "#lib/server/catalogue.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;
export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));

/**
 * Localized names only: move choices, every variety that learns any move, and learn
 * methods. Learner rows stay in the per-move files the browser fetches on selection.
 */
export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const lang = params.lang;
  const catalogue = await getResourceCatalogue("move", lang);
  const pokemon = new Map<number, LocalizedText>();
  const methods = new Map<number, LocalizedText>();
  for (const move of catalogue.entries) {
    const related = await getRelatedPokemon("move", move.id, lang);
    for (const row of related.pokemon) {
      if (!pokemon.has(row.pokemonId)) pokemon.set(row.pokemonId, row.name);
    }
    for (const method of related.learnMethods) methods.set(method.id, method.name);
  }
  return {
    moves: catalogue.entries.map((move): ResourceEntry => ({
      id: move.id,
      identifier: move.identifier,
      name: move.name,
      englishName: move.englishName,
      typeId: move.typeId,
    })),
    pokemon: compactNames(pokemon),
    methods: [...methods].map(([id, name]) => ({ id, name })).sort((a, b) => a.id - b.id),
  };
};
