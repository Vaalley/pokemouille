import { error } from "@sveltejs/kit";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import { getLocationEncounters, getLocationIds } from "#lib/server/locations.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;

export const entries: EntryGenerator = async () => {
  const ids = await getLocationIds();
  return LANGUAGES.flatMap((lang) => ids.map((id) => ({ lang, id: String(id) })));
};

export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== params.id) {
    error(404, "Unknown location");
  }
  const encounters = await getLocationEncounters(id, params.lang);
  if (!encounters) error(404, "Unknown location");
  return { encounters };
};
