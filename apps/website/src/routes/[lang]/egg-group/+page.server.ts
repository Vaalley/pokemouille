import { error } from "@sveltejs/kit";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import { getEggGroups } from "#lib/server/breeding.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;
export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));
export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  return { lang: params.lang, groups: (await getEggGroups()).groups };
};
