<script lang="ts">
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    flavorText,
    game,
  }: {
    lang: Language;
    flavorText: ResolvedPokemon["flavorText"];
    /** The exact game the text was taken from (resolver context: exact version). */
    game: string;
  } = $props();

  // Game text keeps cartridge line breaks: soft-hyphen breaks join words; Japanese text
  // separates phrases with an ideographic space, other scripts with one space.
  const text = $derived.by(() => {
    if (flavorText.status !== "available") return null;
    const value = flavorText.value;
    const japanese = value.sourceLanguageId === 1 || value.sourceLanguageId === 11;
    return {
      ...value,
      text: value.text
        .replace(/\u00ad[\n\f]/g, "")
        .replace(/[\n\f\r]+/g, japanese ? "\u3000" : " ")
        .replace(/ {2,}/g, " "),
    };
  });
</script>

<section aria-labelledby="dex-heading">
  <h2 id="dex-heading">{t(lang, "dex.heading")}</h2>
  {#if text}
    <figure>
      <blockquote><p><Localized {text} /></p></blockquote>
      <figcaption>{t(lang, "dex.source", { game })}</figcaption>
    </figure>
  {:else if flavorText.status === "missing"}
    <p>{reasonText(lang, flavorText.reason)}</p>
  {/if}
</section>
