import type { Language } from "../../../../../packages/pokemon-data/src/index.ts";

export type { Language };
export const LANGUAGES: readonly Language[] = ["en", "fr", "ja"];
export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "fr" || value === "ja";
}

/** Replace `{name}` placeholders. Unknown placeholders are left visible so gaps are noticed. */
function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * Build a typed translator from complete per-language dictionaries. The English dictionary
 * defines the key set; `satisfies Record<Language, Record<K, string>>` at the call site keeps
 * French and Japanese complete at compile time.
 */
export function createTranslator<K extends string>(
  dictionaries: Record<Language, Record<K, string>>,
) {
  return (lang: Language, key: K, params?: Record<string, string | number>): string =>
    interpolate(dictionaries[lang][key], params);
}
