<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import { pokemonHref } from "#lib/data/context.ts";
  import {
    filterHomeSpecies,
    homeFiltersUrl,
    prepareHomeSpecies,
    readHomeFilters,
    type HomeFilters,
  } from "#lib/data/home-filters.ts";
  import { t as home } from "#lib/i18n/home.ts";
  import { t } from "#lib/i18n/messages.ts";
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
  const prepared = $derived(prepareHomeSpecies(data.catalogue.species));
  const species = $derived(filterHomeSpecies(prepared, filters));
  const active = $derived(Boolean(filters.q || filters.type !== null || filters.generation !== null));

  function update(changes: Partial<HomeFilters>) {
    const url = homeFiltersUrl(currentUrl, { ...filters, ...changes });
    // Shallow history: no loader request, no lost focus, and Back/Forward restores
    // controls and results from the same URL rather than a second local state.
    if (url.href !== currentUrl.href) pushState(url, page.state);
  }
</script>

<svelte:head>
  <title>{t(data.lang, "home.title")} | {t(data.lang, "site.name")}</title>
</svelte:head>

<h1>{t(data.lang, "home.title")}</h1>
<p>{t(data.lang, "home.intro")}</p>

<form class="filters" onsubmit={(event) => event.preventDefault()} aria-label={home(data.lang, "filters")} aria-describedby="{id}-scope">
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
      onchange={(event) => update({ type: event.currentTarget.value ? Number(event.currentTarget.value) : null })}>
      <option value="">{home(data.lang, "allTypes")}</option>
      {#each data.catalogue.types as type (type.id)}
        <option value={type.id} lang={type.name.fallback && type.name.sourceLanguageId === 9 ? "en" : undefined}>{type.name.text}</option>
      {/each}
    </select>
  </div>
  <div class="filter-field">
    <label for="{id}-generation">{home(data.lang, "generation")}</label>
    <select id="{id}-generation" name="generation" value={filters.generation ?? ""} disabled={!mounted}
      onchange={(event) => update({ generation: event.currentTarget.value ? Number(event.currentTarget.value) : null })}>
      <option value="">{home(data.lang, "allGenerations")}</option>
      {#each data.catalogue.generations as generation (generation)}
        <option value={generation}>{home(data.lang, "generationNumber", { number: generation })}</option>
      {/each}
    </select>
  </div>
  <button type="button" disabled={!mounted || (!active && !searchParams.has("q") && !searchParams.has("type") && !searchParams.has("generation"))}
    onclick={() => update({ q: "", type: null, generation: null })}>{home(data.lang, "reset")}</button>
</form>
<p class="note" id="{id}-scope">{home(data.lang, "scope")}</p>

{#snippet speciesList(entries: typeof species)}
  <ol class="species-list" aria-label={t(data.lang, "home.listLabel")}>
    {#each entries as entry (entry.id)}
      {@const version = selectedVersion()}
      <li>
        <a href={version
          ? resolve(pokemonHref(data.lang, entry.id, { version, form: null }).slice(1) as PathnameWithSearchOrHash)
          : resolve(`${data.lang}/pokemon/${entry.id}/`)}>
          <PokemonIcon speciesId={entry.id} />
          <span class="species-number">{t(data.lang, "home.number", { number: String(entry.id).padStart(4, "0") })}</span>
          <span>{entry.name}</span>
        </a>
      </li>
    {/each}
  </ol>
{/snippet}

{#if !mounted}
  <p role="status">{home(data.lang, "loading")}</p>
  <noscript>
    <p>{home(data.lang, "javascript")}</p>
    {@render speciesList(data.catalogue.species)}
  </noscript>
{:else}
  <p class="result-count" role="status" aria-live="polite" aria-atomic="true">
    {home(data.lang, "count", { filtered: species.length, total: data.catalogue.species.length })}
  </p>
  {#if species.length === 0}
    <p>{home(data.lang, "empty")}</p>
  {:else}
    {@render speciesList(species)}
  {/if}
{/if}

