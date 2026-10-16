import { pokemonName } from "../../../../../packages/pokemon-data/src/resolve.ts";
import type {
  EvolutionChainProjection,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import type { EvolutionForm } from "#lib/data/evolution-tree.ts";
import { LANGUAGES } from "#lib/i18n/core.ts";
import type { Language } from "#lib/i18n/core.ts";

const FORM_CONDITIONS = ["evolved_pokemon_form_id", "required_pokemon_form_id"] as const;

/** Localized identities of every form an evolution condition in the chain names. */
export function projectEvolutionForms(
  chain: EvolutionChainProjection,
  records: readonly SpeciesRecord[],
): Record<Language, Record<number, EvolutionForm>> {
  const referenced = new Set<number>();
  for (const node of chain.nodes)
    for (const method of node.methods)
      for (const key of FORM_CONDITIONS) {
        const id = method.conditions[key];
        if (typeof id === "number") referenced.add(id);
      }
  const projected: Record<Language, Record<number, EvolutionForm>> = { en: {}, fr: {}, ja: {} };
  for (const record of records)
    for (const variety of record.varieties)
      for (const form of variety.forms) {
        if (!referenced.has(form.id)) continue;
        for (const lang of LANGUAGES)
          projected[lang][form.id] = {
            speciesId: record.id,
            identifier: form.identifier,
            separate: !variety.isDefault,
            versionGroupId: form.versionGroupId,
            name: pokemonName(record, variety, form, lang),
          };
      }
  return projected;
}
