<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { asset, resolve } from "$app/paths";
  import type { AssetPath, PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../../packages/pokemon-data/src/localization.ts";
  import { scrollable } from "#lib/actions/scrollable.ts";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import TypeBadge from "#lib/components/TypeBadge.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { pokemonHref } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import {
    attackSelectionUrl,
    combinationKey,
    defendingChart,
    existingCombinations,
    formatMultiplier,
    readAttackSelection,
    resistantCombinations,
    theoreticalCombinations,
    typeCoverage,
  } from "#lib/data/type-coverage.ts";
  import { isIntroduced } from "#lib/data/type-matchups.ts";
  import { typesHref } from "#lib/data/type-selection.ts";
  import { t } from "#lib/i18n/type-coverage.ts";
  import { t as matchupText } from "#lib/i18n/types.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let mounted = $state(false);
  let games = $state<GameOption[] | null>(null);
  let failed = $state(false);
  let theoretical = $state(false);
  // Long Pokémon lists render only once their bucket is opened.
  let open = $state<Record<number, boolean>>({});
  const selectedVersion = getSelectedVersion();
  const id = $props.id();
  // Kit 3 keeps shallow history in page.shallow without replacing page.url.
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  // Prerendered HTML cannot know query parameters: hydrate before reading them.
  const selection = $derived(readAttackSelection(mounted ? new URL(currentUrl.href).searchParams : new URLSearchParams()));
  const game = $derived(games?.find((entry) => entry.version.identifier === selectedVersion()));
  const generation = $derived(game?.group.generationId);
  const types = $derived(data.types.filter((type) => type.id >= 1 && type.id <= 18));
  const chartTypes = $derived(generation ? types.filter((type) => isIntroduced(type.id, generation)) : []);
  const coverage = $derived(game && !selection.invalid ? typeCoverage(data.typeMembers, selection.ids, game.group) : null);
  const existing = $derived(game ? existingCombinations(data.typeMembers, game.group) : []);
  const resistant = $derived(coverage && generation ? resistantCombinations(existing, selection.ids, generation) : []);
  const chart = $derived(generation ? defendingChart(theoretical ? theoreticalCombinations(generation) : existing, generation) : []);

  async function load() {
    failed = false;
    try {
      games = await getGames();
    } catch {
      failed = true;
    }
  }
  onMount(() => { mounted = true; void load(); });
  function name(typeId: number) {
    const type = types.find((entry) => entry.id === typeId);
    return localize(type?.names ?? [], data.lang, type?.identifier ?? String(typeId));
  }
  function update(ids: number[]) {
    const url = attackSelectionUrl(new URL(currentUrl.href), ids);
    const version = selectedVersion();
    if (version) url.searchParams.set("version", version);
    if (url.href !== currentUrl.href) pushState(url, page.state);
  }
  function toggle(typeId: number, checked: boolean) {
    update(checked ? [...selection.ids, typeId] : selection.ids.filter((entry) => entry !== typeId));
  }
</script>

