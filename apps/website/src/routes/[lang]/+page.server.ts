import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { error } from "@sveltejs/kit";
import type {
  DatasetManifest,
  SearchEntry,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

// Prerendering runs with apps/website as the working directory; the published dataset is static.
const DATA_DIR = join(process.cwd(), "static", "data");

export const entries: EntryGenerator = () => LANGUAGES.map((lang) => ({ lang }));

/** Only number and localized species name: the home list must not ship the whole search index. */
export const load: PageServerLoad = async ({ params }) => {
  // Server loads do not receive the universal `[lang]/+layout.ts` data, so validate again.
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const manifest = JSON.parse(
    await readFile(join(DATA_DIR, "manifest.json"), "utf8"),
  ) as DatasetManifest;
  const index = JSON.parse(
    await readFile(join(DATA_DIR, manifest.files.search[params.lang].path), "utf8"),
  ) as SearchEntry[];
  const species = index
    .filter((entry) => entry.isDefault)
    .map((entry) => ({ id: entry.speciesId, name: entry.speciesName.text }))
    .sort((a, b) => a.id - b.id);
  return { species };
};
