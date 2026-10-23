<script lang="ts">
  import { onMount } from "svelte";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import Evolution from "#lib/components/pokemon/Evolution.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { getGames } from "#lib/data/loader.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/item.ts";
  import { localizeVersion } from "#lib/i18n/pokemon.ts";
  import type { ItemEvolutionData } from "#lib/server/item-evolutions.ts";

  let { lang, data }: { lang: Language; data: ItemEvolutionData } = $props();
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
</script>

<section aria-labelledby={`${id}-heading`} aria-describedby={`${id}-scope`}>
  <h2 id={`${id}-heading`}>{t(lang, "evolution.heading")}</h2>
  <p class="note" id={`${id}-scope`}>{t(lang, "evolution.scope")}</p>
  {#if data.chains.length === 0}
    <p>{t(lang, "evolution.empty")}</p>
  {:else if failed || (games && version && !game)}
    <p role="alert">{t(lang, "evolution.error")}</p>
  {:else if !game || !gameName || !version}
    <p role="status">{t(lang, "evolution.loading")}</p>
  {:else}
    <p class="game-context">{t(lang, "evolution.context")} <strong><Localized text={gameName} /></strong></p>
    <div class="evolution-families">
    {#each data.chains as entry, index (entry.key)}
      <details class="evolution-family" open={index === 0}>
        <summary>
          {#each entry.chain.nodes as node, nodeIndex (node.speciesId)}
            {#if nodeIndex > 0}{" / "}{/if}<Localized text={localize(node.names, lang, node.identifier)} />
          {/each}
        </summary>
        <div class="family-body">
      <Evolution
        {lang}
        chain={entry.chain}
        forms={entry.forms}
        references={data.references}
        loading={false}
        failed={false}
        hasChain={true}
        speciesId={0}
        formId={null}
        {version}
        generationId={game.group.generationId}
        game={gameName.text}
        embedded
        methodsOpen
      />
        </div>
      </details>
    {/each}
    </div>
  {/if}
</section>

<style>
  section { min-width: 0; }
  .game-context { display: flex; flex-wrap: wrap; gap: 0.25rem 0.5rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--accent); background: var(--surface-muted); font-size: var(--data-label-size); }
  .evolution-families { display: grid; gap: 0.75rem; }
  .evolution-family { min-width: 0; border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
  summary { min-height: 2.75rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); font-size: var(--data-label-size); font-weight: 600; cursor: pointer; overflow-wrap: anywhere; }
  details[open] > summary { border-inline-start-color: var(--accent); border-block-end: var(--border-width) solid var(--border); }
  .family-body { min-width: 0; padding: 0 0.75rem 0.75rem; }
</style>