<svelte:head><title>{t(data.lang, "heading")} | Pokémouille</title></svelte:head>
<p><a href={resolve(typesHref(data.lang, [], selectedVersion()) as PathnameWithSearchOrHash)}>{t(data.lang, "back")}</a></p>
<h1>{t(data.lang, "heading")}</h1>
<p>{t(data.lang, "intro")}</p>
<form class="selection-panel" onsubmit={(event) => event.preventDefault()} aria-label={t(data.lang, "heading")}>
  <fieldset class="attack-types">
    <legend>{t(data.lang, "attackLegend")}</legend>
    <div class="attack-options">
      {#each types as type (type.id)}
        {@const checked = selection.ids.includes(type.id)}
        <label class:chosen={checked}>
          <input type="checkbox" name="attack" value={type.id} {checked}
            disabled={!mounted || !generation || (!checked && !isIntroduced(type.id, generation))}
            onchange={(event) => toggle(type.id, event.currentTarget.checked)} />
          <img src={asset(`/type-icons/${type.identifier}.svg` as AssetPath)} alt="" width="22" height="22" />
          <span><Localized text={name(type.id)} /></span>
        </label>
      {/each}
    </div>
  </fieldset>
  <div class="filters">
    <button type="button" disabled={!mounted || (!selection.ids.length && !selection.invalid)} onclick={() => update([])}>{t(data.lang, "reset")}</button>
  </div>
</form>

{#if !mounted}
  <p role="status">{t(data.lang, "loading")}</p>
  <noscript><p>{t(data.lang, "javascript")}</p></noscript>
{:else if failed}
  <p role="alert">{t(data.lang, "error")}</p>
  <button type="button" onclick={() => void load()}>{t(data.lang, "retry")}</button>
{:else if !game || !generation}
  <p role="status">{t(data.lang, "loading")}</p>
{:else}
  <section class="result-panel" aria-labelledby={`${id}-coverage`}>
    <h2 id={`${id}-coverage`}>{t(data.lang, "coverageHeading")}</h2>
    {#if selection.invalid}
      <p role="status">{t(data.lang, "invalid")}</p>
    {:else if !selection.ids.length}
      <p role="status">{t(data.lang, "empty")}</p>
    {:else if !coverage}
      <p role="status">{t(data.lang, "unavailable")}</p>
    {:else}
      <p class="note">{t(data.lang, "coverageScope", { generation })}</p>
      <h3>{t(data.lang, "bucketsLabel")}</h3>
      <dl class="figures" aria-live="polite">
        {#each coverage.buckets as bucket (bucket.multiplier)}
          <div data-effect={bucket.multiplier === 0 ? "immune" : bucket.multiplier < 1 ? "resisted" : bucket.multiplier > 1 ? "weak" : "neutral"}>
            <dt><span class="multiplier">{formatMultiplier(bucket.multiplier)}</span></dt>
            <dd>{t(data.lang, "bucketCount", { count: bucket.members.length })}</dd>
          </div>
        {/each}
      </dl>
      {#if coverage.missingIntroduction}
        <p class="note">{t(data.lang, "introductionGap", { count: coverage.missingIntroduction })}</p>
      {/if}
      {#if coverage.missingTypes}
        <p class="note">{t(data.lang, "typeGap", { count: coverage.missingTypes })}</p>
      {/if}
      {#each coverage.buckets as bucket (bucket.multiplier)}
        {#if bucket.members.length}
          <details bind:open={open[bucket.multiplier]}>
            <summary>
              <span class="bucket-label" data-effect={bucket.multiplier === 0 ? "immune" : bucket.multiplier < 1 ? "resisted" : bucket.multiplier > 1 ? "weak" : "neutral"}>
                <span class="multiplier">{formatMultiplier(bucket.multiplier)}</span>
                <span>{t(data.lang, "bucketCount", { count: bucket.members.length })}</span>
              </span>
            </summary>
            {#if open[bucket.multiplier]}
              <ul class="species-list">
                {#each bucket.members as pokemon (`${pokemon.pokemonId}:${pokemon.form ?? ""}`)}
                  <li>
                    <a href={resolve(pokemonHref(data.lang, pokemon.speciesId, {
                      version: game.version.identifier, form: pokemon.form,
                    }).slice(1) as PathnameWithSearchOrHash)}>
                      <PokemonIcon speciesId={pokemon.speciesId} />
                      <span><Localized text={pokemon.name} /></span>
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          </details>
        {/if}
      {/each}

      <h3>{t(data.lang, "resistHeading")}</h3>
      <p class="note">{t(data.lang, "resistScope")}</p>
      {#if resistant.length}
        <ul class="combinations">
          {#each resistant as row (combinationKey(row.types))}
            <li data-effect={row.multiplier === 0 ? "immune" : "resisted"}>
              {#each row.types as typeId (typeId)}
                <TypeBadge {typeId} name={name(typeId)} defendingTypes={row.types} />
              {/each}
              <strong class="multiplier">{formatMultiplier(row.multiplier)}</strong>
            </li>
          {/each}
        </ul>
      {:else}
        <p>{t(data.lang, "resistNone")}</p>
      {/if}
    {/if}
  </section>

  <section class="result-panel chart-panel" aria-labelledby={`${id}-chart`}>
    <h2 id={`${id}-chart`}>{t(data.lang, "chartHeading")}</h2>
    <p class="note">{t(data.lang, "chartScope", { generation })}</p>
    <ul class="chart-legend" aria-label={matchupText(data.lang, "heading")}>
      <li data-effect="weak"><span class="multiplier">×2 / ×4</span><span>{matchupText(data.lang, "weaknesses")}</span></li>
      <li data-effect="neutral"><span class="multiplier">×1</span><span>{matchupText(data.lang, "neutral")}</span></li>
      <li data-effect="resisted"><span class="multiplier">×½ / ×¼</span><span>{matchupText(data.lang, "resistances")}</span></li>
      <li data-effect="immune"><span class="multiplier">×0</span><span>{matchupText(data.lang, "immunities")}</span></li>
    </ul>
    <label class="toggle">
      <input type="checkbox" bind:checked={theoretical} />
      {t(data.lang, "theoretical")}
    </label>
    <p class="result-count" role="status" aria-live="polite">
      {theoretical
        ? t(data.lang, "theoreticalCount", { count: chart.length, generation })
        : t(data.lang, "existingCount", { count: chart.length })}
    </p>
    <p class="note chart-navigation" id={`${id}-chart-navigation`}>{matchupText(data.lang, "chartNavigation")}</p>
    <div class="table-scroll chart-scroll" role="region" aria-labelledby={`${id}-chart-caption`} aria-describedby={`${id}-chart-navigation`} use:scrollable>
      <table class="chart">
        <caption id={`${id}-chart-caption`}>{t(data.lang, "chartCaption", { generation })}</caption>
        <thead>
          <tr>
            <th scope="col">{t(data.lang, "defending")}</th>
            {#each chartTypes as type (type.id)}
              <th scope="col" class:selected={selection.ids.includes(type.id)}>
                <span class="attack-head">
                  <img src={asset(`/type-icons/${type.identifier}.svg` as AssetPath)} alt="" width="22" height="22" />
                  <span><Localized text={name(type.id)} /></span>
                </span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each chart as row (combinationKey(row.types))}
            <tr>
              <th scope="row">
                <a href={resolve(typesHref(data.lang, row.types, game.version.identifier) as PathnameWithSearchOrHash)}>
                  {#each row.types as typeId, index (typeId)}{#if index} / {/if}<Localized text={name(typeId)} />{/each}
                </a>
              </th>
              {#each row.multipliers as cell (cell.typeId)}
                <td class="numeric" class:selected={selection.ids.includes(cell.typeId)}
                  data-effect={cell.multiplier === 0 ? "immune" : cell.multiplier < 1 ? "resisted" : cell.multiplier > 1 ? "weak" : "neutral"}>
                  <span class="multiplier">{formatMultiplier(cell.multiplier)}</span>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{/if}

<style>
  .selection-panel { min-width: 0; margin-block: 1.5rem; padding: var(--data-padding); border: 0; border-inline-start: var(--data-rule) solid var(--border-strong); border-radius: 0; background: var(--surface-muted); }
  .attack-types { min-width: 0; margin: 0; padding: 0; border: 0; }
  legend { max-width: 100%; padding: 0; margin-block-end: 0.75rem; font-size: var(--data-label-size); font-weight: 600; overflow-wrap: anywhere; }
  .attack-options { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 9rem), 1fr)); gap: 0.4rem; }
  .attack-options label, .toggle { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; cursor: pointer; }
  .attack-options label { min-width: 0; padding: 0.4rem 0.5rem; border: 0; border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface); border-radius: 0; font-size: var(--data-label-size); font-weight: 600; }
  .attack-options label > span { min-width: 0; overflow-wrap: anywhere; }
  .attack-options label > img { flex: 0 0 22px; }
  .attack-options label.chosen { border-inline-start-color: var(--accent); background: var(--accent-soft); font-weight: 700; }
  .attack-options label:has(input:focus-visible) { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
  .attack-options label:has(input:disabled) { color: var(--muted); border-inline-start-style: dashed; cursor: not-allowed; }
  input[type="checkbox"] { flex: 0 0 1.25rem; width: 1.25rem; height: 1.25rem; margin: 0; }
  .selection-panel .filters { margin: 1rem 0 0; }
  .filters button { max-width: 100%; }
  .result-panel { min-width: 0; margin-block: 1.5rem; padding-block-start: 0.75rem; border-block-start: var(--border-width) solid var(--border); }
  .result-panel > h2 { margin-block: 0 0.75rem; font-size: 1.25rem; overflow-wrap: anywhere; }
  .result-panel > h3 { overflow-wrap: anywhere; }
  .result-panel > .note { margin-block: 0 1rem; }
  .figures { grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr)); gap: 0.5rem; }
  .figures > div { min-width: 0; padding: var(--data-padding); border: 0; border-inline-start: var(--data-rule) solid var(--border-strong); border-radius: 0; background: var(--surface-muted); }
  .figures > div[data-effect="weak"] { border-inline-start-color: var(--accent); }
  .figures dt { font-size: var(--data-label-size); font-weight: 600; }
  .figures dd { font-size: 1rem; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .multiplier { display: inline-block; min-width: 3.25rem; padding: 0.1rem 0.4rem; border: 1px solid var(--border-strong); border-radius: 0; background: var(--surface); color: var(--page-text); font-size: 0.9375rem; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; text-align: center; }
  [data-effect="weak"] .multiplier { border-width: var(--border-width); background: var(--accent-soft); font-weight: 700; }
  [data-effect="resisted"] .multiplier { border-style: dashed; }
  [data-effect="immune"] .multiplier { border-width: 3px; border-style: double; font-weight: 700; }
  [data-effect="neutral"] .multiplier { border-color: transparent; background: transparent; color: var(--muted); }
  details { margin-block: 0.5rem; border: 0; border-inline-start: var(--data-rule) solid var(--border-strong); border-radius: 0; background: var(--surface-muted); }
  details[open] { border-inline-start-color: var(--accent); }
  summary { min-height: 2.75rem; display: list-item; padding: var(--data-padding); cursor: pointer; font-size: var(--data-label-size); font-weight: 600; overflow-wrap: anywhere; }
  .bucket-label { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 0.35rem 0.75rem; max-width: calc(100% - 1rem); vertical-align: middle; }
  .species-list { margin: 0; padding: 0.375rem 0.75rem 0.75rem; border-block-start: var(--border-width) solid var(--border); list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr)); gap: 0.25rem 0.75rem; background: var(--surface); }
  .species-list li, .species-list a > span { min-width: 0; }
  .species-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; padding: 0.25rem; border-radius: var(--radius-control); overflow-wrap: anywhere; }
  .species-list a:hover { background: var(--accent-soft); }
  .combinations { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr)); gap: 0; padding: 0; list-style: none; }
  .combinations li { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; min-width: 0; padding: 0.5rem 0.625rem; border-block-end: 1px solid var(--border); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .combinations .multiplier { margin-inline-start: auto; }
  .chart-legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; padding: 0; margin-block: 1rem; list-style: none; }
  .chart-legend li { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; font-size: 0.875rem; }
  .toggle { padding-block: 0.5rem; }
  .chart-navigation { font-style: italic; }
  .chart-scroll { width: 100%; max-width: 100%; max-height: 75vh; overflow: auto; border: 0; border-block: var(--border-width) solid var(--border-strong); border-radius: 0; isolation: isolate; }
  .chart { width: max-content; min-width: 100%; margin: 0; border-collapse: separate; border-spacing: 0; }
  .chart caption { max-width: min(60ch, calc(100vw - 6rem)); text-align: start; padding: 0.75rem; font-size: 0.875rem; font-weight: 600; overflow-wrap: anywhere; }
  .chart :is(th, td) { padding: 0.4rem; border-block-end: 1px solid var(--border); border-inline-end: 1px solid var(--border); }
  .chart thead th { position: sticky; top: 0; z-index: 2; background: var(--surface-muted); vertical-align: bottom; border-block-end: var(--border-width) solid var(--border-strong); }
  .chart th[scope="row"] { position: sticky; left: 0; z-index: 1; background: var(--surface-muted); text-align: start; font-size: var(--data-label-size); font-weight: 600; border-inline-end: var(--border-width) solid var(--border-strong); }
  .chart th:first-child { min-width: 7rem; width: 8.5rem; max-width: 8.5rem; overflow-wrap: anywhere; }
  .chart th[scope="row"] a { display: flex; align-items: center; max-width: 7.5rem; min-height: 2.75rem; padding-block: 0.25rem; }
  .chart thead th:first-child { left: 0; z-index: 3; text-align: start; border-inline-end: var(--border-width) solid var(--border-strong); }
  .attack-head { display: flex; flex-direction: column; align-items: center; justify-content: end; gap: 0.35rem; width: 4.5rem; min-height: 4.5rem; font-size: var(--data-label-size); font-weight: 600; line-height: 1.2; overflow-wrap: anywhere; }
  .attack-head img { flex: 0 0 22px; }
  .chart td { text-align: center; }
  .chart .selected { background: var(--accent-soft); }
  .chart thead th.selected { box-shadow: inset 0 3px 0 var(--accent); }
  .chart thead th.selected .attack-head { font-weight: 700; }
  .chart tbody tr:hover th[scope="row"] { background: var(--surface-muted); }
  @media (max-width: 30rem) {
    .filters button { width: 100%; }
    .chart th:first-child { min-width: 6rem; width: 7rem; max-width: 7rem; }
    .chart th[scope="row"] a { max-width: 6rem; }
  }
</style>
