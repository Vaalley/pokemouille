<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import {
    filterLocations,
    groupLocationsByRegion,
    locationFilterUrl,
    prepareLocations,
    type LocationSummary,
  } from "#lib/data/location-encounters.ts";
  import { t } from "#lib/i18n/locations.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const lang = $derived(data.lang);
  const catalogue = $derived(data.catalogue);
  let mounted = $state(false);
  const id = $props.id();
  const selectedVersion = getSelectedVersion();
  onMount(() => {
    mounted = true;
  });
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  // Prerendered HTML cannot know query parameters: hydrate before showing results.
  const q = $derived(mounted ? (new URL(currentUrl.href).searchParams.get("q") ?? "") : "");
  const prepared = $derived(prepareLocations(catalogue.locations));
  const filtered = $derived(filterLocations(prepared, q));

  function update(next: string) {
    const url = locationFilterUrl(currentUrl, next);
    if (url.href !== currentUrl.href) pushState(url, page.state);
  }
</script>

<svelte:head>
  <title>{t(lang, "list.metaTitle")}</title>
  <meta name="description" content={t(lang, "list.intro")} />
</svelte:head>

<header class="directory-header">
  <h1>{t(lang, "list.title")}</h1>
  <p>{t(lang, "list.intro")}</p>
</header>
<div class="search-panel">
  <form class="filters" onsubmit={(event) => event.preventDefault()} aria-label={t(lang, "list.filters")} aria-describedby="{id}-scope">
    <div class="filter-field wide">
      <label for="{id}-query">{t(lang, "list.query")}</label>
      <input id="{id}-query" type="search" name="q" value={q} placeholder={t(lang, "list.placeholder")}
        aria-describedby="{id}-search-help" disabled={!mounted} oninput={(event) => update(event.currentTarget.value)} />
      <p class="note search-help" id="{id}-search-help">{t(lang, "list.searchHint")}</p>
    </div>
    <button type="button" disabled={!mounted || !q} onclick={() => update("")}>{t(lang, "list.reset")}</button>
  </form>
  <p class="note" id="{id}-scope">{t(lang, "list.scope")}</p>
</div>

{#snippet regions(rows: LocationSummary[])}
  {#each groupLocationsByRegion(rows, catalogue.regions) as group (group.regionId ?? "none")}
    {@const headingId = `${id}-region-${group.regionId ?? "none"}`}
    <section class="region" aria-labelledby={headingId}>
      <div class="region-heading">
        <h2 id={headingId}>
          {#if group.regionId === null}
            {t(lang, "noRegion")}
          {:else if group.region}
            <Localized text={group.region.name} />
          {:else}
            {group.regionId}
          {/if}
        </h2>
        <p class="region-count">{t(lang, "list.regionCount", { count: group.locations.length })}</p>
      </div>
      {#if group.regionId === null}<p class="note">{t(lang, "noRegionNote")}</p>{/if}
      <ul class="location-list">
        {#each group.locations as location (location.id)}
          {@const version = selectedVersion()}
          {@const href = `${lang}/location/${location.id}/${version ? `?version=${encodeURIComponent(version)}` : ""}`}
          <li>
            <a href={resolve(href as PathnameWithSearchOrHash)}>
              <span><Localized text={location.name} /></span><span class="location-arrow" aria-hidden="true">→</span>
            </a>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
{/snippet}

{#if !mounted}
  <p role="status">{t(lang, "list.loading")}</p>
  <noscript>
    <p>{t(lang, "list.javascript")}</p>
    <p>{t(lang, "list.count", { filtered: catalogue.locations.length, total: catalogue.locations.length })}</p>
    {@render regions(catalogue.locations)}
  </noscript>
{:else}
  <p class="result-count" role="status" aria-live="polite" aria-atomic="true">
    <strong>{t(lang, "list.count", { filtered: filtered.length, total: catalogue.locations.length })}</strong>
    {#if q}<span class="active-query">{t(lang, "list.activeQuery", { query: q })}</span>{/if}
  </p>
  {#if filtered.length === 0}
    <div class="empty-state">
      <h2>{t(lang, "list.empty")}</h2>
      <p>{t(lang, "list.emptyHint")}</p>
    </div>
  {:else}{@render regions(filtered)}{/if}
{/if}

<style>
  .directory-header { max-width: var(--measure); margin-block-end: 1.5rem; }
  .directory-header h1 { margin-block-end: 0.5rem; }
  .search-panel { padding: 1rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
  .filters { margin-block: 0 0.75rem; align-items: start; }
  .filter-field { grid-template-rows: auto auto auto; }
  .filters button { align-self: start; margin-block-start: 1.85rem; }
  .search-help { margin: 0; }
  .search-panel > .note { margin-block: 0; }
  .result-count { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; padding-block: 0.5rem; overflow-wrap: anywhere; }
  .result-count strong { color: var(--page-text); font-weight: 600; }
  .active-query { min-width: 0; }
  .region { margin-block-start: 1.75rem; min-width: 0; }
  .region-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 0.75rem; padding-block-end: 0.5rem; border-block-end: var(--border-width) solid var(--border-strong); }
  .region-heading h2 { margin: 0; overflow-wrap: anywhere; }
  .region-count { margin: 0; color: var(--muted); font-size: 0.875rem; font-variant-numeric: tabular-nums; }
  .location-list { list-style: none; padding: 0; margin-block: 0.5rem 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr)); gap: 0 1rem; }
  .location-list li { min-width: 0; border-block-end: 1px solid var(--border); }
  .location-list a { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; min-height: 2.75rem; padding: 0.5rem; border-radius: var(--radius-control); }
  .location-list a:hover { background: var(--accent-soft); }
  .location-list a > :first-child { min-width: 0; overflow-wrap: anywhere; }
  .location-arrow { flex: 0 0 auto; color: var(--muted); }
  .empty-state { padding: 1rem; border-inline-start: var(--border-width) solid var(--border-strong); background: var(--surface-muted); }
  .empty-state h2 { margin-block: 0 0.5rem; font-size: 1.125rem; }
  .empty-state p { margin: 0; max-width: var(--measure); }
  @media (max-width: 30rem) {
    .filters { gap: 0.75rem; }
    .filters button { margin-block-start: 0; }
  }
</style>
