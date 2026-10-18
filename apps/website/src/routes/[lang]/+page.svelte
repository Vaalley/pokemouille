<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import TypeBadge from "#lib/components/TypeBadge.svelte";
  import { SPECIES_CLASSES, type CatalogueSpecies } from "#lib/data/catalogue.ts";
  import { pokemonHref } from "#lib/data/context.ts";
  import {
    HOME_SORTS,
    HOME_STAT_SORTS,
    defaultHomeOrder,
    filterHomeSpecies,
    hasHomeFilterParams,
    homeFiltersUrl,
    parseWholeNumber,
    prepareHomeSpecies,
    readHomeDisplay,
    readHomeFilters,
    sortHomeSpecies,
    type HomeDisplay,
    type HomeFilters,
    type HomeSort,
  } from "#lib/data/home-filters.ts";
  import { t as home } from "#lib/i18n/home.ts";
  import { t as dex } from "#lib/i18n/regional-dex.ts";
  import { regionalDexChoices, resolveDexSelection, speciesDexNumber } from "#lib/data/regional-dex.ts";
  import { t } from "#lib/i18n/messages.ts";
  import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let mounted = $state(false);
  const selectedVersion = getSelectedVersion();
  const id = $props.id();

  onMount(() => { mounted = true; });

  // Kit 3 keeps shallow history in page.shallow without replacing page.url.
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  // Prerendering cannot know a visitor's query. Do not briefly show unfiltered
  // results for a shared filtered URL, or read searchParams during prerendering.
  const searchParams = $derived(
    mounted ? new URL(currentUrl.href).searchParams : new URLSearchParams(),
  );
  const filters = $derived(readHomeFilters(searchParams, data.catalogue));
  const display = $derived(readHomeDisplay(searchParams));
  const prepared = $derived(prepareHomeSpecies(data.catalogue.species));
  const version = $derived(selectedVersion());
  const dexes = $derived(regionalDexChoices(data.catalogue, version));
  const dexSelection = $derived(resolveDexSelection(filters.dex, data.catalogue, version));
  const dexId = $derived(dexSelection.status === "regional" || dexSelection.status === "national" ? dexSelection.id : null);
  const dexName = $derived(dexSelection.status === "regional" ? dexSelection.dex.name.text
    : dex(data.lang, dexSelection.status === "national" ? "national" : "selector"));
  const invalidDexName = $derived(dexSelection.status === "invalid"
    ? dexSelection.dex?.name.text ?? dex(data.lang, "unknownDex", { id: dexSelection.requested })
    : "");
  const species = $derived(dexId === null ? [] : sortHomeSpecies(
    filterHomeSpecies(prepared, filters, dexId), display, data.lang, dexId,
  ));
  const typesById = $derived(new Map(data.catalogue.types.map((type) => [type.id, type])));

  function update(changes: Partial<HomeFilters>, displayChanges: Partial<HomeDisplay> = {}) {
    const url = homeFiltersUrl(currentUrl, { ...filters, ...changes }, { ...display, ...displayChanges });
    if (version) url.searchParams.set("version", version);
    // Shallow history: no loader request, no lost focus, and Back/Forward restores
    // controls and results from the same URL rather than a second local state.
    if (url.href !== currentUrl.href) pushState(url, page.state);
  }

  /** The active column flips direction; another column starts from its natural order. */
  function sortBy(sort: HomeSort) {
    const order = sort !== display.sort ? defaultHomeOrder(sort) : display.order === "asc" ? "desc" : "asc";
    update({}, { sort, order });
  }

  function sortLabel(sort: HomeSort): string | LocalizedText {
    if (sort === "number") return dexId === 1 ? home(data.lang, "sortNumber") : dex(data.lang, "sortNumber");
    if (sort === "name") return home(data.lang, "sortName");
    return data.catalogue.statNames[HOME_STAT_SORTS.indexOf(sort)] ?? home(data.lang, "total");
  }

  function optionLang(label: string | LocalizedText) {
    return typeof label !== "string" && label.fallback && label.sourceLanguageId === 9 ? "en" : undefined;
  }

  function speciesHref(speciesId: number) {
    return version
      ? resolve(pokemonHref(data.lang, speciesId, { version, form: null }).slice(1) as PathnameWithSearchOrHash)
      : resolve(`${data.lang}/pokemon/${speciesId}/`);
  }
