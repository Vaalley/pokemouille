import { readFileSync } from "node:fs";
import { join } from "node:path";
import { error } from "@sveltejs/kit";
import { localize } from "../../../../../../../packages/pokemon-data/src/localization.ts";
import type {
  DatasetManifest,
  LocalizedText,
  Name,
  ReferenceData,
} from "../../../../../../../packages/pokemon-data/src/index.ts";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import type { Language } from "#lib/i18n/core.ts";
import { localizeVersion } from "#lib/i18n/pokemon.ts";
import { getItemEvolutions } from "#lib/server/item-evolutions.ts";
import { getRelatedPokemon } from "#lib/server/catalogue.ts";
import { projectMachines } from "#lib/data/machines.ts";
import type { RelatedPokemonData } from "#lib/data/catalogue.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;

// Prerendering runs in apps/website; all detail content comes from the static dataset.
const DATA_DIR = join(process.cwd(), "static", "data");

let references: ReferenceData | undefined;
function getReferences(): ReferenceData {
  if (!references) {
    const manifest = JSON.parse(
      readFileSync(join(DATA_DIR, "manifest.json"), "utf8"),
    ) as DatasetManifest;
    references = JSON.parse(
      readFileSync(join(DATA_DIR, manifest.files.references.path), "utf8"),
    ) as ReferenceData;
  }
  return references;
}

function localizeText(rows: Name[], lang: Language): LocalizedText | null {
  const text = localize(rows, lang, "");
  return text.sourceLanguageId === null ? null : text;
}

export const entries: EntryGenerator = () =>
  LANGUAGES.flatMap((lang) => getReferences().items.map((item) => ({ lang, id: String(item.id) })));

export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const lang = params.lang;
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== params.id) {
    error(404, "Unknown item");
  }
  const refs = getReferences();
  const item = refs.items.find((entry) => entry.id === id);
  if (!item) error(404, "Unknown item");

  // Source descriptions belong only to their exact version group.
  const flavorRows = new Map<number, Name[]>();
  for (const row of item.flavorTexts) {
    const names = flavorRows.get(row.versionGroupId) ?? [];
    names.push({ languageId: row.languageId, name: row.text });
    flavorRows.set(row.versionGroupId, names);
  }
  const groups = new Map(refs.versionGroups.map((group) => [group.id, group]));
  const descriptions = [...flavorRows].map(([versionGroupId, rows]) => {
    const group = groups.get(versionGroupId);
    const games = refs.versions
      .filter((version) => version.versionGroupId === versionGroupId)
      .map((version) => localizeVersion(lang, version));
    return {
      versionGroupId,
      games: games.length
        ? games
        : [localize([], lang, group?.identifier ?? String(versionGroupId))],
      text: localizeText(rows, lang),
    };
  });
  descriptions.sort(
    (a, b) =>
      (groups.get(a.versionGroupId)?.order ?? a.versionGroupId) -
        (groups.get(b.versionGroupId)?.order ?? b.versionGroupId) ||
      a.versionGroupId - b.versionGroupId,
  );

  const machineMoves = new Set(
    refs.machines.filter((row) => row.itemId === item.id).map((row) => row.moveId),
  );
  const machineRelations = new Map<number, RelatedPokemonData>();
  await Promise.all(
    [...machineMoves].map(async (moveId) => {
      machineRelations.set(moveId, await getRelatedPokemon("move", moveId, lang));
    }),
  );

  return {
    itemId: item.id,
    identifier: item.identifier,
    name: localize(item.names, lang, item.identifier),
    effect: localizeText(
      item.effects.map((row) => ({ languageId: row.languageId, name: row.effect })),
      lang,
    ),
    shortEffect: localizeText(
      item.effects.map((row) => ({ languageId: row.languageId, name: row.shortEffect })),
      lang,
    ),
    descriptions,
    evolutions: await getItemEvolutions(item.id, lang),
    machines: projectMachines(refs, lang, { kind: "item", id: item.id }, machineRelations),
  };
};
