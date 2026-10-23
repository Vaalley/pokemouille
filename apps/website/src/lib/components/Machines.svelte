<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import ItemIcon from "#lib/components/ItemIcon.svelte";
  import MoveIcon from "#lib/components/MoveIcon.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { pokemonHref } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import { machinesForGroup, type MachinesData } from "#lib/data/machines.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/machines.ts";
  import { localizeVersion } from "#lib/i18n/pokemon.ts";

  let { lang, kind, data }: {
    lang: Language;
    kind: "item" | "move";
    data: MachinesData;
  } = $props();
  const id = $props.id();
  const selectedVersion = getSelectedVersion();
  let games = $state<GameOption[] | null>(null);
  let failed = $state(false);
  onMount(() => {
    getGames().then(
      (loaded) => { games = loaded; },
      () => { failed = true; },
    );
  });
  const version = $derived(selectedVersion());
  const game = $derived(games?.find((entry) => entry.version.identifier === version) ?? null);
  const gameName = $derived(game ? localizeVersion(lang, game.version) : null);
  const mappings = $derived(game ? machinesForGroup(data, game.group.id) : []);
</script>

<section aria-labelledby={`${id}-heading`} aria-describedby={`${id}-scope`}>
  <h2 id={`${id}-heading`}>{t(lang, kind === "item" ? "item.heading" : "move.heading")}</h2>
  <p class="note" id={`${id}-scope`}>{t(lang, "scope")}</p>
  <noscript><p>{t(lang, "nojs")}</p></noscript>
  <div role="status" aria-live="polite" aria-atomic="true">
    {#if failed || (games && version && !game)}
      <p>{t(lang, "error")}</p>
    {:else if !game || !gameName || !version}
      <p>{t(lang, "loading")}</p>
    {:else}
      <p class="game-context">{t(lang, "game")} <strong><Localized text={gameName} /></strong></p>
      {#if mappings.length === 0}<p>{t(lang, "empty")}</p>{/if}
    {/if}
  </div>
  {#if !failed && game && version}
    <ul class="mapping-list" class:move-mappings={kind === "move"}>
      {#each mappings as mapping (mapping.id)}
        <li class:detail-panel={kind === "item"}>
          {#if kind === "move"}
            <a class="resource-link machine-link" href={resolve(`${lang}/item/${mapping.item.id}/?${new URLSearchParams({ version })}` as PathnameWithSearchOrHash)}>
              <ItemIcon identifier={mapping.item.identifier} /><Localized text={mapping.item.name} />
            </a>
          {:else}
            {@const learners = data.pokemon.filter((entry) => mapping.pokemonIds.includes(entry.pokemonId))}
            <dl class="machine-association">
              <div>
                <dt>{t(lang, "machine")}</dt>
                <dd class="resource-link"><ItemIcon identifier={mapping.item.identifier} /><Localized text={mapping.item.name} /></dd>
              </div>
              <div>
                <dt>{t(lang, "teaches")}</dt>
                <dd>
                  <a class="resource-link" href={resolve(`${lang}/move/${mapping.move.id}/?${new URLSearchParams({ version })}` as PathnameWithSearchOrHash)}>
                    <MoveIcon typeId={mapping.move.typeId} /><Localized text={mapping.move.name} />
                  </a>
                </dd>
              </div>
            </dl>
            <h3 id={`${id}-learners-${mapping.id}`} class="learners-heading">
              {t(lang, "learners")} <span>({learners.length})</span>
            </h3>
            {#if mapping.pokemonIds.length === 0}
              <p>{t(lang, "noLearners")}</p>
            {:else}
              <div class="learner-region" role="region" aria-labelledby={`${id}-learners-${mapping.id}`} tabindex="0">
                <ul class="pokemon-list">
                  {#each learners as pokemon (pokemon.pokemonId)}
                    <li>
                      <a href={resolve(pokemonHref(lang, pokemon.speciesId, { version, form: pokemon.form }).slice(1) as PathnameWithSearchOrHash)}>
                        <PokemonIcon speciesId={pokemon.speciesId} /><Localized text={pokemon.name} />
                      </a>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            {#if mapping.missingIntroduction > 0}
              <p class="source-gap">{t(lang, "sourceGap", { count: mapping.missingIntroduction })}</p>
            {/if}
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .game-context {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
    padding: var(--data-padding);
    border-inline-start: var(--data-rule) solid var(--accent);
    background: var(--surface-muted);
    font-size: var(--data-label-size);
  }
  .mapping-list { display: grid; gap: 0.75rem; list-style: none; padding: 0; }
  .mapping-list > li { min-width: 0; }
  .mapping-list > .detail-panel { padding: 0.75rem; background: var(--surface); }
  .move-mappings { grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr)); gap: 0.75rem; }
  .resource-link { display: inline-flex; align-items: center; gap: 0.5rem; max-width: 100%; vertical-align: middle; overflow-wrap: anywhere; font-weight: 600; }
  .machine-link {
    display: flex;
    height: 100%;
    min-height: 2.75rem;
    padding: var(--data-padding);
    border: 0;
    border-inline-start: var(--data-rule) solid var(--border-strong);
    border-radius: 0;
    background: var(--surface-muted);
    text-decoration: none;
  }
  .machine-link:is(:hover, :focus-visible) { border-inline-start-color: var(--accent); background: var(--accent-soft); text-decoration: underline; }
  .machine-association { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); align-items: start; gap: 0.75rem; margin: 0; }
  .machine-association > div { min-width: 0; max-width: 100%; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .machine-association dt { margin-block-end: 0.375rem; font-size: var(--data-label-size); font-weight: 600; }
  .machine-association dd { margin: 0; font-weight: 600; }
  .machine-association a { min-height: 2.75rem; }
  .learners-heading { margin-block: 1rem 0.625rem; font-size: var(--data-label-size); font-weight: 600; }
  .learners-heading span { color: var(--muted); font-size: inherit; font-weight: 600; font-variant-numeric: tabular-nums; }
  .learner-region {
    max-height: min(32rem, 65dvh);
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: 0.5rem;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-control);
    background: var(--surface);
  }
  .pokemon-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr)); gap: 0.375rem; margin: 0; padding: 0; list-style: none; }
  .pokemon-list li { min-width: 0; }
  .pokemon-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; height: 100%; padding: 0.375rem 0.625rem; border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); font-weight: 600; text-decoration: none; overflow-wrap: anywhere; }
  .pokemon-list a:is(:hover, :focus-visible) { border-inline-start-color: var(--accent); background: var(--accent-soft); text-decoration: underline; }
  .source-gap { padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); font-size: var(--data-label-size); }
</style>
