<script lang="ts" module>
  import type { MoveLearners } from "#lib/data/moveset.ts";

  // Shared across visits within the tab; a failed download is evicted so retry refetches.
  const learnerCache = new Map<number, Promise<MoveLearners>>();
</script>

<script lang="ts">
  import { onMount, tick } from "svelte";
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
  let selectedList = $state<HTMLUListElement>();
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
  async function remove(moveId: number) {
    const index = selection.ids.indexOf(moveId);
    update(selection.ids.filter((entry) => entry !== moveId));
    await tick();
    const buttons = selectedList?.querySelectorAll<HTMLButtonElement>("button");
    const next = buttons?.[Math.min(index, buttons.length - 1)];
    (next ?? searchInput)?.focus();
  }
  async function clear() {
    update([]);
    await tick();
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
<header class="page-heading">
  <h1>{t(data.lang, "heading")}</h1>
  <p>{t(data.lang, "intro", { max: MAX_MOVES })}</p>
</header>
<aside class="scope-notes" aria-label={t(data.lang, "scopeHeading")}>
  <p class="scope-title">{t(data.lang, "scopeHeading")}</p>
  <p class="note" id="{id}-scope">{t(data.lang, "scope")}</p>
  <p class="note">{t(data.lang, "obtainable")}</p>
  <p class="note legality">{t(data.lang, "legality")}</p>
</aside>

<section class="picker-panel" aria-labelledby="{id}-picker">
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
        aria-describedby="{id}-search-help {id}-limit"
        aria-controls="{id}-suggestions"
        disabled={!mounted}
        bind:this={searchInput}
        bind:value={query}
      />
      <small id="{id}-search-help">{t(data.lang, "searchHelp")}</small>
    </div>
  </form>
  <p id="{id}-limit" class:at-limit={full} class="selection-limit" role="status" aria-live="polite">
    {full ? t(data.lang, "full", { max: MAX_MOVES }) : t(data.lang, "limit", { max: MAX_MOVES })}
  </p>

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
                <span class="move-name"><Localized text={move.name} /></span>
                <small class="suggestion-action">{chosen ? t(data.lang, "added") : t(data.lang, "addShort")}</small>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>

  <div class="selection-heading">
    <h3 id="{id}-selected">{t(data.lang, "selected", { count: selection.ids.length, max: MAX_MOVES })}</h3>
    {#if selection.ids.length}
      <button class="clear-button" type="button" onclick={clear}>{t(data.lang, "reset")}</button>
    {/if}
  </div>
  {#if selection.ids.length}
    <ul class="selected" aria-labelledby="{id}-selected" bind:this={selectedList}>
      {#each selection.ids as moveId (moveId)}
        {@const move = moveById.get(moveId)!}
        <li>
          <a href={withVersion(`${data.lang}/move/${moveId}/`)}>
            <MoveIcon typeId={move.typeId} />
            <span class="move-name"><Localized text={move.name} /></span>
          </a>
          <button
            type="button"
            aria-label={t(data.lang, "remove", { move: move.name.text })}
            onclick={() => remove(moveId)}
          ><span aria-hidden="true">×</span></button>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty-selection">{t(data.lang, "noneSelected")}</p>
  {/if}
  {#if selection.invalid}
    <p class="note" role="status">{t(data.lang, "invalid", { max: MAX_MOVES })}</p>
  {/if}
</section>

<section class="results-panel" aria-labelledby="{id}-results" aria-describedby="{id}-scope">
  <h2 id="{id}-results">{t(data.lang, "table")}</h2>
  {#if !mounted}
    <p class="state-message" role="status">{t(data.lang, "loading")}</p>
    <noscript><p>{t(data.lang, "javascript")}</p></noscript>
  {:else if gamesFailed || (games && version && !game)}
    <p class="state-message error-message" role="alert">{t(data.lang, "gamesError")}</p>
  {:else if !selection.ids.length}
    <p class="state-message" role="status">{t(data.lang, "empty")}</p>
  {:else if loadFailed}
    <div class="state-message error-message">
      <p role="alert">{t(data.lang, "error")}</p>
      <button class="retry-button" type="button" onclick={() => attempt++}>{t(data.lang, "retry")}</button>
    </div>
  {:else if !game || !gameName || !result}
    <p class="state-message" role="status">{t(data.lang, "loading")}</p>
  {:else}
    <div class="result-summary" role="status" aria-live="polite" aria-atomic="true">
      <p class="matching-count">{t(data.lang, "count", { count: result.rows.length })}</p>
      <p class="game-context">{t(data.lang, "game")} <strong><Localized text={gameName} /></strong></p>
    </div>
    {#if game.coverageState.learnsets === "missing"}
      <p class="state-message">{t(data.lang, "noLearnsets")}</p>
    {:else}
      <h3 id="{id}-per-move">{t(data.lang, "perMove")}</h3>
      <ul class="per-move" aria-labelledby="{id}-per-move">
        {#each result.counts as count (count.moveId)}
          {@const move = moveById.get(count.moveId)!}
          <li><span><Localized text={move.name} /></span><strong>{t(data.lang, "moveCount", { count: count.count })}</strong></li>
        {/each}
      </ul>
      {#if result.missingIntroduction}
        <p class="note">{t(data.lang, "sourceGap", { count: result.missingIntroduction })}</p>
      {/if}
      {#if result.rows.length}
        <p class="note table-help" id="{id}-table-help">{t(data.lang, "tableHelp")}</p>
        <div class="table-scroll" role="region" aria-labelledby="{id}-caption" aria-describedby="{id}-table-help" tabindex="0">
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
                            <span class="method-name">
                              {#if methodName}
                                <Localized text={methodName} />
                              {:else if method.learnMethodId === 1}
                                {t(data.lang, "levelUp")}
                              {:else}
                                {t(data.lang, "missingMethod", { id: method.learnMethodId })}
                              {/if}
                            </span>
                            {#if levels.length === 1}
                              <span class="method-level">{t(data.lang, "level", { level: levels[0]! })}</span>
                            {:else if levels.length > 1}
                              <span class="method-level">{t(data.lang, "levels", { levels: levels.join(", ") })}</span>
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
        <p class="state-message">{t(data.lang, "noResults")}</p>
      {/if}
    {/if}
  {/if}
</section>

<style>
  .page-heading p { max-width: var(--measure); }
  .scope-notes {
    margin-block: 1.25rem;
    padding: 0.875rem 1rem;
    border-inline-start: var(--border-width) solid var(--accent);
    background: var(--surface-muted);
    border-radius: 0 var(--radius-control) var(--radius-control) 0;
  }
  .scope-title { margin: 0; font-weight: 700; }
  .scope-notes .note { margin-block: 0.5rem 0; }
  .scope-notes .legality { color: var(--page-text); font-weight: 600; }
  .picker-panel {
    min-width: 0;
    padding: 1rem;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-panel);
    background: var(--surface);
  }
  .picker-panel h2 { margin-block: 0 0.75rem; }
  .filters { margin-block-end: 0.25rem; }
  .filter-field, .filter-field input { min-width: 0; }
  .filter-field small, .selection-limit { font-size: 0.875rem; color: var(--muted); }
  .selection-limit { margin-block: 0.5rem 0.75rem; }
  .selection-limit.at-limit {
    padding: 0.5rem 0.75rem;
    border: var(--border-width) solid var(--accent);
    border-radius: var(--radius-control);
    background: var(--accent-soft);
    color: var(--page-text);
    font-weight: 600;
  }
  ul { padding: 0; list-style: none; }
  .suggestions { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: 0.375rem; margin-block: 0.5rem 1rem; }
  .suggestions li { min-width: 0; }
  .suggestions button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.375rem 0.625rem;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-control);
    background: var(--surface);
    text-align: start;
    cursor: pointer;
  }
  .suggestions button:not(:disabled):hover { border-color: var(--accent); background: var(--accent-soft); }
  .suggestions button:disabled { color: var(--muted); background: var(--surface-muted); cursor: default; }
  .move-name { min-width: 0; overflow-wrap: anywhere; }
  .suggestion-action { margin-inline-start: auto; flex-shrink: 0; font-size: 0.75rem; font-weight: 700; }
  .selection-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.375rem 1rem; margin-block-start: 1rem; }
  .selection-heading h3 { margin: 0; font-size: 1rem; }
  .clear-button, .retry-button {
    min-height: 2.75rem;
    max-width: 100%;
    padding: 0.375rem 0.75rem;
    white-space: normal;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .selected { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 0.75rem 0; }
  .selected li {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    max-width: 100%;
    min-width: 0;
    padding-inline-start: 0.625rem;
    border: var(--border-width) solid var(--border-strong);
    border-radius: var(--radius-control);
    background: var(--accent-soft);
  }
  .selected a { display: inline-flex; align-items: center; gap: 0.375rem; min-width: 0; min-height: 2.75rem; }
  .selected button {
    flex: 0 0 2.75rem;
    width: 2.75rem;
    min-height: 2.75rem;
    border: 0;
    border-inline-start: var(--border-width) solid var(--border);
    border-radius: 0 calc(var(--radius-control) - var(--border-width)) calc(var(--radius-control) - var(--border-width)) 0;
    background: transparent;
    color: inherit;
    font-size: 1.5rem;
    cursor: pointer;
  }
  .selected button:hover { background: var(--surface); }
  .empty-selection { margin-block-end: 0; padding: 0.75rem; border: var(--border-width) dashed var(--border); border-radius: var(--radius-control); color: var(--muted); }
  .results-panel { min-width: 0; margin-block-start: 1.75rem; }
  .results-panel h2 { margin-block-end: 0.75rem; }
  .state-message { padding: 1rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-control); background: var(--surface-muted); overflow-wrap: anywhere; }
  .state-message p { margin-block: 0 0.75rem; }
  .error-message { border-color: var(--border-strong); border-inline-start-color: var(--accent); }
  .result-summary { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 0.375rem 1rem; padding-block-end: 0.75rem; border-block-end: var(--border-width) solid var(--border); }
  .result-summary p { margin: 0; overflow-wrap: anywhere; }
  .matching-count { font-weight: 700; font-size: 1.125rem; }
  .game-context { font-size: 0.875rem; color: var(--muted); }
  .game-context strong { color: var(--page-text); }
  .per-move { display: flex; flex-wrap: wrap; gap: 0.375rem 0.75rem; }
  .per-move li { display: flex; flex-wrap: wrap; gap: 0.25rem 0.5rem; align-items: baseline; max-width: 100%; padding: 0.375rem 0.625rem; background: var(--surface-muted); border-radius: var(--radius-control); font-size: 0.875rem; overflow-wrap: anywhere; }
  .per-move strong { color: var(--accent); font-variant-numeric: tabular-nums; }
  .table-help { margin-block-end: 0.5rem; }
  .table-scroll { min-width: 0; border: var(--border-width) solid var(--border); border-radius: var(--radius-control); background: var(--surface); }
  table { width: 100%; border-spacing: 0; }
  caption { padding: 0.75rem; text-align: start; font-weight: 600; }
  th, td { padding: 0.625rem 0.75rem; vertical-align: top; }
  thead th { background: var(--surface-muted); text-align: start; }
  th[scope="row"] { min-width: 11rem; max-width: 16rem; font-weight: normal; }
  th[scope="row"] a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; overflow-wrap: anywhere; }
  .detail { display: block; padding-inline-start: 3rem; font-size: 0.75rem; color: var(--muted); }
  .detail code { white-space: normal; overflow-wrap: anywhere; }
  .methods { margin: 0; display: grid; gap: 0.5rem; }
  .methods li { display: grid; gap: 0.125rem; overflow-wrap: anywhere; }
  .method-name { font-size: 0.875rem; }
  .method-level { color: var(--muted); font-size: 0.75rem; font-variant-numeric: tabular-nums; }
  td { min-width: 10rem; }
  tbody tr:last-child :is(th, td) { border-block-end: 0; }
  tbody tr:hover { background: var(--accent-soft); }
  @media (max-width: 30rem) {
    .picker-panel { padding: 0.75rem; }
    .scope-notes { padding: 0.75rem; }
    .selected { display: grid; }
    .selected li { justify-content: space-between; }
    .per-move { display: grid; }
    .per-move li { justify-content: space-between; }
  }
</style>
