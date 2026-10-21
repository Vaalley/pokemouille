<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { asset, resolve } from "$app/paths";
  import type { AssetPath, PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../../packages/pokemon-data/src/localization.ts";
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
<form onsubmit={(event) => event.preventDefault()} aria-label={t(data.lang, "heading")}>
  <fieldset class="attack-types">
    <legend>{t(data.lang, "attackLegend")}</legend>
    <div class="attack-options">
      {#each types as type (type.id)}
        {@const checked = selection.ids.includes(type.id)}
        <label>
          <input type="checkbox" name="attack" value={type.id} {checked}
            disabled={!mounted || !generation || (!checked && !isIntroduced(type.id, generation))}
            onchange={(event) => toggle(type.id, event.currentTarget.checked)} />
          <img src={asset(`/type-icons/${type.identifier}.svg` as AssetPath)} alt="" width="22" height="22" />
          <Localized text={name(type.id)} />
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
  <section aria-labelledby={`${id}-coverage`}>
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
          <div>
            <dt>{formatMultiplier(bucket.multiplier)}</dt>
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
            <summary>{t(data.lang, "bucketSummary", { multiplier: formatMultiplier(bucket.multiplier), count: bucket.members.length })}</summary>
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
            <li>
              {#each row.types as typeId (typeId)}
                <TypeBadge {typeId} name={name(typeId)} defendingTypes={row.types} />
              {/each}
              <strong>{formatMultiplier(row.multiplier)}</strong>
            </li>
          {/each}
        </ul>
      {:else}
        <p>{t(data.lang, "resistNone")}</p>
      {/if}
    {/if}
  </section>

  <section aria-labelledby={`${id}-chart`}>
    <h2 id={`${id}-chart`}>{t(data.lang, "chartHeading")}</h2>
    <p class="note">{t(data.lang, "chartScope", { generation })}</p>
    <label class="toggle">
      <input type="checkbox" bind:checked={theoretical} />
      {t(data.lang, "theoretical")}
    </label>
    <p class="result-count" role="status" aria-live="polite">
      {theoretical
        ? t(data.lang, "theoreticalCount", { count: chart.length, generation })
        : t(data.lang, "existingCount", { count: chart.length })}
    </p>
    <div class="table-scroll chart-scroll" role="region" aria-labelledby={`${id}-chart-caption`} tabindex="0">
      <table class="chart">
        <caption id={`${id}-chart-caption`}>{t(data.lang, "chartCaption", { generation })}</caption>
        <thead>
          <tr>
            <th scope="col">{t(data.lang, "defending")}</th>
            {#each chartTypes as type (type.id)}
              <th scope="col" class:selected={selection.ids.includes(type.id)}>
                <span class="attack-head">
                  <img src={asset(`/type-icons/${type.identifier}.svg` as AssetPath)} alt="" width="22" height="22" />
                  <Localized text={name(type.id)} />
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
                  data-multiplier={cell.multiplier}>{formatMultiplier(cell.multiplier)}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{/if}

<style>
  .attack-types { margin: 0 0 1rem; padding: 0.75rem 1rem 1rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); }
  legend { padding: 0 0.25rem; font-weight: 600; }
  .attack-options { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 9rem), 1fr)); gap: 0.25rem 1rem; }
  .attack-options label, .toggle { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; }
  .attack-options label:has(input:disabled) { color: GrayText; }
  input[type="checkbox"] { width: 1.25rem; height: 1.25rem; margin: 0; }
  details { margin-block: 0.5rem; }
  summary { min-height: 2.75rem; display: list-item; padding-block: 0.6rem; cursor: pointer; font-weight: 600; }
  .combinations { display: grid; gap: 0.5rem; padding: 0; list-style: none; }
  .combinations li { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
  .chart-scroll { max-height: 75vh; overflow: auto; }
  .chart { border-collapse: separate; border-spacing: 0; }
  .chart caption { text-align: start; padding-block-end: 0.5rem; font-weight: 600; }
  .chart :is(th, td) { padding: 0.3rem 0.45rem; border-block-end: var(--border-width) solid var(--border); }
  .chart thead th { position: sticky; top: 0; z-index: 1; background: var(--surface); vertical-align: bottom; }
  .chart th[scope="row"] { position: sticky; left: 0; background: var(--surface); text-align: start; white-space: nowrap; font-weight: normal; }
  .chart thead th:first-child { left: 0; z-index: 2; text-align: start; }
  .attack-head { display: inline-flex; align-items: center; gap: 0.35rem; writing-mode: vertical-rl; font-size: 0.875rem; font-weight: normal; }
  .chart td { text-align: center; }
  .chart .selected { background: var(--accent-soft); }
  .chart thead th.selected .attack-head { font-weight: 700; }
  td[data-multiplier="2"], td[data-multiplier="4"] { font-weight: 700; }
  td[data-multiplier="4"] { text-decoration: underline; }
  td[data-multiplier="1"] { color: var(--muted); }
  td[data-multiplier="0"], td[data-multiplier="0.25"], td[data-multiplier="0.5"] { color: var(--page-text); }
</style>
