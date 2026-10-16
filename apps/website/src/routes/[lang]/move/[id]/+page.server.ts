import { readFileSync } from "node:fs";
import { join } from "node:path";
import { error } from "@sveltejs/kit";
import { localize } from "../../../../../../../packages/pokemon-data/src/localization.ts";
import type {
  DatasetManifest,
  ReferenceData,
} from "../../../../../../../packages/pokemon-data/src/index.ts";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import { versionGroupName } from "#lib/i18n/pokemon.ts";
import { getRelatedPokemon } from "#lib/server/catalogue.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;
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

export const entries: EntryGenerator = () =>
  LANGUAGES.flatMap((lang) => getReferences().moves.map((move) => ({ lang, id: String(move.id) })));

export const load: PageServerLoad = async ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const lang = params.lang;
  const refs = getReferences();
  const move = refs.moves.find((row) => String(row.id) === params.id);
  if (!move) error(404, "Unknown move");
  const name = localize(move.names, lang, move.identifier);
  const type = refs.types.find((row) => row.id === move.typeId);
  const effect = (key: "effect" | "shortEffect") => {
    const text = localize(
      move.effects.map((row) => ({
        languageId: row.languageId,
        name: row[key].replaceAll(
          "$effect_chance",
          move.effectChance === null ? "?" : String(move.effectChance),
        ),
      })),
      lang,
      "",
    );
    return text.sourceLanguageId === null ? null : text;
  };
  return {
    id: move.id,
    related: await getRelatedPokemon("move", move.id, lang),
    name,
    generationId: move.generationId,
    typeId: move.typeId,
    type: type ? localize(type.names, lang, type.identifier) : null,
    damageClassId: move.damageClassId,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    priority: move.priority,
    effectChance: move.effectChance,
    effect: effect("effect"),
    shortEffect: effect("shortEffect"),
    descriptions: refs.versionGroups
      .toSorted((a, b) => a.order - b.order || a.id - b.id)
      .flatMap((group) => {
        const rows = move.flavorTexts.filter((row) => row.versionGroupId === group.id);
        if (rows.length === 0) return [];
        const text = localize(
          rows.map((row) => ({ languageId: row.languageId, name: row.text })),
          lang,
          "",
        );
        return text.sourceLanguageId === null
          ? []
          : [
              {
                id: group.id,
                games: versionGroupName(lang, refs.versions, group.id),
                text,
              },
            ];
      }),
  };
};
