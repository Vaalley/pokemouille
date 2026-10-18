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

<h1>{t(lang, "list.title")}</h1>
<p>{t(lang, "list.intro")}</p>
<form class="filters" onsubmit={(event) => event.preventDefault()} aria-label={t(lang, "list.filters")} aria-describedby="{id}-scope">
  <div class="filter-field wide">
    <label for="{id}-query">{t(lang, "list.query")}</label>
    <input id="{id}-query" type="search" name="q" value={q} placeholder={t(lang, "list.placeholder")}
      disabled={!mounted} oninput={(event) => update(event.currentTarget.value)} />
  </div>
  <button type="button" disabled={!mounted || !q} onclick={() => update("")}>{t(lang, "list.reset")}</button>
</form>
<p class="note" id="{id}-scope">{t(lang, "list.scope")}</p>

{#snippet regions(rows: LocationSummary[])}
  {#each groupLocationsByRegion(rows, catalogue.regions) as group (group.regionId ?? "none")}
    {@const headingId = `${id}-region-${group.regionId ?? "none"}`}
    <section class="region" aria-labelledby={headingId}>
      <h2 id={headingId}>
        {#if group.regionId === null}
          {t(lang, "noRegion")}
        {:else if group.region}
          <Localized text={group.region.name} />
        {:else}
          {group.regionId}
        {/if}
        <small>{t(lang, "list.regionCount", { count: group.locations.length })}</small>
      </h2>
      {#if group.regionId === null}<p class="note">{t(lang, "noRegionNote")}</p>{/if}
      <ul class="location-list">
        {#each group.locations as location (location.id)}
          {@const version = selectedVersion()}
          {@const href = `${lang}/location/${location.id}/${version ? `?version=${encodeURIComponent(version)}` : ""}`}
          <li><a href={resolve(href as PathnameWithSearchOrHash)}><Localized text={location.name} /></a></li>
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
    {t(lang, "list.count", { filtered: filtered.length, total: catalogue.locations.length })}
  </p>
  {#if filtered.length === 0}<p>{t(lang, "list.empty")}</p>
  {:else}{@render regions(filtered)}{/if}
{/if}

<style>
  .region h2 small { font-size: 0.875rem; font-weight: normal; margin-inline-start: 0.5rem; }
  .location-list { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr)); gap: 0.25rem 1rem; }
  .location-list li { min-width: 0; }
  .location-list a { display: flex; align-items: center; min-height: 2.75rem; }
</style>
