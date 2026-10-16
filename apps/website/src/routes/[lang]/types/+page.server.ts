import { error } from "@sveltejs/kit";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import { getTypeMembers } from "#lib/server/catalogue.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;
export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));
export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  return { typeMembers: await getTypeMembers(params.lang) };
};
