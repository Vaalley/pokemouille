import { error } from "@sveltejs/kit";
import { isLanguage } from "#lib/i18n/core.ts";
import type { LayoutLoad } from "./$types";

// Kit only reads `entries` from pages; `[lang]/+page.server.ts` enumerates the languages.
export const load: LayoutLoad = ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  return { lang: params.lang };
};
