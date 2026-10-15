import { assertLanguage, localize } from "./localization.ts";
import { pokemonName } from "./resolve.ts";
import type { Language, SearchEntry, SnapshotInput } from "./types.ts";

/** Language IDs whose names are searchable per UI language: the language's own variants plus
 * English aliases (ja: standard 11 and kana 1). Other languages are excluded on purpose.
 */
const ALIAS_LANGUAGES: Record<Language, ReadonlySet<number>> = {
  en: new Set([9]),
  fr: new Set([5, 9]),
  ja: new Set([11, 1, 9]),
};

/** Compact identities and aliases only. Ranking and interaction belong to the
 * consumer. Every variety/form stays linked to its owning species detail asset.
 */
export function buildSearchIndex(input: SnapshotInput, language: Language): SearchEntry[] {
  assertLanguage(language);
  const searchable = ALIAS_LANGUAGES[language];
  const entries: SearchEntry[] = [];
  for (const record of input.species) {
    const speciesName = localize(record.names, language, record.identifier);
    for (const variety of record.varieties) {
      for (const form of variety.forms.length ? variety.forms : [null]) {
        const name = pokemonName(record, variety, form, language);
        const aliases = new Set<string>([
          record.identifier,
          variety.identifier,
          String(record.id),
          name.text,
          speciesName.text,
        ]);
        for (const row of record.names)
          if (searchable.has(row.languageId) && row.name.trim()) aliases.add(row.name);
        if (form) {
          aliases.add(form.identifier);
          if (form.formIdentifier) aliases.add(form.formIdentifier);
          for (const row of [...form.names, ...form.formNames])
            if (searchable.has(row.languageId) && row.name.trim()) aliases.add(row.name);
        }
        entries.push({
          speciesId: record.id,
          pokemonId: variety.id,
          formId: form?.id ?? null,
          identifier: form?.identifier ?? variety.identifier,
          name,
          speciesName,
          aliases: [...aliases],
          generationId: record.generationId,
          introducedVersionGroupId: form?.versionGroupId ?? null,
          isDefault: variety.isDefault && (form?.isDefault ?? true),
        });
      }
    }
  }
  return entries;
}
