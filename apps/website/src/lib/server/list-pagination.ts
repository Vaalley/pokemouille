import { error } from "@sveltejs/kit";
import { LANGUAGES } from "#lib/i18n/core.ts";
import type { ResourceKind } from "#lib/data/resource-catalogue.ts";
import { pageCount, validPage } from "#lib/data/pagination.ts";
import { getCatalogue, getResourceCatalogue } from "./catalogue.ts";

/** Derive the static route set from the same compact snapshots the lists use. */
export async function listPageEntries(kind: ResourceKind | "pokemon") {
  const languages = await Promise.all(
    LANGUAGES.map(async (lang) => {
      const total =
        kind === "pokemon"
          ? (await getCatalogue(lang)).species.length
          : (await getResourceCatalogue(kind, lang)).entries.length;
      return Array.from({ length: pageCount(total) - 1 }, (_, index) => ({
        lang,
        page: String(index + 2),
      }));
    }),
  );
  return languages.flat();
}

export function requireListPage(value: string, total: number) {
  if (validPage(value, total) === null) error(404, "Unknown catalogue page");
}
