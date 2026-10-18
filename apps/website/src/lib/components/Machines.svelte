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
      <p>{t(lang, "game")} <strong><Localized text={gameName} /></strong></p>
      {#if mappings.length === 0}<p>{t(lang, "empty")}</p>{/if}
    {/if}
  </div>
  {#if !failed && game && version}
    <ul class="mapping-list">
      {#each mappings as mapping (mapping.id)}
        <li>
          {#if kind === "move"}
            <a class="resource-link" href={resolve(`${lang}/item/${mapping.item.id}/?${new URLSearchParams({ version })}` as PathnameWithSearchOrHash)}>
              <ItemIcon identifier={mapping.item.identifier} /><Localized text={mapping.item.name} />
            </a>
          {:else}
            <p class="resource-link"><ItemIcon identifier={mapping.item.identifier} /><Localized text={mapping.item.name} /></p>
            <p>{t(lang, "teaches")}
              <a class="resource-link" href={resolve(`${lang}/move/${mapping.move.id}/?${new URLSearchParams({ version })}` as PathnameWithSearchOrHash)}>
                <MoveIcon typeId={mapping.move.typeId} /><Localized text={mapping.move.name} />
              </a>
            </p>
            <h3>{t(lang, "learners")}</h3>
            {#if mapping.pokemonIds.length === 0}
              <p>{t(lang, "noLearners")}</p>
            {:else}
              <ul class="pokemon-list">
                {#each data.pokemon.filter((entry) => mapping.pokemonIds.includes(entry.pokemonId)) as pokemon (pokemon.pokemonId)}
                  <li>
                    <a href={resolve(pokemonHref(lang, pokemon.speciesId, { version, form: pokemon.form }).slice(1) as PathnameWithSearchOrHash)}>
                      <PokemonIcon speciesId={pokemon.speciesId} /><Localized text={pokemon.name} />
                    </a>
                  </li>
                {/each}
              </ul>
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
  .mapping-list { list-style: none; padding: 0; }
  .mapping-list > li + li { margin-block-start: 1.5rem; }
  .resource-link { display: inline-flex; align-items: center; gap: 0.5rem; vertical-align: middle; }
  .pokemon-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr)); gap: 0.5rem; padding: 0; list-style: none; }
  .pokemon-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; padding: 0.25rem 0.5rem; border: 1px solid var(--border); border-radius: 0.5rem; overflow-wrap: anywhere; }
</style>
