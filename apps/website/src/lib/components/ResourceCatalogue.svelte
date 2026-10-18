<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { getSelectedVersion } from "./GameSelector.svelte";
  import MoveIcon from "./MoveIcon.svelte";
  import DamageClassIcon from "./DamageClassIcon.svelte";
  import AbilityIcon from "./AbilityIcon.svelte";
  import ItemIcon from "./ItemIcon.svelte";
  import Localized from "./pokemon/Localized.svelte";
  import TypeBadge from "./TypeBadge.svelte";
  import { catalogueFiltersUrl, filterResources, prepareResources, readCatalogueFilters, type CatalogueFilters } from "#lib/data/catalogue-filters.ts";
  import { MOVE_SORTS, readMoveSort, sortMoves, type MoveSort, type ResourceCatalogue } from "#lib/data/resource-catalogue.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/catalogues.ts";

  let { lang, catalogue }: { lang: Language; catalogue: ResourceCatalogue } = $props();
  let mounted = $state(false);
  const id = $props.id();
  const selectedVersion = getSelectedVersion();
  onMount(() => { mounted = true; });
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  // Prerendered HTML cannot know query parameters: hydrate before showing results.
  const params = $derived(mounted ? new URL(currentUrl.href).searchParams : new URLSearchParams());
  const filters = $derived(readCatalogueFilters(params, catalogue));
  const prepared = $derived(prepareResources(catalogue.entries));
  const sort = $derived(catalogue.kind === "move" ? readMoveSort(params) : "name");
  const filtered = $derived(filterResources(prepared, filters));
  const entries = $derived(catalogue.kind === "move" ? sortMoves(filtered, sort, lang) : filtered);
  const defaultEntries = $derived(catalogue.kind === "move" ? sortMoves(catalogue.entries, "name", lang) : catalogue.entries);
  const active = $derived(["q", "type", "category", ...(catalogue.kind === "move" ? ["sort"] : [])].some((key) => params.has(key)));

  function update(changes: Partial<CatalogueFilters>, nextSort: MoveSort = sort) {
    const next = catalogueFiltersUrl(currentUrl, { ...filters, ...changes });
    if (catalogue.kind === "move") {
      next.searchParams.delete("sort");
      if (nextSort !== "name") next.searchParams.set("sort", nextSort);
    }
    if (next.href !== currentUrl.href) pushState(next, page.state);
  }

  function categoryName(category: number) {
    return category === 1 ? t(lang, "status") : category === 2 ? t(lang, "physical") :
      category === 3 ? t(lang, "special") : t(lang, "unknown", { id: category });
  }
</script>

<svelte:head>
  <title>{t(lang, catalogue.kind)} | Pokémouille</title>
  <meta name="description" content={`${t(lang, catalogue.kind)}. ${t(lang, "intro")}`} />
</svelte:head>

