<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import { scrollable } from "#lib/actions/scrollable.ts";
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
        <li class:item-mapping={kind === "item"}>
          {#if kind === "move"}
            <a class="resource-link machine-link" href={resolve(`${lang}/item/${mapping.item.id}/?${new URLSearchParams({ version })}` as PathnameWithSearchOrHash)}>
              <ItemIcon identifier={mapping.item.identifier} /><span><Localized text={mapping.item.name} /></span>
            </a>
          {:else}
            {@const learners = data.pokemon.filter((entry) => mapping.pokemonIds.includes(entry.pokemonId))}
            <dl class="machine-association">
              <div>
                <dt>{t(lang, "machine")}</dt>
                <dd class="resource-link"><ItemIcon identifier={mapping.item.identifier} /><span><Localized text={mapping.item.name} /></span></dd>
              </div>
              <div>
                <dt>{t(lang, "teaches")}</dt>
                <dd>
                  <a class="resource-link" href={resolve(`${lang}/move/${mapping.move.id}/?${new URLSearchParams({ version })}` as PathnameWithSearchOrHash)}>
                    <MoveIcon typeId={mapping.move.typeId} /><span><Localized text={mapping.move.name} /></span>
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
              <div class="learner-region" role="region" aria-labelledby={`${id}-learners-${mapping.id}`} use:scrollable>
                <ul class="pokemon-list">
                  {#each learners as pokemon (pokemon.pokemonId)}
                    <li>
                      <a href={resolve(pokemonHref(lang, pokemon.speciesId, { version, form: pokemon.form }).slice(1) as PathnameWithSearchOrHash)}>
                        <PokemonIcon speciesId={pokemon.speciesId} /><span><Localized text={pokemon.name} /></span>
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
  section { min-width: 0; }
  .game-context { display: flex; flex-wrap: wrap; gap: 0.25rem 0.5rem; margin-block: 1rem; color: var(--muted); font-size: var(--data-label-size); }
  .game-context strong { color: var(--page-text); font-weight: 600; }
  .mapping-list { display: grid; gap: 1.5rem; list-style: none; padding: 0; margin-block: 1rem 0; }
  .mapping-list > li { min-width: 0; }
  .item-mapping + .item-mapping { padding-block-start: 1.5rem; border-block-start: 1px solid var(--border); }
  .move-mappings { grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr)); gap: 0 1.5rem; }
  .resource-link { display: inline-flex; align-items: center; gap: 0.5rem; max-width: 100%; vertical-align: middle; overflow-wrap: anywhere; font-weight: 600; }
  .resource-link > span, .pokemon-list a > span { min-width: 0; }
  .machine-link { display: flex; height: 100%; min-height: 2.75rem; padding: 0.625rem 0.25rem; border-block-end: 1px solid var(--border); text-decoration: none; }
  .machine-link:is(:hover, :focus-visible) { border-block-end-color: var(--accent); text-decoration: underline; text-underline-offset: 0.2em; }
  .machine-association { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); align-items: start; gap: 1rem 2rem; margin: 0; }
  .machine-association > div { min-width: 0; max-width: 100%; }
  .machine-association dt { margin-block-end: 0.375rem; color: var(--muted); font-size: var(--data-label-size); font-weight: 600; }
  .machine-association dd { min-width: 0; margin: 0; font-weight: 600; }
  .machine-association .resource-link { min-height: 2.75rem; }
  .learners-heading { margin-block: 1.25rem 0.75rem; font-size: var(--data-label-size); font-weight: 600; }
  .learners-heading span { color: var(--muted); font-size: inherit; font-weight: 500; font-variant-numeric: tabular-nums; }
  .learner-region { max-height: min(32rem, 65dvh); overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; padding: 0 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-control); }
  .pokemon-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr)); gap: 0 1.5rem; margin: 0; padding: 0; list-style: none; }
  .pokemon-list li { min-width: 0; }
  .pokemon-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; height: 100%; padding: 0.5rem 0.25rem; border-block-end: 1px solid var(--border); font-weight: 600; text-decoration: none; overflow-wrap: anywhere; }
  .pokemon-list a:is(:hover, :focus-visible) { border-block-end-color: var(--accent); text-decoration: underline; text-underline-offset: 0.2em; }
  .source-gap { max-width: var(--measure); color: var(--muted); font-size: var(--data-label-size); line-height: 1.6; }
</style>
