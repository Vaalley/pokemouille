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
    types,
    actions,
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
    /** Resolved game-specific types, grouped with the Pokémon's name. */
    types?: Snippet;
    /** Primary links beside the name, separate from contextual controls. */
    actions?: Snippet;
    /** Game context and form controls shown below the open hero. */
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
  <div class="profile">
    <p class="kicker">{t(lang, "identity.number")} {String(speciesId).padStart(4, "0")}</p>
    <div class="name-line">
      <h1><Localized text={name} /><span class="title-stop" aria-hidden="true">.</span></h1>
      {#if isMythical || isLegendary}
        <span class="rarity-badge" class:mythical={isMythical}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="m12 1 3.3 7.7L23 12l-7.7 3.3L12 23l-3.3-7.7L1 12l7.7-3.3Z" />
          </svg>
          {t(lang, isMythical ? "facts.mythical" : "facts.legendary")}
        </span>
      {/if}
    </div>
    {#if formName}
      <p class="selected-form"><span>{t(lang, "identity.form")}</span> <Localized text={formName} /></p>
    {/if}
    <dl class="identity-facts">
      {#if genus}
        <div>
          <dt class="visually-hidden">{t(lang, "identity.genus")}</dt>
          <dd><Localized text={genus} /></dd>
        </div>
      {/if}
      <div>
        <dt class="visually-hidden">{t(lang, "identity.introduced")}</dt>
        <dd>{t(lang, "identity.generation", { number: generationId })}</dd>
      </div>
    </dl>
    <div class="identity-types">{@render types?.()}</div>
    <div class="identity-actions">{@render actions?.()}</div>
  </div>

  <figure class="visual">
    <div class="portrait-stage">
      <span class="art-number" aria-hidden="true">{String(speciesId).padStart(4, "0")}</span>
      {#if artwork !== undefined && imageUrl}
        <img
          src={imageUrl}
          alt={t(lang, "sprites.alt", { name: (formName ?? name).text, view: fallback ? t(lang, "sprites.official") : spriteStyleName(style, lang, games) })}
          width="400"
          height="400"
          class:pixelated={image.pixelated && !fallback}
          onerror={() => { if (imageUrl) failedUrls = [...failedUrls, imageUrl]; }}
        />
      {/if}
    </div>
    {#if artwork !== undefined}
      <figcaption class="note" aria-live="polite">
        {#if imageUrl}
          {fallback
            ? t(lang, "sprites.preferenceFallback", { style: spriteStyleName(style, lang, games) })
            : style.id === "official" ? t(lang, "identity.artworkNote") : spriteStyleName(style, lang, games)}
        {:else}
          {t(lang, "sprites.mainMissing")}
        {/if}
      </figcaption>
    {/if}
  </figure>

  <div class="controls">
    {@render children?.()}
    <div class="audio">
      {#key `${identityKey}:${pokemon?.pokemonId}:${pokemon?.formId}`}
        {#if pokemon && pokemon.speciesId === speciesId}
          <Cries {lang} cries={pokemon.cries} />
        {/if}
      {/key}
    </div>
  </div>
</header>

<style>
  .identity {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    align-items: center;
    gap: 1.5rem 2rem;
  }
  .profile { min-width: 0; padding-block: 2rem; }
  .kicker {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.5rem;
    color: var(--muted);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    font-variant-numeric: tabular-nums;
  }
  .kicker::before { content: ""; width: 0.375rem; height: 0.375rem; flex-shrink: 0; background: var(--accent); }
  .name-line { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(3rem, 6.8vw, 7rem);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.025em;
    overflow-wrap: anywhere;
    max-width: 100%;
  }
  .title-stop { color: var(--accent); }
  .selected-form { margin: 0.75rem 0 0; color: var(--accent); font-size: 0.875rem; overflow-wrap: anywhere; }
  .selected-form > span { color: var(--muted); margin-inline-end: 0.5rem; font-size: 0.75rem; }
  .identity-facts { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin: 1.25rem 0; color: var(--muted); font-size: 0.875rem; }
  .identity-facts > div { min-width: 0; }
  .identity-facts > div + div { padding-inline-start: 1rem; border-inline-start: 1px solid var(--border); }
  .identity-facts dd { margin: 0; overflow-wrap: anywhere; }
  .identity-types { min-width: 0; }
  .identity-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; margin-block-start: 1.75rem; }
  .identity-actions:empty { display: none; }
  .visual { min-width: 0; margin: 0; text-align: center; }
  .portrait-stage { display: grid; place-items: center; position: relative; overflow: clip; container-type: inline-size; width: 100%; aspect-ratio: 1; max-width: 26rem; margin-inline: auto; }
  .art-number { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font: 400 46cqw/1 var(--font-display); letter-spacing: -0.08em; color: color-mix(in srgb, var(--page-text) 9%, transparent); }
  .portrait-stage img { position: relative; display: block; width: 100%; height: 100%; object-fit: contain; }
  .pixelated { image-rendering: pixelated; }
  figcaption { max-width: 38ch; margin: 0.5rem auto 0; font-size: 0.6875rem; line-height: 1.5; overflow-wrap: anywhere; }
  .controls { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); align-items: center; grid-column: 1 / -1; gap: 1.25rem 2rem; min-width: 0; padding-block: 1.25rem; border-block: 1px solid var(--border); }
  .audio { min-width: 0; }
  .audio :global(.cries) { border: 0; padding: 0; }
  .audio :global(.cries h2) { color: var(--muted); font: 500 0.75rem/1.5 var(--font-body); }
  .audio :global(.audio-details) { font-size: 0.6875rem; }
  .rarity-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.625rem; border: 1px solid color-mix(in srgb, currentColor 30%, transparent); border-radius: var(--radius-pill); background: var(--legendary-background); color: var(--legendary); font-size: 0.75rem; font-weight: 600; line-height: 1.25; }
  .rarity-badge.mythical { background: var(--mythical-background); color: var(--mythical); }
  .rarity-badge svg { flex-shrink: 0; }
  @media (max-width: 70rem) {
    .controls { grid-template-columns: minmax(0, 1fr); }
    .audio { max-width: 30rem; }
  }
  @media (max-width: 44rem) {
    .identity { grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
    .profile { padding-block: 1rem 0; }
    h1 { font-size: clamp(2.5rem, 14vw, 4.5rem); }
    .kicker { margin-block-end: 1rem; }
    .identity-actions { gap: 0.75rem 1rem; margin-block-start: 1.25rem; }
    .portrait-stage { max-width: 18rem; }
    .audio { max-width: none; }
  }
  @media (forced-colors: active) {
    .art-number { display: none; }
  }
</style>
