import type {
  Language,
  LocalizedText,
  Move,
  NamedResource,
  SearchEntry,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";

export type PokemonSearchEntry = SearchEntry & { kind: "pokemon"; id: number; key: string };
interface ResourceSearchEntryBase {
  id: number;
  key: string;
  name: LocalizedText;
  identifier: string;
  aliases: string[];
}
type ResourceSearchEntry = ResourceSearchEntryBase &
  ({ kind: "move"; typeId: number } | { kind: "ability" | "item" });
export type GlobalSearchEntry = PokemonSearchEntry | ResourceSearchEntry;

// Match Pokémon search's language policy: local names plus English/canonical aliases.
const ALIAS_LANGUAGES: Record<Language, ReadonlySet<number>> = {
  en: new Set([9]),
  fr: new Set([5, 9]),
  ja: new Set([11, 1, 9]),
};

export function buildSearchEntries(
  pokemon: readonly SearchEntry[],
  references: {
    moves: readonly Pick<Move, "id" | "identifier" | "names" | "typeId">[];
    abilities: readonly NamedResource[];
    items: readonly NamedResource[];
  },
  lang: Language,
): GlobalSearchEntry[] {
  const entries: GlobalSearchEntry[] = pokemon.map((entry) => ({
    ...entry,
    kind: "pokemon",
    id: entry.speciesId,
    key: `pokemon:${entry.pokemonId}:${entry.formId}`,
  }));
  const languages = ALIAS_LANGUAGES[lang];
  const resourceEntry = (kind: ResourceSearchEntry["kind"], resource: NamedResource) => ({
    id: resource.id,
    key: `${kind}:${resource.id}`,
    identifier: resource.identifier,
    name: localize(resource.names, lang, resource.identifier),
    aliases: [
      resource.identifier,
      ...resource.names
        .filter((row) => languages.has(row.languageId) && row.name.trim())
        .map((row) => row.name),
    ],
  });
  for (const move of references.moves) {
    entries.push({ ...resourceEntry("move", move), kind: "move", typeId: move.typeId });
  }
  for (const kind of ["ability", "item"] as const) {
    for (const resource of kind === "ability" ? references.abilities : references.items) {
      entries.push({ ...resourceEntry(kind, resource), kind });
    }
  }
  return entries;
}
