<script lang="ts">
  import type { LocalizedText } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    speciesId,
    name,
    genus,
    generationId,
    formName,
    artwork,
  }: {
    lang: Language;
    speciesId: number;
    name: LocalizedText;
    genus: LocalizedText | null;
    generationId: number;
    /** Selected non-default form, once the game context has resolved. */
    formName: LocalizedText | null;
    /** Form artwork URL; `undefined` until the game/form context has resolved. */
    artwork: string | null | undefined;
  } = $props();
</script>

<header class="identity">
  <div>
    <h1><Localized text={name} /></h1>
    <dl>
      <dt>{t(lang, "identity.number")}</dt>
      <dd>{t(lang, "identity.numberValue", { number: speciesId })}</dd>
      {#if genus}
        <dt>{t(lang, "identity.genus")}</dt>
        <dd><Localized text={genus} /></dd>
      {/if}
      <dt>{t(lang, "identity.introduced")}</dt>
      <dd>{t(lang, "identity.generation", { number: generationId })}</dd>
      {#if formName}
        <dt>{t(lang, "identity.form")}</dt>
        <dd><Localized text={formName} /></dd>
      {/if}
    </dl>
  </div>
  {#if artwork !== undefined}
    <figure>
      {#if artwork}
        <img
          src={artwork}
          alt={t(lang, "identity.artworkAlt", { name: (formName ?? name).text })}
          width="240"
          height="240"
        />
        <figcaption>{t(lang, "identity.artworkNote")}</figcaption>
      {:else}
        <figcaption>{t(lang, "identity.artworkMissing")}</figcaption>
      {/if}
    </figure>
  {/if}
</header>

<style>
  .identity {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
  }

  figure {
    margin: 0;
    max-width: 15rem;
  }
</style>
