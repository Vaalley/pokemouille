<script lang="ts">
  import { onMount } from "svelte";
  import { pushState, replaceState } from "$app/navigation";
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
  import type { ResourceCatalogue } from "#lib/data/resource-catalogue.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/catalogues.ts";
  import Pagination from "./Pagination.svelte";
  import { paginate, pageFromPath, paginationUrl } from "#lib/data/pagination.ts";

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
  const entries = $derived(filterResources(prepared, filters));
  const active = $derived(["q", "type", "category"].some((key) => params.has(key)));
  const pagination = $derived(paginate(entries, pageFromPath(currentUrl.pathname)));
  const navigationUrl = $derived(mounted ? new URL(currentUrl.href) : new URL(currentUrl.pathname, currentUrl.origin));

  // Keep shared/translated filters on an existing result page without a loader
  // request or an extra history entry. Filter changes explicitly reset to one.
  $effect(() => {
    if (mounted && pageFromPath(currentUrl.pathname) !== pagination.page) {
      replaceState(paginationUrl(currentUrl, pagination.page), page.state);
    }
  });

  function update(changes: Partial<CatalogueFilters>) {
    const next = paginationUrl(catalogueFiltersUrl(currentUrl, { ...filters, ...changes }), 1);
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
  {/if}
  <button type="button" disabled={!mounted || !active} onclick={() => update({ q: "", type: null, category: null })}>{t(lang, "reset")}</button>
</form>
<div class="note" id="{id}-scope">
  <p>{t(lang, "scope")}</p>
  <p>{t(lang, catalogue.kind === "move" ? "moveScope" : catalogue.kind === "ability" ? "abilityScope" : "itemScope")}</p>
</div>

{#snippet resourceList(rows: typeof entries)}
  <ul class="resource-list" aria-label={t(lang, catalogue.kind)}>
    {#each rows as entry (entry.id)}
      {@const version = selectedVersion()}
      {@const href = `${lang}/${catalogue.kind}/${entry.id}/${version ? `?version=${encodeURIComponent(version)}` : ""}`}
      <li>
        <a href={resolve(href as PathnameWithSearchOrHash)}>
          {#if catalogue.kind === "move"}<MoveIcon typeId={entry.typeId} />
          {:else if catalogue.kind === "ability"}<AbilityIcon />
          {:else}<ItemIcon identifier={entry.identifier} />{/if}
          <Localized text={entry.name} />
        </a>
        {#if catalogue.kind === "move"}
          {@const type = catalogue.types.find((row) => row.id === entry.typeId)}
          <span class="metadata">
            {#if type}<TypeBadge typeId={type.id} name={type.name} /> · {/if}
            <span class="damage-class"><DamageClassIcon damageClassId={entry.damageClassId} /> {categoryName(entry.damageClassId ?? 0)}</span>
          </span>
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

{#if !mounted}
  <p role="status">{t(lang, "loading")}</p>
  <noscript>
    <p>{t(lang, "javascript")}</p>
    <p>{t(lang, "count", { filtered: catalogue.entries.length, total: catalogue.entries.length })}</p>
    {@render resourceList(pagination.rows)}
  </noscript>
{:else}
  <p class="result-count" role="status" aria-live="polite" aria-atomic="true">{t(lang, "count", { filtered: entries.length, total: catalogue.entries.length })}</p>
  {#if entries.length === 0}<p>{t(lang, "empty")}</p>
  {:else}{@render resourceList(pagination.rows)}{/if}
{/if}

<Pagination current={pagination.page} pages={pagination.pages} source={navigationUrl}
  label={t(lang, "pagination")} previous={t(lang, "previous")} next={t(lang, "next")}
  position={t(lang, "pagePosition", { page: pagination.page, pages: pagination.pages })} />

<style>
  .note p { margin-block: 0.25rem; }
  .resource-list { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr)); gap: 0.25rem 1rem; }
  .resource-list li { min-width: 0; }
  .resource-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; }
  .metadata { display: block; margin-inline-start: 2.375rem; font-size: 0.85rem; }
  .damage-class { display: inline-flex; align-items: center; gap: 0.35rem; vertical-align: middle; }
</style>
