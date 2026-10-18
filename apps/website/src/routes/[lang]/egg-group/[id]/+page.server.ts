import { error } from "@sveltejs/kit";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import { getEggGroupMembers, getEggGroups } from "#lib/server/breeding.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;
export const entries: EntryGenerator = async () => {
  const { groups } = await getEggGroups();
  return LANGUAGES.flatMap((lang) => groups.map((group) => ({ lang, id: String(group.id) })));
};
export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const id = Number(params.id);
  const { groups } = await getEggGroups();
  const group = groups.find((entry) => entry.id === id);
  if (!group || String(id) !== params.id) error(404, "Unknown egg group");
  return { lang: params.lang, group, groups, members: await getEggGroupMembers(id) };
};
