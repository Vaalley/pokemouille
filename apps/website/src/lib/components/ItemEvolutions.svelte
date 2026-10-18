<script lang="ts">
  import { onMount } from "svelte";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
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
    <p>{t(lang, "evolution.context")} <strong><Localized text={gameName} /></strong></p>
    {#each data.chains as entry (entry.key)}
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
    {/each}
  {/if}
</section>
