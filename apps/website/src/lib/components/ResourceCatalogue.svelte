<script lang="ts">
  import { onMount, tick } from "svelte";
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
  import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";

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
  const activeFilters = $derived.by(() => {
    const rows: { key: keyof CatalogueFilters; label: string; value: string | LocalizedText }[] = [];
    if (filters.q) rows.push({ key: "q", label: t(lang, "query"), value: filters.q });
    const type = catalogue.types.find((entry) => entry.id === filters.type);
    if (type) rows.push({ key: "type", label: t(lang, "type"), value: type.name });
    if (filters.category !== null) rows.push({ key: "category", label: t(lang, "category"), value: categoryName(filters.category) });
    return rows;
  });

  async function removeFilter(key: keyof CatalogueFilters, button: HTMLButtonElement) {
    const item = button.closest("li");
    const next = item?.nextElementSibling?.querySelector("button")
      ?? item?.previousElementSibling?.querySelector("button");
    update({ [key]: key === "q" ? "" : null });
    await tick();
    (next ?? document.getElementById(`${id}-query`))?.focus();
  }

  async function resetMoves() {
    update({ q: "", type: null, category: null }, "name");
    await tick();
    document.getElementById(`${id}-query`)?.focus();
  }

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
<form class="filters" class:move-filters={catalogue.kind === "move"} onsubmit={(event) => event.preventDefault()} aria-label={t(lang, "filters")} aria-describedby="{id}-scope">
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
  {/if}
  {#if catalogue.kind !== "move"}
    <button type="button" disabled={!mounted || !active} onclick={() => update({ q: "", type: null, category: null }, "name")}>{t(lang, "reset")}</button>
  {/if}
</form>
{#if catalogue.kind === "move"}
  <details class="move-scope">
    <summary>{t(lang, "aboutMoves")}</summary>
    <div class="note" id="{id}-scope">
      <p>{t(lang, "scope")}</p>
      <p>{t(lang, "moveScope")}</p>
    </div>
  </details>
  <div class="results-toolbar" role="group" aria-label={t(lang, "resultsOptions")}>
    <div class="results-summary">
      {#if mounted}
        <p class="result-count" role="status" aria-live="polite" aria-atomic="true">{t(lang, "count", { filtered: entries.length, total: catalogue.entries.length })}</p>
      {/if}
      {#if active}
        <div class="active-filter-bar">
          {#if activeFilters.length > 0}
            <ul class="active-filters" aria-label={t(lang, "activeFilters")}>
              {#each activeFilters as filter (filter.key)}
                <li>
                  <button type="button" class="filter-chip"
                    aria-label={t(lang, "removeFilter", { filter: `${filter.label}: ${typeof filter.value === "string" ? filter.value : filter.value.text}` })}
                    onclick={(event) => removeFilter(filter.key, event.currentTarget)}>
                    <span>{filter.label}: {#if typeof filter.value === "string"}{filter.value}{:else}<Localized text={filter.value} />{/if}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
          <button type="button" class="reset-moves" onclick={resetMoves}>{t(lang, "resetMoves")}</button>
        </div>
      {/if}
    </div>
    {@render moveSort()}
  </div>
{:else}
  <div class="note" id="{id}-scope">
    <p>{t(lang, "scope")}</p>
    <p>{t(lang, catalogue.kind === "ability" ? "abilityScope" : "itemScope")}</p>
  </div>
{/if}

{#snippet moveSort()}
  <div class="filter-field">
    <label for="{id}-sort">{t(lang, "sort")}</label>
    <select id="{id}-sort" name="sort" value={sort} disabled={!mounted}
      onchange={(event) => update({}, readMoveSort(new URLSearchParams({ sort: event.currentTarget.value })))}>
      {#each MOVE_SORTS as value (value)}
        <option value={value}>{t(lang, value === "name" ? "sortName" : value === "power" ? "sortPower" : value === "accuracy" ? "sortAccuracy" : "sortPp")}</option>
      {/each}
    </select>
  </div>
{/snippet}

{#snippet resourceList(rows: typeof entries)}
  {#if catalogue.kind === "move"}
    <div class="table-scroll" role="region" aria-label={t(lang, "move")} tabindex="0">
      <table class="move-list">
        <caption class="visually-hidden">{t(lang, "move")}</caption>
        <colgroup>
          <col class="move-name-column" />
          <col class="move-type-column" />
          <col class="move-category-column" />
          <col class="move-power-column" />
          <col class="move-accuracy-column" />
          <col class="move-pp-column" />
        </colgroup>
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
              <th scope="row"><a href={resolve(href as PathnameWithSearchOrHash)}><span class="move-icon"><MoveIcon typeId={entry.typeId} /></span><span class="move-name"><Localized text={entry.name} /></span></a></th>
              <td>{#if type}<TypeBadge typeId={type.id} name={type.name} />{:else}—{/if}</td>
              <td><span class="damage-class"><DamageClassIcon damageClassId={entry.damageClassId} /> {categoryName(entry.damageClassId ?? 0)}</span></td>
              <td class="numeric" class:missing={entry.power == null || entry.power === 0}>{entry.power ? entry.power : "—"}</td>
              <td class="numeric" class:missing={entry.accuracy == null}>{entry.accuracy == null ? "—" : `${entry.accuracy}%`}</td>
              <td class="numeric" class:missing={entry.pp == null}>{entry.pp ?? "—"}</td>
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
  {#if catalogue.kind !== "move"}
    <p class="result-count" role="status" aria-live="polite" aria-atomic="true">{t(lang, "count", { filtered: entries.length, total: catalogue.entries.length })}</p>
  {/if}
  {#if entries.length === 0}<p>{t(lang, "empty")}</p>
  {:else}{@render resourceList(entries)}{/if}
{/if}

<style>
  .note p { margin-block: 0.25rem; }
  .resource-list { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr)); gap: 0.25rem 1rem; }
  .resource-list li { min-width: 0; }
  .resource-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; }
  .move-filters { display: grid; grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr)); gap: 1rem; align-items: end; }
  .move-filters :is(input, select), .results-toolbar select { width: 100%; min-width: 0; min-height: 2.75rem; padding: 0.625rem 0.75rem; border: var(--border-width) solid var(--border-strong); background: var(--surface); color: var(--page-text); font: inherit; }
  .move-scope { margin-block: 0.75rem; }
  .move-scope summary { width: fit-content; min-height: 2.75rem; align-content: center; color: var(--muted); cursor: pointer; }
  .move-scope .note { margin-block: 0.5rem 0.75rem; }
  .results-toolbar { display: flex; flex-wrap: wrap; align-items: start; gap: 1rem 1.5rem; margin-block: 1rem; padding: 1rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); background: var(--surface-muted); }
  .results-summary { flex: 1 1 20rem; min-width: 0; display: grid; gap: 0.625rem; }
  .results-toolbar .result-count { margin: 0; font-weight: 650; }
  .results-toolbar > .filter-field { flex: 0 1 18rem; min-width: 0; }
  .active-filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; }
  .active-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; padding: 0; list-style: none; min-width: 0; }
  .active-filters li { min-width: 0; max-width: 100%; }
  .active-filter-bar button { min-height: 2.75rem; padding: 0.375rem 0.625rem; border: var(--border-width) solid var(--border-strong); background: var(--accent-soft); color: var(--page-text); font: inherit; cursor: pointer; }
  .filter-chip { display: flex; align-items: center; gap: 0.75rem; max-width: 100%; border-radius: var(--radius-pill); text-align: start; overflow-wrap: anywhere; }
  .filter-chip > span:first-child { min-width: 0; }
  .filter-chip > span:last-child { color: var(--accent); font-size: 1.25rem; line-height: 1; }
  .active-filter-bar .reset-moves { border-color: transparent; background: transparent; color: var(--link); text-decoration: underline; text-underline-offset: 0.2em; }
  .active-filter-bar button:hover { border-color: var(--accent); }
  .table-scroll { --move-name-width: 20rem; position: relative; max-width: 100%; overflow-x: auto; border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); isolation: isolate; }
  .move-list { width: 100%; min-width: calc(var(--move-name-width) + 33rem); table-layout: fixed; border-collapse: separate; border-spacing: 0; }
  .move-name-column { width: var(--move-name-width); }
  .move-type-column { width: 9rem; }
  .move-category-column { width: 10rem; }
  .move-power-column { width: 5rem; }
  .move-accuracy-column { width: 6rem; }
  .move-pp-column { width: 3rem; }
  .move-list :is(th, td) { padding: 0.625rem 0.75rem; vertical-align: middle; }
  .move-list thead th { background: var(--surface-muted); font-weight: 600; overflow-wrap: anywhere; }
  .move-list th:first-child { position: sticky; left: 0; z-index: 1; border-inline-end: var(--border-width) solid var(--border); }
  .move-list th[scope="row"] { background: var(--surface); }
  .move-list tr:has(a:focus-visible) > *, .move-list tbody tr:hover > * { background: var(--accent-soft); }
  .move-list a { display: grid; grid-template-columns: 1.5rem minmax(0, 1fr); align-items: center; gap: 0.5rem; min-height: 2.75rem; font-weight: 650; text-decoration: none; }
  .move-list a:is(:hover, :focus-visible) .move-name { text-decoration: underline; text-underline-offset: 0.2em; }
  .move-name { min-width: 0; overflow-wrap: anywhere; line-height: 1.4; }
  .move-icon { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; }
  .numeric { white-space: nowrap; text-align: end; font-variant-numeric: tabular-nums; }
  td.numeric { font-size: 1.0625rem; }
  td.missing { color: var(--muted); }
  .damage-class { display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap; vertical-align: middle; font-size: 0.875rem; }
  @media (max-width: 40rem) {
    .move-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
    .move-filters > .filter-field:first-child { grid-column: 1 / -1; }
    .move-filters select { font-size: 0.875rem; }
    .results-toolbar { padding: 0.75rem; gap: 0.75rem; }
    .results-toolbar > .filter-field { flex-basis: 100%; }
    .table-scroll { --move-name-width: 8.5rem; }
    .move-list th[scope="row"] { font-size: 0.875rem; }
    .move-list a { grid-template-columns: minmax(0, 1fr); }
    .move-icon { display: none; }
  }
  @media (max-width: 23rem) {
    .move-filters { grid-template-columns: minmax(0, 1fr); }
  }
</style>
