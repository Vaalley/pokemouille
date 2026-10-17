import { error } from "@sveltejs/kit";
import { isLanguage } from "#lib/i18n/core.ts";
import { getCatalogue } from "#lib/server/catalogue.ts";
import { listPageEntries, requireListPage } from "#lib/server/list-pagination.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;
export const entries: EntryGenerator = () => listPageEntries("pokemon");
export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const catalogue = await getCatalogue(params.lang);
  requireListPage(params.page, catalogue.species.length);
  return { catalogue };
};
