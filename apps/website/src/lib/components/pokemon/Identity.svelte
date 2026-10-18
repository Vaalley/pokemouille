<script lang="ts">
  import type { Snippet } from "svelte";
  import type { LocalizedText, ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";
  import Cries from "./Cries.svelte";
  import { getSelectedSprite } from "../SpriteSelector.svelte";
  import { resolveMainSprite, spriteStyleName } from "#lib/data/sprite-preference.ts";
  import type { GameOption } from "../../../../../../packages/pokemon-data/src/index.ts";

  let {
    lang,
    speciesId,
    name,
    genus,
    generationId,
    isLegendary,
    isMythical,
    formName,
    artwork,
    sprites,
    games,
    pokemon,
    identityKey,
    children,
  }: {
    lang: Language;
    speciesId: number;
    name: LocalizedText;
    genus: LocalizedText | null;
    generationId: number;
    isLegendary: boolean;
    isMythical: boolean;
    /** Selected non-default form, once the game context has resolved. */
    formName: LocalizedText | null;
    /** Form artwork URL; `undefined` until the game/form context has resolved. */
    artwork: string | null | undefined;
    sprites: unknown;
    games: readonly GameOption[];
    pokemon: ResolvedPokemon | null;
    /** Current species/form URL identity, including while its data is loading. */
    identityKey: string;
    /** Page-level controls shown under the facts (game context, form picker). */
    children?: Snippet;
  } = $props();
  const selectedSprite = getSelectedSprite();
  const style = $derived(selectedSprite());
  const image = $derived(resolveMainSprite(sprites, artwork ?? null, style));
  let failedUrls = $state<string[]>([]);
  const preferredFailed = $derived(image.url !== null && failedUrls.includes(image.url));
  const imageUrl = $derived(preferredFailed ? (artwork && !failedUrls.includes(artwork) ? artwork : null) : image.url);
  const fallback = $derived(image.fallback || preferredFailed);
</script>

<header class="identity">
  <div class="summary">
    <h1>
      <Localized text={name} />
      {#if isMythical || isLegendary}
        <span class="rarity-badge" class:mythical={isMythical}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="m12 1 3.3 7.7L23 12l-7.7 3.3L12 23l-3.3-7.7L1 12l7.7-3.3Z" />
          </svg>
          {t(lang, isMythical ? "facts.mythical" : "facts.legendary")}
        </span>
      {/if}
    </h1>
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
    <div class="media">
      <figure>
        {#if imageUrl}
          <img
            src={imageUrl}
            alt={t(lang, "sprites.alt", { name: (formName ?? name).text, view: fallback ? t(lang, "sprites.official") : spriteStyleName(style, lang, games) })}
            width="240"
            height="240"
            class:pixelated={image.pixelated && !fallback}
            onerror={() => { if (imageUrl) failedUrls = [...failedUrls, imageUrl]; }}
          />
          <figcaption class="note" aria-live="polite">
            {fallback
              ? t(lang, "sprites.preferenceFallback", { style: spriteStyleName(style, lang, games) })
              : style.id === "official" ? t(lang, "identity.artworkNote") : spriteStyleName(style, lang, games)}
          </figcaption>
        {:else}
          <figcaption class="note">{t(lang, "sprites.mainMissing")}</figcaption>
        {/if}
      </figure>
      {#key `${identityKey}:${pokemon?.pokemonId}:${pokemon?.formId}`}
        {#if pokemon && pokemon.speciesId === speciesId}
          <Cries {lang} cries={pokemon.cries} />
        {/if}
      {/key}
    </div>
  {/if}
</header>

<style>
  .pixelated { image-rendering: pixelated; }
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

  h1 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
  }

  .rarity-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.3rem 0.625rem;
    border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
    border-radius: 999px;
    background: var(--legendary-background);
    color: var(--legendary);
    font-size: 0.75rem;
    font-weight: 650;
    line-height: 1.25;
    letter-spacing: 0.035em;
  }

  .rarity-badge.mythical {
    background: var(--mythical-background);
    color: var(--mythical);
  }

  .rarity-badge svg {
    flex-shrink: 0;
  }

  .media {
    grid-column: 2;
    min-width: 0;
  }

  figure {
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

    .media {
      grid-column: 1;
      max-width: 15rem;
      margin-inline: auto;
    }
  }
</style>
