import type { Language, LocalizedText, Name } from "./types.ts";

export function assertLanguage(language: string): asserts language is Language {
  if (language !== "en" && language !== "fr" && language !== "ja")
    throw new Error(`Unknown language: ${language}`);
}

export function localize(
  rows: readonly Name[],
  language: Language,
  identifier: string,
): LocalizedText {
  const preferred = language === "ja" ? [11, 1, 9] : language === "fr" ? [5, 9] : [9];
  for (const languageId of preferred) {
    const row = rows.find((entry) => entry.languageId === languageId && entry.name.trim());
    if (row)
      return {
        text: row.name,
        requestedLanguage: language,
        sourceLanguageId: languageId,
        fallback: languageId !== preferred[0],
      };
  }
  return { text: identifier, requestedLanguage: language, sourceLanguageId: null, fallback: true };
}
