<script lang="ts">
  import type { LocalizedText } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { t } from "#lib/i18n/pokemon.ts";

  let { text }: { text: LocalizedText } = $props();

  // Source language IDs: 1 ja-Hrkt (kana), 5 fr, 9 en, 11 ja; null = canonical identifier.
  const SOURCE_TAGS: Record<number, string> = { 1: "ja-Hrkt", 5: "fr", 9: "en", 11: "ja" };
  const tag = $derived(
    text.sourceLanguageId === null ? undefined : SOURCE_TAGS[text.sourceLanguageId],
  );
  // Kana Japanese is still Japanese: only English and raw identifiers are flagged.
  const label = $derived(
    !text.fallback || text.sourceLanguageId === 1
      ? null
      : text.sourceLanguageId === null
        ? t(text.requestedLanguage, "fallback.identifier")
        : t(text.requestedLanguage, "fallback.english"),
  );
</script>

<span lang={tag === text.requestedLanguage ? undefined : tag}>{text.text}</span>{#if label}
  <small>({label})</small>{/if}
