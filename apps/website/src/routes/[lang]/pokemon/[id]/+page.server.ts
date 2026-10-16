import { readFileSync } from "node:fs";
import { join } from "node:path";
import { error } from "@sveltejs/kit";
import { localize } from "../../../../../../../packages/pokemon-data/src/localization.ts";
import type {
  DatasetManifest,
  EvolutionChainProjection,
  LocalizedText,
  SearchEntry,
  SpeciesRecord,
} from "../../../../../../../packages/pokemon-data/src/index.ts";
import type { EvolutionForm } from "#lib/data/evolution-tree.ts";
import { projectEvolutionForms } from "#lib/server/evolution-forms.ts";
import { LANGUAGES, isLanguage } from "#lib/i18n/core.ts";
import type { Language } from "#lib/i18n/core.ts";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const prerender = true;

// Prerendering runs with cwd = apps/website; the published dataset is a static asset.
const DATA_DIR = join(process.cwd(), "static", "data");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, path), "utf8")) as T;
}

// Every lang × species page shares these reads, so parse each file once per build.
let manifest: DatasetManifest | undefined;
function getManifest(): DatasetManifest {
  manifest ??= readJson<DatasetManifest>("manifest.json");
  return manifest;
}

interface SpeciesIdentity {
  speciesId: number;
  name: LocalizedText;
  generationId: number;
}
interface LanguageIndex {
  ordered: SpeciesIdentity[];
  positions: Record<number, number>;
}
const languageIndexes: Partial<Record<Language, LanguageIndex>> = {};
function languageIndex(lang: Language): LanguageIndex {
  let index = languageIndexes[lang];
  if (!index) {
    const ordered = readJson<SearchEntry[]>(getManifest().files.search[lang].path)
      .filter((entry) => entry.isDefault)
      .map((entry) => ({
        speciesId: entry.speciesId,
        name: entry.speciesName,
        generationId: entry.generationId,
      }))
      .sort((a, b) => a.speciesId - b.speciesId);
    const positions: Record<number, number> = {};
    ordered.forEach((entry, position) => {
      positions[entry.speciesId] = position;
    });
    index = { ordered, positions };
    languageIndexes[lang] = index;
  }
  return index;
}

// Species files are large; keep only what pages need, shared by all three languages.
const species: Record<number, Pick<SpeciesRecord, "genera" | "evolutionChainId">> = {};
function speciesSummary(speciesId: number, path: string) {
  if (!species[speciesId]) {
    const { genera, evolutionChainId } = readJson<SpeciesRecord>(path);
    species[speciesId] = { genera, evolutionChainId };
  }
  return species[speciesId];
}

const evolutionForms = new Map<number, Record<Language, Record<number, EvolutionForm>>>();
function chainForms(chainId: number) {
  let forms = evolutionForms.get(chainId);
  if (!forms) {
    const files = getManifest().files;
    const chain = readJson<EvolutionChainProjection>(files.evolution[String(chainId)]!.path);
    const records = chain.nodes.map((node) =>
      readJson<SpeciesRecord>(files.pokemon[String(node.speciesId)]!.path),
    );
    forms = projectEvolutionForms(chain, records);
    evolutionForms.set(chainId, forms);
  }
  return forms;
}

export const entries: EntryGenerator = () => {
  const ids = Object.keys(getManifest().files.pokemon);
  return LANGUAGES.flatMap((lang) => ids.map((id) => ({ lang, id })));
};

// Only game- and form-independent identity: a static page cannot know the visitor's game.
export const load: PageServerLoad = ({ params }) => {
  if (!isLanguage(params.lang)) error(404, "Unknown language");
  const index = languageIndex(params.lang);
  const speciesId = Number(params.id);
  const position = String(speciesId) === params.id ? index.positions[speciesId] : undefined;
  const asset = getManifest().files.pokemon[params.id];
  if (position === undefined || !asset) error(404, "Unknown Pokémon");
  const identity = index.ordered[position]!;
  const summary = speciesSummary(speciesId, asset.path);
  const genus = localize(summary.genera, params.lang, "");
  return {
    speciesId,
    name: identity.name,
    genus: genus.sourceLanguageId === null ? null : genus,
    generationId: identity.generationId,
    previous: index.ordered[position - 1] ?? null,
    next: index.ordered[position + 1] ?? null,
    evolutionForms:
      summary.evolutionChainId === null ? {} : chainForms(summary.evolutionChainId)[params.lang],
  };
};
