<script lang="ts">
  import type { Snippet } from "svelte";
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
    children,
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
    /** Page-level controls shown under the facts (game context, form picker). */
    children?: Snippet;
  } = $props();
</script>

<header class="identity">
  <div class="summary">
    <h1><Localized text={name} /></h1>
    <dl class="properties">
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
    {@render children?.()}
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
        <figcaption class="note">{t(lang, "identity.artworkNote")}</figcaption>
      {:else}
        <figcaption class="note">{t(lang, "identity.artworkMissing")}</figcaption>
      {/if}
    </figure>
  {/if}
</header>

<style>
  /* The artwork keeps a fixed column so the facts don't move once it loads. */
  .identity {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 15rem;
    gap: 1rem 2rem;
    align-items: start;
  }

  .summary {
    min-width: 0;
  }

  figure {
    grid-column: 2;
    margin: 0;
    text-align: center;
  }

  figcaption {
    margin-block-start: 0.25rem;
  }

  @media (max-width: 40rem) {
    .identity {
      grid-template-columns: minmax(0, 1fr);
    }

    figure {
      grid-column: 1;
      max-width: 12rem;
      margin-inline: auto;
    }
  }
</style>
