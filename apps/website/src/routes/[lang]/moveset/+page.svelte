<script lang="ts" module>
  import type { MoveLearners } from "#lib/data/moveset.ts";

  // Shared across visits within the tab; a failed download is evicted so retry refetches.
  const learnerCache = new Map<number, Promise<MoveLearners>>();
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import MoveIcon from "#lib/components/MoveIcon.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { filterResources, prepareResources } from "#lib/data/catalogue-filters.ts";
  import { pokemonHref } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import {
    MAX_MOVES,
    expandNames,
    intersectLearners,
    movesetUrl,
    parseMoveLearners,
    readMovesetSelection,
  } from "#lib/data/moveset.ts";
  import { localizeVersion } from "#lib/i18n/pokemon.ts";
  import { t } from "#lib/i18n/moveset.ts";
  import type { PageProps } from "./$types";

  const SUGGESTION_LIMIT = 12;

  let { data }: PageProps = $props();
  const id = $props.id();
  const selectedVersion = getSelectedVersion();
  let mounted = $state(false);
  let games = $state<GameOption[] | null>(null);
  let gamesFailed = $state(false);
  let query = $state("");
  let searchInput = $state<HTMLInputElement>();
  let loaded = $state.raw<{ key: string; files: MoveLearners[] } | null>(null);
  let loadFailed = $state(false);
  let attempt = $state(0);

  const currentUrl = $derived(page.shallow?.url ?? page.url);
  const moves = $derived.by(() => {
    const collator = new Intl.Collator(data.lang);
    return data.moves.toSorted((a, b) => collator.compare(a.name.text, b.name.text) || a.id - b.id);
  });
  const moveById = $derived(new Map(data.moves.map((move) => [move.id, move])));
  const prepared = $derived(prepareResources(moves));
  const names = $derived(expandNames(data.pokemon, data.lang));
  const methods = $derived(new Map(data.methods.map((method) => [method.id, method.name])));
  // Prerendered HTML has no query string; read the link's moves only in the browser.
  const selection = $derived(
    readMovesetSelection(
      mounted ? new URL(currentUrl.href).searchParams : new URLSearchParams(),
      new Set(data.moves.map((move) => move.id)),
    ),
  );
  const selectionKey = $derived(selection.ids.join(","));
  const suggestions = $derived(
    query.trim() ? filterResources(prepared, { q: query, type: null, category: null }) : [],
  );
  const full = $derived(selection.ids.length >= MAX_MOVES);
  const version = $derived(selectedVersion());
  const game = $derived(games?.find((entry) => entry.version.identifier === version) ?? null);
  const gameName = $derived(game ? localizeVersion(data.lang, game.version) : null);
  const introductionOrder = $derived.by(() => {
    const order = new Map<number, number>();
    for (const entry of games ?? []) {
      order.set(entry.group.id, entry.group.order);
      for (const expansion of entry.expansions) {
        if (expansion.group) order.set(expansion.group.id, expansion.group.order);
      }
    }
    return order;
  });
  const files = $derived(loaded?.key === selectionKey ? loaded.files : null);
  const result = $derived(
    game && files
      ? intersectLearners(
          files,
          { versionGroupId: game.group.id, generationId: game.group.generationId, order: game.group.order },
          introductionOrder,
        )
      : null,
  );

  async function loadGames() {
    gamesFailed = false;
    try {
      games = await getGames();
    } catch {
      gamesFailed = true;
    }
  }
  onMount(() => {
    mounted = true;
    void loadGames();
  });

  function loadLearners(moveId: number): Promise<MoveLearners> {
    let pending = learnerCache.get(moveId);
    if (!pending) {
      pending = (async () => {
        const revision = import.meta.env.DATASET_REVISION;
        if (!revision) throw new Error("This site was built without a published dataset");
        const response = await fetch(
          resolve("/learners/[revision]/[move].json", { revision, move: String(moveId) }),
        );
        if (!response.ok) throw new Error(`Learner data for move ${moveId}: ${response.status}`);
        return parseMoveLearners(await response.json(), moveId);
      })();
      learnerCache.set(moveId, pending);
      pending.catch(() => {
        if (learnerCache.get(moveId) === pending) learnerCache.delete(moveId);
      });
    }
    return pending;
  }

  // Only the selected moves' files are downloaded; late results for an older selection are dropped.
  $effect(() => {
    const ids = selection.ids;
    const key = selectionKey;
    void attempt;
    if (!mounted) return;
    let current = true;
    loadFailed = false;
    Promise.all(ids.map(loadLearners)).then(
      (loadedFiles) => {
        if (current) loaded = { key, files: loadedFiles };
      },
      () => {
        if (current) loadFailed = true;
      },
    );
    return () => {
      current = false;
    };
  });

  function update(ids: readonly number[]) {
    const url = movesetUrl(new URL(currentUrl.href), ids);
    if (version) url.searchParams.set("version", version);
    if (url.href !== currentUrl.href) pushState(url, page.state);
  }
  function add(moveId: number) {
    if (full || selection.ids.includes(moveId)) return;
    update([...selection.ids, moveId]);
    query = "";
    searchInput?.focus();
  }
  function remove(moveId: number) {
    update(selection.ids.filter((entry) => entry !== moveId));
    searchInput?.focus();
  }
  function withVersion(path: string) {
    const suffix = version ? `?version=${encodeURIComponent(version)}` : "";
    return resolve(`${path}${suffix}` as PathnameWithSearchOrHash);
  }
  function pokemonLink(speciesId: number, form: string | null, selected: string) {
    return resolve(
      pokemonHref(data.lang, speciesId, { version: selected, form }).slice(1) as PathnameWithSearchOrHash,
    );
  }