</script>

<svelte:head>
  <title>{dexName} | {t(data.lang, "site.name")}</title>
</svelte:head>

<h1>{dexName}</h1>
<p>{home(data.lang, "intro")}</p>

<form class="filters" onsubmit={(event) => event.preventDefault()} aria-label={home(data.lang, "filters")} aria-describedby="{id}-scope">
  <div class="filter-field wide">
    <label for="{id}-dex">{dex(data.lang, "selector")}</label>
    <select id="{id}-dex" name="dex"
      value={dexId ?? filters.dex ?? "1"} disabled={!mounted || !version}
      aria-invalid={dexSelection.status === "invalid" ? "true" : undefined}
      aria-describedby={dexSelection.status === "invalid" ? `${id}-dex-error` : undefined}
      onchange={(event) => update({ dex: event.currentTarget.value === "1" ? null : event.currentTarget.value })}>
      <option value="1">{dex(data.lang, "national")}</option>
      {#if dexSelection.status === "invalid"}
        <option value={dexSelection.requested}>{dex(data.lang, "invalidOption", { dex: invalidDexName })}</option>
      {/if}
      {#each dexes as entry (entry.id)}
        <option value={entry.id} lang={optionLang(entry.name)}>{entry.name.text}</option>
      {/each}
    </select>
  </div>
  <div class="filter-field wide">
    <label for="{id}-query">{home(data.lang, "query")}</label>
    <input
      id="{id}-query"
      type="search"
      name="q"
      value={filters.q}
      placeholder={home(data.lang, "placeholder")}
      disabled={!mounted}
      oninput={(event) => update({ q: event.currentTarget.value })}
    />
  </div>
  <div class="filter-field">
    <label for="{id}-type">{home(data.lang, "type")}</label>
    <select id="{id}-type" name="type" value={filters.type ?? ""} disabled={!mounted}
      onchange={(event) => update({ type: parseWholeNumber(event.currentTarget.value) })}>
      <option value="">{home(data.lang, "allTypes")}</option>
      {#each data.catalogue.types as type (type.id)}
        <option value={type.id} lang={optionLang(type.name)}>{type.name.text}</option>
      {/each}
    </select>
  </div>
  <div class="filter-field">
    <label for="{id}-generation">{home(data.lang, "generation")}</label>
    <select id="{id}-generation" name="generation" value={filters.generation ?? ""} disabled={!mounted}
      onchange={(event) => update({ generation: parseWholeNumber(event.currentTarget.value) })}>
      <option value="">{home(data.lang, "allGenerations")}</option>
      {#each data.catalogue.generations as generation (generation)}
        <option value={generation}>{home(data.lang, "generationNumber", { number: generation })}</option>
      {/each}
    </select>
  </div>
  <div class="filter-field">
    <label for="{id}-ability">{home(data.lang, "ability")}</label>
    <select id="{id}-ability" name="ability" value={filters.ability ?? ""} disabled={!mounted}
      onchange={(event) => update({ ability: parseWholeNumber(event.currentTarget.value) })}>
      <option value="">{home(data.lang, "allAbilities")}</option>
      {#each data.catalogue.abilities as ability (ability.id)}
        <option value={ability.id} lang={optionLang(ability.name)}>{ability.name.text}</option>
      {/each}
    </select>
  </div>
  <div class="filter-field">
    <label for="{id}-class">{home(data.lang, "classification")}</label>
    <select id="{id}-class" name="class" value={filters.classification ?? ""} disabled={!mounted}
      onchange={(event) => update({ classification: SPECIES_CLASSES.find((value) => value === event.currentTarget.value) ?? null })}>
      <option value="">{home(data.lang, "allClasses")}</option>
      {#each SPECIES_CLASSES as classification (classification)}
        <option value={classification}>{home(data.lang, classification)}</option>
      {/each}
    </select>
  </div>
  <div class="filter-field">
    <label for="{id}-min-total">{home(data.lang, "minTotal")}</label>
    <input id="{id}-min-total" type="number" name="minTotal" min="0" step="1" inputmode="numeric"
      value={filters.minTotal ?? ""} disabled={!mounted}
      oninput={(event) => update({ minTotal: parseWholeNumber(event.currentTarget.value) })} />
  </div>
  <div class="filter-field">
    <label for="{id}-max-total">{home(data.lang, "maxTotal")}</label>
    <input id="{id}-max-total" type="number" name="maxTotal" min="0" step="1" inputmode="numeric"
      value={filters.maxTotal ?? ""} disabled={!mounted}
      oninput={(event) => update({ maxTotal: parseWholeNumber(event.currentTarget.value) })} />
  </div>
  <div class="filter-field">
    <label for="{id}-view">{home(data.lang, "view")}</label>
    <select id="{id}-view" name="view" value={display.view} disabled={!mounted}
      onchange={(event) => update({}, { view: event.currentTarget.value === "table" ? "table" : "list" })}>
      <option value="list">{home(data.lang, "viewList")}</option>
      <option value="table">{home(data.lang, "viewTable")}</option>
    </select>
  </div>
  <div class="filter-field">
    <label for="{id}-sort">{home(data.lang, "sort")}</label>
    <select id="{id}-sort" name="sort" value={display.sort} disabled={!mounted}
      onchange={(event) => {
        const sort = readHomeDisplay(new URLSearchParams({ sort: event.currentTarget.value })).sort;
        update({}, { sort, order: defaultHomeOrder(sort) });
      }}>
      {#each HOME_SORTS as sort (sort)}
        {@const label = sortLabel(sort)}
        <option value={sort} lang={optionLang(label)}>{typeof label === "string" ? label : label.text}</option>
      {/each}
    </select>
  </div>
  <div class="filter-field">
    <label for="{id}-order">{home(data.lang, "order")}</label>
    <select id="{id}-order" name="order" value={display.order} disabled={!mounted}
      onchange={(event) => update({}, { order: event.currentTarget.value === "desc" ? "desc" : "asc" })}>
      <option value="asc">{home(data.lang, "ascending")}</option>
      <option value="desc">{home(data.lang, "descending")}</option>
    </select>
  </div>
  <button type="button" disabled={!mounted || !hasHomeFilterParams(searchParams)}
    onclick={() => update({ q: "", type: null, generation: null, ability: null, classification: null, minTotal: null, maxTotal: null, dex: null })}>{home(data.lang, "reset")}</button>
</form>
<div class="note" id="{id}-scope">
  <p>{home(data.lang, "scope")}</p>
  <p>{home(data.lang, "currentScope")}</p>
  <p>{dex(data.lang, "scope")}</p>
  {#if mounted && version && dexes.length === 0}<p>{dex(data.lang, "noMapped")}</p>{/if}
</div>

{#snippet speciesList(entries: CatalogueSpecies[], label: string)}
  <ol class="species-list" class:regional={dexId !== null && dexId !== 1} aria-label={label}>
    {#each entries as entry (entry.id)}
      <li>
        <a href={speciesHref(entry.id)}>
          <PokemonIcon speciesId={entry.id} />
          <span class="species-number">
            {#if dexId !== null && dexId !== 1}
              <span>{dex(data.lang, "regionalNumber")} {speciesDexNumber(entry, dexId)}</span>
              <span>{dex(data.lang, "nationalNumber")} {String(entry.id).padStart(4, "0")}</span>
            {:else}
              {t(data.lang, "home.number", { number: String(entry.id).padStart(4, "0") })}
            {/if}
          </span>
          <span>{entry.name}</span>
        </a>
      </li>
    {/each}
  </ol>
{/snippet}

{#snippet sortHeader(sort: HomeSort, label: string | LocalizedText)}
  {@const current = display.sort === sort}
  <th scope="col" class:numeric={sort !== "name"}
    aria-sort={current ? (display.order === "asc" ? "ascending" : "descending") : undefined}>
    <button type="button" class="sort-button" onclick={() => sortBy(sort)}>
      {#if typeof label === "string"}{label}{:else}<Localized text={label} />{/if}
      <span class="sort-indicator" aria-hidden="true">{current ? (display.order === "asc" ? "▲" : "▼") : ""}</span>
    </button>
  </th>
{/snippet}

{#snippet speciesTable(entries: CatalogueSpecies[])}
  <div class="table-scroll" role="region" aria-labelledby="{id}-caption" tabindex="0">
    <table class="species-table">
      <caption id="{id}-caption">{dex(data.lang, "table", { dex: dexName })}</caption>
      <thead>
        <tr>
          {@render sortHeader("number", dex(data.lang, dexId === 1 ? "nationalNumber" : "regionalNumber"))}
          {#if dexId !== null && dexId !== 1}<th scope="col" class="numeric">{dex(data.lang, "nationalNumber")}</th>{/if}
          <th scope="col"><span class="visually-hidden">{home(data.lang, "icon")}</span></th>
          {@render sortHeader("name", home(data.lang, "name"))}
          <th scope="col">{home(data.lang, "types")}</th>
          {#each HOME_STAT_SORTS as sort (sort)}
            {@render sortHeader(sort, sortLabel(sort))}
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each entries as entry (entry.id)}
          <tr>
            <td class="numeric">{String(speciesDexNumber(entry, dexId ?? 1)).padStart(dexId === 1 ? 4 : 3, "0")}</td>
            {#if dexId !== null && dexId !== 1}<td class="numeric">{String(entry.id).padStart(4, "0")}</td>{/if}
            <td><PokemonIcon speciesId={entry.id} /></td>
            <th scope="row"><a href={speciesHref(entry.id)}>{entry.name}</a></th>
            <td>
              <span class="types">
                {#each entry.typeIds as typeId (typeId)}
                  {@const type = typesById.get(typeId)}
                  {#if type}<TypeBadge typeId={type.id} name={type.name} />{/if}
                {/each}
              </span>
            </td>
            {#if entry.stats}
              {#each entry.stats as value, index (index)}
                <td class="numeric">{value}</td>
              {/each}
            {:else}
              <td colspan={HOME_STAT_SORTS.length}>{home(data.lang, "unknown")}</td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

{#if !mounted}
  <p role="status">{home(data.lang, "loading")}</p>
  <noscript>
    <p>{home(data.lang, "javascript")}</p>
    {@render speciesList(data.catalogue.species, t(data.lang, "home.listLabel"))}
  </noscript>
{:else if dexSelection.status === "waiting"}
  <p role="status">{dex(data.lang, "loading")}</p>
{:else if dexSelection.status === "invalid"}
  <p id="{id}-dex-error" role="alert">{dex(data.lang, "invalid", { dex: invalidDexName })}</p>
  <button type="button" onclick={() => update({ dex: null })}>{dex(data.lang, "reset")}</button>
{:else}
  <p class="result-count" role="status" aria-live="polite" aria-atomic="true">
    {home(data.lang, "count", { filtered: species.length, total: data.catalogue.species.length })}
  </p>
  {#if species.length === 0}
    <p>{home(data.lang, "empty")}</p>
  {:else if display.view === "table"}
    {@render speciesTable(species)}
  {:else}
    {@const sort = sortLabel(display.sort)}
    {@render speciesList(species, display.sort === "number" && display.order === "asc"
      ? dex(data.lang, "list", { dex: dexName })
      : home(data.lang, "sortedList", {
        sort: typeof sort === "string" ? sort : sort.text,
        order: home(data.lang, display.order === "asc" ? "ascending" : "descending"),
      }))}
  {/if}
{/if}

<style>
  .species-list.regional { grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr)); }
  .regional .species-number { display: grid; gap: 0.1rem; }
  .note p { margin-block: 0.25rem; }
  .species-table { width: 100%; }
  .species-table :is(th, td) { vertical-align: middle; }
  .species-table th[scope="row"] { min-width: 9rem; font-weight: normal; }
  .species-table thead th { white-space: nowrap; }
  .sort-button {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 2.75rem;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 600;
    text-align: inherit;
    cursor: pointer;
  }
  .sort-indicator { display: inline-block; min-width: 1ch; font-size: 0.75em; }
  .types { display: flex; flex-wrap: wrap; gap: 0.25rem; }
</style>
