<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../../../packages/pokemon-data/src/index.ts";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { pokemonHref } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import { selectLocationEncounters } from "#lib/data/location-encounters.ts";
  import { t as encounters } from "#lib/i18n/encounters.ts";
  import { t } from "#lib/i18n/locations.ts";
  import { versionName } from "#lib/i18n/pokemon.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const lang = $derived(data.lang);
  const location = $derived(data.encounters);
  const id = $props.id();
  const selectedVersion = getSelectedVersion();
  let games = $state<GameOption[] | null>(null);
  let failed = $state(false);

  async function load() {
    failed = false;
    try {
      games = await getGames();
    } catch {
      failed = true;
    }
  }
  onMount(() => {
    void load();
  });

  const game = $derived(games?.find((entry) => entry.version.identifier === selectedVersion()) ?? null);
  const gameName = $derived(game ? versionName(lang, game.version) : "");
  const view = $derived(game ? selectLocationEncounters(location, game.version.id) : null);
  const stateMessage = $derived(view && view.status !== "rows" ? t(lang, `state.${view.status}`, { game: gameName }) : null);
  // Only selectable games can be linked; other source versions are not game choices.
  const otherGames = $derived.by(() => {
    if (!view || !games || !game) return [];
    const loaded = games;
    return view.versionIds
      .filter((versionId) => versionId !== game.version.id)
      .flatMap((versionId) => loaded.filter((entry) => entry.version.id === versionId));
  });

  function locationHref(version: string) {
    return resolve(`${lang}/location/${location.location.id}/?version=${encodeURIComponent(version)}` as PathnameWithSearchOrHash);
  }
</script>

<svelte:head>
  <title>{t(lang, "meta.title", { name: location.location.name.text })}</title>
  <meta name="description" content={t(lang, "meta.description", { name: location.location.name.text })} />
</svelte:head>

<article>
  <header class="page-header">
    <p class="kicker">{t(lang, "kind")}</p>
    <h1><Localized text={location.location.name} /></h1>
    <dl class="properties">
      <dt>{t(lang, "region")}</dt>
      <dd>
        {#if location.region}<Localized text={location.region.name} />{:else}{t(lang, "noRegion")}{/if}
      </dd>
    </dl>
  </header>

  <section aria-labelledby="{id}-heading">
    <h2 id="{id}-heading">{game ? t(lang, "game", { game: gameName }) : encounters(lang, "heading")}</h2>
    <noscript><p>{t(lang, "noscript")}</p></noscript>
    {#if failed}
      <p role="alert">{t(lang, "gamesFailed")}</p>
      <button type="button" onclick={() => void load()}>{t(lang, "retry")}</button>
    {:else if !view || !game}
      <p role="status">{t(lang, "loading")}</p>
    {:else}
      {#if stateMessage}
        <p>{stateMessage}</p>
      {:else}
        <p class="note">{encounters(lang, "rarityNote")}</p>
        <p class="note">{encounters(lang, "defaultNote")}</p>
        <p class="note">{t(lang, "formsNote")}</p>
        <div class="areas">
          {#each view.areas as area (area.area.id)}
            <section class="area" aria-labelledby="{id}-area-{area.area.id}">
              <h3 id="{id}-area-{area.area.id}"><Localized text={area.area.name} /></h3>
              {#each area.methods as group (group.method.id)}
                {@const label = t(lang, "table", { area: area.area.name.text, method: group.method.name.text })}
                <h4><Localized text={group.method.name} /></h4>
                <div class="table-scroll" role="region" aria-label={label} tabindex="0">
                  <table>
                    <caption class="visually-hidden">{label}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t(lang, "pokemon")}</th>
                        <th scope="col">{encounters(lang, "levels")}</th>
                        <th scope="col">{encounters(lang, "rarity")}</th>
                        <th scope="col">{encounters(lang, "conditions")}</th>
                        <th scope="col">{encounters(lang, "slot")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each group.rows as { row, pokemon, conditions } (row.id)}
                        <tr>
                          <th scope="row">
                            <a href={resolve(pokemonHref(lang, pokemon.speciesId, { version: game.version.identifier, form: pokemon.form }).slice(1) as PathnameWithSearchOrHash)}>
                              <PokemonIcon speciesId={pokemon.speciesId} /><Localized text={pokemon.name} />
                            </a>
                          </th>
                          <td class="numeric">{row.minLevel === row.maxLevel ? row.minLevel : `${row.minLevel}–${row.maxLevel}`}</td>
                          <td class="numeric">{row.slot.rarity}%</td>
                          <td>
                            {#if conditions.length > 0}
                              <ul class="conditions">
                                {#each conditions as condition (condition.id)}
                                  <li>
                                    <Localized text={condition.condition.name} />:
                                    <Localized text={condition.name} />
                                    <small>({encounters(lang, condition.isDefault ? "default" : "nonDefault")})</small>
                                  </li>
                                {/each}
                              </ul>
                            {:else}
                              {encounters(lang, "noConditions")}
                            {/if}
                            {#if row.incompleteConditions}
                              <p class="note">{encounters(lang, "incompleteConditions")}</p>
                            {/if}
                          </td>
                          <td class="source">
                            <span>{row.slot.slot === null ? encounters(lang, "slotUnknown") : encounters(lang, "slotNumber", { slot: row.slot.slot })}</span>
                            <small>{encounters(lang, "sourceSlot", { id: row.slot.id })} · {encounters(lang, "sourceRow", { id: row.id })}</small>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/each}
            </section>
          {/each}
        </div>
      {/if}
      {#if otherGames.length > 0}
        <p>
          {t(lang, "otherGames")}
          {#each otherGames as other, index (other.version.id)}
            {#if index > 0}, {/if}<a href={locationHref(other.version.identifier)}>{versionName(lang, other.version)}</a>
          {/each}
        </p>
      {/if}
    {/if}
    <p class="note limits">{t(lang, "limits")}</p>
  </section>
</article>

<style>
  .areas { display: grid; gap: 1.5rem; }
  .area { min-width: 0; }
  h3 { margin-block: 0 0.25rem; }
  h4 { margin-block: 0.75rem 0.5rem; }
  .table-scroll { max-width: 100%; overflow-x: auto; border: 1px solid var(--border, color-mix(in srgb, currentColor 20%, transparent)); border-radius: 0.5rem; }
  .table-scroll:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  table { width: 100%; min-width: 44rem; border-collapse: collapse; text-align: start; }
  th, td { padding: 0.625rem 0.75rem; vertical-align: top; }
  thead th { border-block-end: 1px solid color-mix(in srgb, currentColor 20%, transparent); }
  tbody tr + tr { border-block-start: 1px solid color-mix(in srgb, currentColor 15%, transparent); }
  th[scope="row"] { font-weight: normal; min-width: 11rem; }
  th[scope="row"] a { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; }
  .numeric { white-space: nowrap; font-variant-numeric: tabular-nums; }
  .conditions { margin: 0; padding-inline-start: 1.125rem; }
  .conditions li + li { margin-block-start: 0.25rem; }
  .source span, .source small { display: block; }
  .source small { margin-block-start: 0.25rem; }
  .note { font-size: 0.875rem; }
  .limits { margin-block-start: 1rem; }
</style>