</script>

<svelte:head><title>{t(data.lang, "heading")} | Pokémouille</title></svelte:head>
<h1>{t(data.lang, "heading")}</h1>
<p>{t(data.lang, "intro", { max: MAX_MOVES })}</p>
<p class="note" id="{id}-scope">{t(data.lang, "scope")}</p>
<p class="note">{t(data.lang, "obtainable")}</p>
<p class="note">{t(data.lang, "legality")}</p>

<section aria-labelledby="{id}-picker">
  <h2 id="{id}-picker">{t(data.lang, "picker")}</h2>
  <form class="filters" role="search" onsubmit={(event) => {
    event.preventDefault();
    // Enter adds the move only when the text identifies exactly one.
    if (suggestions.length === 1) add(suggestions[0]!.id);
  }}>
    <div class="filter-field wide">
      <label for="{id}-search">{t(data.lang, "search")}</label>
      <input
        id="{id}-search"
        type="search"
        autocomplete="off"
        placeholder={t(data.lang, "placeholder")}
        aria-describedby="{id}-search-help"
        aria-controls="{id}-suggestions"
        disabled={!mounted}
        bind:this={searchInput}
        bind:value={query}
      />
      <small id="{id}-search-help">{full ? t(data.lang, "full", { max: MAX_MOVES }) : t(data.lang, "searchHelp")}</small>
    </div>
  </form>

  <div id="{id}-suggestions">
    {#if query.trim()}
      <p class="result-count" role="status" aria-live="polite">
        {suggestions.length
          ? t(data.lang, "suggestionCount", { count: suggestions.length })
          : t(data.lang, "noSuggestions")}
        {#if suggestions.length > SUGGESTION_LIMIT}
          {t(data.lang, "moreSuggestions", { shown: SUGGESTION_LIMIT })}
        {/if}
      </p>
      {#if suggestions.length}
        <ul class="suggestions" aria-label={t(data.lang, "suggestions")}>
          {#each suggestions.slice(0, SUGGESTION_LIMIT) as move (move.id)}
            {@const chosen = selection.ids.includes(move.id)}
            <li>
              <button
                type="button"
                disabled={chosen || full}
                aria-label={t(data.lang, "add", { move: move.name.text })}
                onclick={() => add(move.id)}
              >
                <MoveIcon typeId={move.typeId} />
                <Localized text={move.name} />
                {#if chosen}<small>({t(data.lang, "added")})</small>{/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>

  <h3 id="{id}-selected">{t(data.lang, "selected", { count: selection.ids.length, max: MAX_MOVES })}</h3>
  {#if selection.ids.length}
    <ul class="selected" aria-labelledby="{id}-selected">
      {#each selection.ids as moveId (moveId)}
        {@const move = moveById.get(moveId)!}
        <li>
          <a href={withVersion(`${data.lang}/move/${moveId}/`)}>
            <MoveIcon typeId={move.typeId} />
            <Localized text={move.name} />
          </a>
          <button
            type="button"
            aria-label={t(data.lang, "remove", { move: move.name.text })}
            onclick={() => remove(moveId)}
          ><span aria-hidden="true">×</span></button>
        </li>
      {/each}
    </ul>
    <button type="button" onclick={() => update([])}>{t(data.lang, "reset")}</button>
  {:else}
    <p>{t(data.lang, "noneSelected")}</p>
  {/if}
  {#if selection.invalid}
    <p class="note" role="status">{t(data.lang, "invalid", { max: MAX_MOVES })}</p>
  {/if}
</section>

<section aria-labelledby="{id}-results" aria-describedby="{id}-scope">
  <h2 id="{id}-results">{t(data.lang, "table")}</h2>
  {#if !mounted}
    <p role="status">{t(data.lang, "loading")}</p>
    <noscript><p>{t(data.lang, "javascript")}</p></noscript>
  {:else if gamesFailed || (games && version && !game)}
    <p role="alert">{t(data.lang, "gamesError")}</p>
  {:else if !selection.ids.length}
    <p role="status">{t(data.lang, "empty")}</p>
  {:else if loadFailed}
    <p role="alert">{t(data.lang, "error")}</p>
    <button type="button" onclick={() => attempt++}>{t(data.lang, "retry")}</button>
  {:else if !game || !gameName || !result}
    <p role="status">{t(data.lang, "loading")}</p>
  {:else}
    <p class="result-count" role="status" aria-live="polite" aria-atomic="true">
      {t(data.lang, "count", { count: result.rows.length })}
      <span aria-hidden="true">·</span>
      {t(data.lang, "game")} <strong><Localized text={gameName} /></strong>
    </p>
    {#if game.coverageState.learnsets === "missing"}
      <p>{t(data.lang, "noLearnsets")}</p>
    {:else}
      <h3 id="{id}-per-move">{t(data.lang, "perMove")}</h3>
      <ul class="per-move" aria-labelledby="{id}-per-move">
        {#each result.counts as count (count.moveId)}
          {@const move = moveById.get(count.moveId)!}
          <li><Localized text={move.name} /> <span aria-hidden="true">·</span> {t(data.lang, "moveCount", { count: count.count })}</li>
        {/each}
      </ul>
      {#if result.missingIntroduction}
        <p class="note">{t(data.lang, "sourceGap", { count: result.missingIntroduction })}</p>
      {/if}
      {#if result.rows.length}
        <div class="table-scroll" role="region" aria-labelledby="{id}-caption" tabindex="0">
          <table>
            <caption id="{id}-caption">{t(data.lang, "caption")}</caption>
            <thead>
              <tr>
                <th scope="col">{t(data.lang, "pokemon")}</th>
                {#each result.counts as count (count.moveId)}
                  <th scope="col"><Localized text={moveById.get(count.moveId)!.name} /></th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each result.rows as row (row.pokemon.pokemonId)}
                {@const name = names.get(row.pokemon.pokemonId)}
                <tr>
                  <th scope="row">
                    <a href={pokemonLink(row.pokemon.speciesId, row.pokemon.form, game.version.identifier)}>
                      <PokemonIcon speciesId={row.pokemon.speciesId} />
                      <span>
                        {#if name}<Localized text={name} />{:else}{t(data.lang, "unnamed", { id: row.pokemon.pokemonId })}{/if}
                      </span>
                    </a>
                    <small class="detail">
                      {t(data.lang, "number", { id: row.pokemon.speciesId })}
                      {#if row.pokemon.form}
                        <br />{t(data.lang, "form")} <code>{row.pokemon.form}</code>
                      {/if}
                    </small>
                  </th>
                  {#each row.moves as move (move.moveId)}
                    <td>
                      <ul class="methods">
                        {#each move.methods as method (method.learnMethodId)}
                          {@const methodName = methods.get(method.learnMethodId)}
                          {@const levels = method.learnMethodId === 1 ? method.levels : method.levels.filter((level) => level > 0)}
                          <li>
                            {#if methodName}
                              <Localized text={methodName} />
                            {:else if method.learnMethodId === 1}
                              {t(data.lang, "levelUp")}
                            {:else}
                              {t(data.lang, "missingMethod", { id: method.learnMethodId })}
                            {/if}
                            {#if levels.length === 1}
                              ({t(data.lang, "level", { level: levels[0]! })})
                            {:else if levels.length > 1}
                              ({t(data.lang, "levels", { levels: levels.join(", ") })})
                            {/if}
                          </li>
                        {/each}
                      </ul>
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p>{t(data.lang, "noResults")}</p>
      {/if}
    {/if}
  {/if}
</section>

<style>
  .filters { margin-block-end: 0.25rem; }
  .filter-field small { font-size: 0.875rem; }
  ul { padding: 0; list-style: none; }
  .suggestions, .selected { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 0.5rem 1rem; }
  .suggestions button, .selected li {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 2.75rem;
    padding: 0.25rem 0.75rem;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-pill);
    background: none;
    color: inherit;
    font: inherit;
  }
  .suggestions button:disabled { color: GrayText; cursor: default; }
  .selected li { padding-inline-end: 0.25rem; }
  .selected a { display: inline-flex; align-items: center; gap: 0.375rem; }
  .selected button {
    min-width: 2.75rem;
    min-height: 2.25rem;
    border: 0;
    background: none;
    color: inherit;
    font-size: 1.25rem;
    line-height: 1;
  }
  .per-move { display: grid; gap: 0.25rem; }
  .table-scroll:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  table { width: 100%; }
  caption { text-align: start; font-weight: 600; }
  th, td { vertical-align: top; }
  th[scope="row"] { min-width: 12rem; font-weight: normal; }
  th[scope="row"] a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; overflow-wrap: anywhere; }
  .detail { display: block; padding-inline-start: 3rem; }
  .detail code { white-space: normal; }
  .methods { margin: 0; display: grid; gap: 0.125rem; }
  td { min-width: 9rem; }
</style>
