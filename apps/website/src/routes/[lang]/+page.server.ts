import { error } from "@sveltejs/kit";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import { getCatalogue } from "#lib/server/catalogue.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));

/** Ship only the compact catalogue, never full Pokémon records. */
export const load: PageServerLoad = async ({ params }) => {
  // Server loads do not receive the universal `[lang]/+layout.ts` data, so validate again.
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  return { catalogue: await getCatalogue(params.lang) };
};
