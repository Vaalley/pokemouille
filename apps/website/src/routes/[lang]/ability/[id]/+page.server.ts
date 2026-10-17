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
import { getRelatedPokemon } from "#lib/server/catalogue.ts";
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
  LANGUAGES.flatMap((lang) =>
    getReferences().abilities.map((ability) => ({ lang, id: String(ability.id) })),
  );

export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const lang = params.lang;
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== params.id) {
    error(404, "Unknown ability");
  }
  const refs = getReferences();
  const ability = refs.abilities.find((entry) => entry.id === id);
  if (!ability) error(404, "Unknown ability");

  // A flavor row belongs only to its exact version group, never a neighbouring game.
  const flavorRows = new Map<number, Name[]>();
  for (const row of ability.flavorTexts) {
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

  const historyRows = new Map<number, (LocalizedText | null)[]>();
  for (const change of ability.effectChanges) {
    const texts = historyRows.get(change.versionGroupId) ?? [];
    texts.push(
      localizeText(
        change.effects.map((row) => ({ languageId: row.languageId, name: row.effect })),
        lang,
      ),
    );
    historyRows.set(change.versionGroupId, texts);
  }
  const history = [...historyRows].map(([versionGroupId, texts]) => {
    const group = groups.get(versionGroupId);
    const games = refs.versions
      .filter((version) => version.versionGroupId === versionGroupId)
      .map((version) => localizeVersion(lang, version));
    return {
      versionGroupId,
      games: games.length
        ? games
        : [localize([], lang, group?.identifier ?? String(versionGroupId))],
      texts,
    };
  });
  history.sort(
    (a, b) =>
      (groups.get(a.versionGroupId)?.order ?? Infinity) -
        (groups.get(b.versionGroupId)?.order ?? Infinity) || a.versionGroupId - b.versionGroupId,
  );
  return {
    abilityId: ability.id,
    generationId: ability.generationId,
    related: await getRelatedPokemon("ability", ability.id, lang),
    name: localize(ability.names, lang, ability.identifier),
    effect: localizeText(
      ability.effects.map((row) => ({ languageId: row.languageId, name: row.effect })),
      lang,
    ),
    shortEffect: localizeText(
      ability.effects.map((row) => ({ languageId: row.languageId, name: row.shortEffect })),
      lang,
    ),
    descriptions,
    history,
  };
};