<h1>{t(lang, catalogue.kind)}</h1>
<p>{t(lang, "intro")}</p>
<form class="filters" onsubmit={(event) => event.preventDefault()} aria-label={t(lang, "filters")} aria-describedby="{id}-scope">
  <div class="filter-field wide">
    <label for="{id}-query">{t(lang, "query")}</label>
    <input id="{id}-query" type="search" name="q" value={filters.q} placeholder={t(lang, "placeholder")}
      disabled={!mounted} oninput={(event) => update({ q: event.currentTarget.value })} />
  </div>
  {#if catalogue.kind === "move"}
    <div class="filter-field">
      <label for="{id}-type">{t(lang, "type")}</label>
      <select id="{id}-type" name="type" value={filters.type ?? ""} disabled={!mounted}
        onchange={(event) => update({ type: event.currentTarget.value ? Number(event.currentTarget.value) : null })}>
        <option value="">{t(lang, "allTypes")}</option>
        {#each catalogue.types as type (type.id)}
          <option value={type.id} lang={type.name.fallback && type.name.sourceLanguageId === 9 ? "en" : undefined}>{type.name.text}</option>
        {/each}
      </select>
    </div>
    <div class="filter-field">
      <label for="{id}-category">{t(lang, "category")}</label>
      <select id="{id}-category" name="category" value={filters.category ?? ""} disabled={!mounted}
        onchange={(event) => update({ category: event.currentTarget.value ? Number(event.currentTarget.value) : null })}>
        <option value="">{t(lang, "allCategories")}</option>
        {#each catalogue.categories as category (category)}
          <option value={category}>{categoryName(category)}</option>
        {/each}
      </select>
    </div>
    <div class="filter-field">
      <label for="{id}-sort">{t(lang, "sort")}</label>
      <select id="{id}-sort" name="sort" value={sort} disabled={!mounted}
        onchange={(event) => update({}, readMoveSort(new URLSearchParams({ sort: event.currentTarget.value })))}>
        {#each MOVE_SORTS as value (value)}
          <option value={value}>{t(lang, value === "name" ? "sortName" : value === "power" ? "sortPower" : value === "accuracy" ? "sortAccuracy" : "sortPp")}</option>
        {/each}
      </select>
    </div>
  {/if}
  <button type="button" disabled={!mounted || !active} onclick={() => update({ q: "", type: null, category: null }, "name")}>{t(lang, "reset")}</button>
</form>
<div class="note" id="{id}-scope">
  <p>{t(lang, "scope")}</p>
  <p>{t(lang, catalogue.kind === "move" ? "moveScope" : catalogue.kind === "ability" ? "abilityScope" : "itemScope")}</p>
</div>

{#snippet resourceList(rows: typeof entries)}
  {#if catalogue.kind === "move"}
    <div class="table-scroll" role="region" aria-label={t(lang, "move")} tabindex="0">
      <table class="move-list">
        <caption class="visually-hidden">{t(lang, "move")}</caption>
        <thead>
          <tr>
            <th scope="col">{t(lang, "name")}</th>
            <th scope="col">{t(lang, "type")}</th>
            <th scope="col">{t(lang, "category")}</th>
            <th scope="col" class="numeric">{t(lang, "power")}</th>
            <th scope="col" class="numeric">{t(lang, "accuracy")}</th>
            <th scope="col" class="numeric">{t(lang, "pp")}</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as entry (entry.id)}
            {@const version = selectedVersion()}
            {@const href = `${lang}/move/${entry.id}/${version ? `?version=${encodeURIComponent(version)}` : ""}`}
            {@const type = catalogue.types.find((row) => row.id === entry.typeId)}
            <tr>
              <th scope="row"><a href={resolve(href as PathnameWithSearchOrHash)}><MoveIcon typeId={entry.typeId} /><Localized text={entry.name} /></a></th>
              <td>{#if type}<TypeBadge typeId={type.id} name={type.name} />{:else}—{/if}</td>
              <td><span class="damage-class"><DamageClassIcon damageClassId={entry.damageClassId} /> {categoryName(entry.damageClassId ?? 0)}</span></td>
              <td class="numeric">{entry.power ? entry.power : "—"}</td>
              <td class="numeric">{entry.accuracy == null ? "—" : `${entry.accuracy}%`}</td>
              <td class="numeric">{entry.pp ?? "—"}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <ul class="resource-list" aria-label={t(lang, catalogue.kind)}>
      {#each rows as entry (entry.id)}
        {@const version = selectedVersion()}
        {@const href = `${lang}/${catalogue.kind}/${entry.id}/${version ? `?version=${encodeURIComponent(version)}` : ""}`}
        <li>
          <a href={resolve(href as PathnameWithSearchOrHash)}>
            {#if catalogue.kind === "ability"}<AbilityIcon />
            {:else}<ItemIcon identifier={entry.identifier} />{/if}
            <Localized text={entry.name} />
          </a>
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

{#if !mounted}
  <p role="status">{t(lang, "loading")}</p>
  <noscript>
    <p>{t(lang, "javascript")}</p>
    <p>{t(lang, "count", { filtered: catalogue.entries.length, total: catalogue.entries.length })}</p>
    {@render resourceList(defaultEntries)}
  </noscript>
{:else}
  <p class="result-count" role="status" aria-live="polite" aria-atomic="true">{t(lang, "count", { filtered: entries.length, total: catalogue.entries.length })}</p>
  {#if entries.length === 0}<p>{t(lang, "empty")}</p>
  {:else}{@render resourceList(entries)}{/if}
{/if}

<style>
  .note p { margin-block: 0.25rem; }
  .resource-list { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr)); gap: 0.25rem 1rem; }
  .resource-list li { min-width: 0; }
  .resource-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; }
  .table-scroll { max-width: 100%; overflow-x: auto; }
  .move-list { width: 100%; }
  .move-list th, .move-list td { vertical-align: middle; }
  .move-list th[scope="row"] { min-width: 10rem; font-weight: normal; }
  .move-list a { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; }
  .numeric { white-space: nowrap; }
  .damage-class { display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap; vertical-align: middle; }
</style>
