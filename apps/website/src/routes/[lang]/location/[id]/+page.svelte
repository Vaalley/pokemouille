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
  const currentVersion = $derived(selectedVersion());
  const directoryHref = $derived(resolve(`${lang}/location/${currentVersion ? `?version=${encodeURIComponent(currentVersion)}` : ""}` as PathnameWithSearchOrHash));
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

<article class="location-detail">
  <p class="directory-link"><a href={directoryHref}><span aria-hidden="true">← </span>{t(lang, "back")}</a></p>
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

  <section class="encounter-section" aria-labelledby="{id}-heading">
    <h2 class="encounter-heading" id="{id}-heading">{game ? t(lang, "game", { game: gameName }) : encounters(lang, "heading")}</h2>
    <noscript><p class="state-message">{t(lang, "noscript")}</p></noscript>
    {#if failed}
      <div class="state-message">
        <p role="alert">{t(lang, "gamesFailed")}</p>
        <button type="button" onclick={() => void load()}>{t(lang, "retry")}</button>
      </div>
    {:else if !view || !game}
      <p class="state-message" role="status">{t(lang, "loading")}</p>
    {:else}
      {#if stateMessage}
        <p class="state-message">{stateMessage}</p>
      {:else}
        <p class="note rarity-note">{encounters(lang, "rarityNote")}</p>
        <details class="record-notes">
          <summary>{encounters(lang, "about")}</summary>
          <div>
            <p class="note">{encounters(lang, "defaultNote")}</p>
            <p class="note">{t(lang, "formsNote")}</p>
          </div>
        </details>
        <p class="note scroll-hint" id="{id}-scroll">{encounters(lang, "scrollHint")}</p>
        <div class="areas">
          {#each view.areas as area (area.area.id)}
            <details class="area" open aria-labelledby="{id}-area-{area.area.id}">
              <summary><h3 id="{id}-area-{area.area.id}"><Localized text={area.area.name} /></h3></summary>
              <div class="area-content">
                {#each area.methods as group (group.method.id)}
                  {@const label = t(lang, "table", { area: area.area.name.text, method: group.method.name.text })}
                  <section class="method" aria-labelledby="{id}-method-{area.area.id}-{group.method.id}">
                    <div class="method-heading">
                      <h4 id="{id}-method-{area.area.id}-{group.method.id}"><Localized text={group.method.name} /></h4>
                      <p>{encounters(lang, "rowCount", { count: group.rows.length })}</p>
                    </div>
                    <div class="table-scroll" role="region" aria-label={label} aria-describedby="{id}-scroll" tabindex="0">
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
                              <PokemonIcon speciesId={pokemon.speciesId} /><span class="pokemon-name"><Localized text={pokemon.name} /></span>
                            </a>
                          </th>
                          <td class="numeric">{row.minLevel === row.maxLevel ? row.minLevel : `${row.minLevel}–${row.maxLevel}`}</td>
                          <td class="numeric rarity">{row.slot.rarity}%</td>
                          <td>
                            {#if conditions.length > 0}
                              <ul class="conditions">
                                {#each conditions as condition (condition.id)}
                                  <li>
                                    <span class="condition-name"><Localized text={condition.condition.name} />:</span>
                                    <span class="condition-value"><Localized text={condition.name} /></span>
                                    <small class="condition-default">({encounters(lang, condition.isDefault ? "default" : "nonDefault")})</small>
                                  </li>
                                {/each}
                              </ul>
                            {:else}
                              <span class="unrecorded">{encounters(lang, "noConditions")}</span>
                            {/if}
                            {#if row.incompleteConditions}
                              <p class="note condition-warning">{encounters(lang, "incompleteConditions")}</p>
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
                  </section>
                {/each}
              </div>
            </details>
          {/each}
        </div>
      {/if}
      {#if otherGames.length > 0}
        <aside class="other-games" aria-labelledby="{id}-other-games">
          <h3 id="{id}-other-games">{t(lang, "otherGames")}</h3>
          <ul>
            {#each otherGames as other (other.version.id)}
              <li><a href={locationHref(other.version.identifier)}>{versionName(lang, other.version)}</a></li>
            {/each}
          </ul>
        </aside>
      {/if}
    {/if}
    <p class="note limits">{t(lang, "limits")}</p>
  </section>
</article>

<style>
  .location-detail, .encounter-section { min-width: 0; }
  .directory-link { margin-block: 0 0.75rem; }
  .directory-link a { display: inline-flex; align-items: center; min-height: 2.75rem; gap: 0.25rem; }
  .page-header { padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .page-header h1, .properties dd, .encounter-heading { min-width: 0; overflow-wrap: anywhere; }
  .page-header h1 { margin-block: 0.25rem 0.75rem; }
  .properties { margin-block-end: 0; gap: 0.375rem 0.75rem; }
  .encounter-heading { margin-block: 0 0.75rem; }
  .state-message { padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); max-width: var(--measure); }
  .state-message p { margin-block: 0 0.75rem; }
  .state-message button { min-height: 2.75rem; padding: 0.5rem 0.75rem; }
  .rarity-note { padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .record-notes { max-width: var(--measure); margin-block: 0.75rem; }
  .record-notes > summary { max-width: 100%; min-height: 2.75rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); cursor: pointer; font-size: var(--data-label-size); font-weight: 600; }
  .record-notes[open] > summary { border-inline-start-color: var(--accent); }
  .record-notes > div { padding-inline: 0.75rem; }
  .scroll-hint { margin-block: 1rem 0.75rem; }
  .areas { display: grid; gap: 1rem; }
  .area { min-width: 0; border: 0; border-block-end: var(--border-width) solid var(--border); border-radius: 0; background: var(--surface); }
  .area > summary { min-height: 2.75rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); cursor: pointer; background: var(--surface-muted); overflow-wrap: anywhere; }
  .area[open] > summary { border-inline-start-color: var(--accent); }
  .area > summary:hover { background: var(--accent-soft); }
  h3 { display: inline; margin: 0; font-size: 1rem; }
  .area-content { padding: 0 1rem 1rem; min-width: 0; }
  .method { min-width: 0; margin-block-start: 1rem; }
  .method-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.25rem 1rem; margin-block-end: 0.5rem; }
  h4 { margin: 0; overflow-wrap: anywhere; font-size: 1rem; }
  .method-heading p { margin: 0; color: var(--muted); font-size: var(--data-label-size); font-weight: 600; font-variant-numeric: tabular-nums; }
  .table-scroll { max-width: 100%; max-height: min(32rem, 70vh); overflow: auto; overscroll-behavior: contain; border-block: var(--border-width) solid var(--border); scrollbar-gutter: stable; }
  .table-scroll:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 3px; }
  table { width: 100%; min-width: 48rem; border-collapse: separate; border-spacing: 0; text-align: start; }
  th, td { padding: 0.625rem 0.75rem; vertical-align: top; border-block-end: 1px solid var(--border); }
  thead th { position: sticky; top: 0; z-index: 1; background: var(--surface-muted); border-block-end: var(--border-width) solid var(--border-strong); font-size: var(--data-label-size); font-weight: 600; }
  tbody tr:last-child > * { border-block-end: 0; }
  tbody tr:hover, tbody tr:focus-within { background: var(--accent-soft); }
  th[scope="row"] { font-weight: 600; min-width: 11rem; }
  th[scope="row"] a { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; }
  .pokemon-name { overflow-wrap: anywhere; }
  .numeric { white-space: nowrap; font-variant-numeric: tabular-nums; }
  .rarity { font-weight: 600; }
  .conditions { margin: 0; padding: 0; list-style: none; min-width: 13rem; }
  .conditions li + li { margin-block-start: 0.5rem; padding-block-start: 0.5rem; border-block-start: 1px solid var(--border); }
  .condition-name, .condition-default { display: block; font-size: var(--data-label-size); color: var(--muted); font-weight: 600; }
  .condition-value { font-weight: 600; }
  .condition-warning { margin-block: 0.5rem 0; border-inline-start: var(--data-rule) solid var(--border-strong); padding-inline-start: 0.5rem; }
  .unrecorded { color: var(--muted); font-size: 0.875rem; }
  .source { min-width: 10rem; }
  .source span, .source small { display: block; }
  .source small { margin-block-start: 0.25rem; color: var(--muted); }
  .other-games { margin-block-start: 1.25rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .other-games h3 { display: block; font-size: 1rem; }
  .other-games ul { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; list-style: none; margin-block: 0.25rem 0; padding: 0; }
  .other-games a { display: inline-flex; align-items: center; min-height: 2.75rem; }
  .note { font-size: 0.875rem; }
  .limits { margin-block-start: 1.25rem; padding-block-start: 1rem; border-block-start: var(--border-width) solid var(--border); }
  @media (max-width: 30rem) {
    .area > summary { padding: 0.75rem; }
    .area-content { padding: 0 0.5rem 0.5rem; }
  }
</style>
