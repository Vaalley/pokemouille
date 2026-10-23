<script lang="ts">
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/cries.ts";

  let { lang, cries }: { lang: Language; cries: ResolvedPokemon["cries"] } = $props();

  const sources = $derived([
    ...(cries.latest ? [{ id: "latest" as const, url: cries.latest }] : []),
    ...(cries.legacy && cries.legacy !== cries.latest
      ? [{ id: "legacy" as const, url: cries.legacy }]
      : []),
  ]);
  let selected = $state("latest");
  const source = $derived(sources.find((entry) => entry.id === selected) ?? sources[0]);
  let audio = $state<HTMLAudioElement>();
  let requested = $state(false);
  let failed = $state(false);
  let attempt = 0;

  // No src is attached until Play is requested. Changing source or destroying this
  // identity stops playback and releases the previous resource, including pending loads.
  $effect(() => {
    const url = source?.url;
    const player = audio;
    requested = false;
    failed = false;
    return () => {
      attempt += 1;
      if (player && url) {
        player.pause();
        player.removeAttribute("src");
        player.load();
      }
    };
  });

  function play() {
    if (!audio || !source) return;
    const player = audio;
    const request = ++attempt;
    failed = false;
    requested = true;
    player.src = source.url;
    player.load();
    void player.play().catch(() => {
      // A source switch/navigation aborts play(); it is not a playback failure
      // for the next source or identity.
      if (request === attempt) failed = true;
    });
  }
</script>

<section class="cries" aria-label={t(lang, "heading")}>
  <h2>{t(lang, "heading")}</h2>
  {#if source}
    {#if sources.length > 1}
      <label>
        <span class="visually-hidden">{t(lang, "source")}</span>
        <select bind:value={selected}>
          {#each sources as entry (entry.id)}
            <option value={entry.id}>{t(lang, entry.id)}</option>
          {/each}
        </select>
      </label>
    {:else}
      <p class="source">{t(lang, source.id)}</p>
    {/if}
    {#if !requested}
      <button type="button" onclick={play}>{t(lang, "play")}</button>
    {/if}
    <audio
      bind:this={audio}
      controls
      preload="none"
      hidden={!requested}
      aria-label={t(lang, "player", { source: t(lang, source.id) })}
      onerror={() => { if (requested && audio?.error) failed = true; }}
    ></audio>
    {#if failed}
      <p class="note" role="alert">{t(lang, "error")}</p>
      <div class="actions">
        <button type="button" onclick={play}>{t(lang, "retry")}</button>
        <a href={source.url} target="_blank" rel="noopener noreferrer">{t(lang, "open")}</a>
      </div>
    {/if}
    <details class="audio-details">
      <summary>{t(lang, "details")}</summary>
      <p class="note">{t(lang, "scope")}</p>
    </details>
  {:else}
    <p class="note">{t(lang, "missing")}</p>
  {/if}
</section>

<style>
  .cries {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.625rem;
    width: fit-content;
    max-width: 100%;
    padding: 0.5rem 0.625rem;
    border-inline-start: var(--data-rule) solid var(--border-strong);
    background: var(--surface-muted);
    min-width: 0;
  }

  h2, p {
    margin: 0;
  }

  h2 {
    font-size: var(--data-label-size);
    font-weight: 600;
  }

  .actions {
    flex-basis: 100%;
  }

  .audio-details {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 38rem;
    font-size: var(--data-label-size);
  }

  .audio-details summary {
    width: fit-content;
    min-height: 2.75rem;
    padding-block: 0.75rem;
    color: var(--muted);
    cursor: pointer;
  }

  .audio-details .note {
    margin-block: 0.25rem;
    line-height: 1.5;
  }

  .cries > .note {
    flex-basis: 100%;
    margin: 0;
  }

  label {
    display: grid;
    flex: 0 0 auto;
    gap: 0.25rem;
    min-width: 0;
    max-width: 100%;
  }

  label, .source {
    font-size: var(--data-label-size);
    font-weight: 600;
  }

  select {
    max-width: 100%;
    min-height: 2.75rem;
    padding: 0.375rem 0.5rem;
  }

  .source { padding: 0.5rem 0.625rem; background: var(--surface); }
  .actions a { display: inline-flex; align-items: center; min-height: 2.75rem; }

  audio {
    width: min(100%, 18rem);
    min-width: 0;
  }

  button {
    min-height: 2.75rem;
    padding-inline: 0.75rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
  }
</style>
