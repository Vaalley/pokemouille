import { error } from "@sveltejs/kit";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

// The selection and game live in the query string, so one static shell per language;
// everything game-dependent resolves in the browser.
export const prerender = true;
export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));
export const load: PageServerLoad = ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  return {};
};
