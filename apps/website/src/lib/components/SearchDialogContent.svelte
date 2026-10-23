<script lang="ts">
  import { Button, Command, Dialog, Label } from "bits-ui";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import AbilityIcon from "#lib/components/AbilityIcon.svelte";
  import ItemIcon from "#lib/components/ItemIcon.svelte";
  import MoveIcon from "#lib/components/MoveIcon.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import { pokemonHref } from "#lib/data/context.ts";
  import { getSearchIndex, getSearchReferences } from "#lib/data/loader.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/messages.ts";
  import { versionName } from "#lib/i18n/pokemon.ts";
  import { buildSearchEntries } from "#lib/search/entries.ts";
  import type { GlobalSearchEntry } from "#lib/search/entries.ts";
  import { prepareSearchIndex, searchEntries } from "#lib/search/rank.ts";
  import type { PreparedIndex, SearchGame, SearchResult } from "#lib/search/rank.ts";

  interface Props {
    id: string;
    lang: Language;
    games: GameOption[] | null;
    version: string | null;
    isOpen: boolean;
    query: string;
    input: HTMLInputElement | null;
    onCloseAutoFocus: (event: Event) => void;
  }

  let {
    id,
    lang,
    games,
    version,
    isOpen = $bindable(),
    query = $bindable(),
    input = $bindable(),
    onCloseAutoFocus,
  }: Props = $props();

  // This component stays mounted after its first load, preserving the prepared index.
  let index = $state.raw<{ lang: Language; prepared: PreparedIndex } | null>(null);
  let failedLang = $state<Language | null>(null);
  let pendingLang: Language | null = null;

  function ensureIndex(target: Language) {
    if (index?.lang === target || pendingLang === target) return;
    pendingLang = target;
    failedLang = null;
    Promise.all([getSearchIndex(target), getSearchReferences()]).then(
      ([entries, references]) => {
        // A newer language request supersedes this one.
        if (pendingLang !== target) return;
        pendingLang = null;
        index = { lang: target, prepared: prepareSearchIndex(buildSearchEntries(entries, references, target)) };
      },
      () => {
        if (pendingLang !== target) return;
        pendingLang = null;
        failedLang = target;
      },
    );
  }

  const status = $derived(
    index?.lang === lang ? "ready" : failedLang === lang ? "error" : "loading",
  );

  // Load on open, and again if the language changes while it stays open.
  $effect(() => {
    if (isOpen) ensureIndex(lang);
  });

  const groupOrders = $derived.by(() => {
    const orders = new Map<number, number>();
    for (const game of games ?? []) {
      orders.set(game.group.id, game.group.order);
      for (const expansion of game.expansions) {
        if (expansion.group) orders.set(expansion.group.id, expansion.group.order);
      }
    }
    return orders;
  });
  const selectedGame = $derived(
    games && version ? (games.find((game) => game.version.identifier === version) ?? null) : null,
  );
  const searchGame = $derived<SearchGame | null>(
    selectedGame
      ? {
          generationId: selectedGame.group.generationId,
          order: selectedGame.group.order,
          groupOrders,
        }
      : null,
  );
  const gameName = $derived(selectedGame ? versionName(lang, selectedGame.version) : "");

  const hasQuery = $derived(query.trim() !== "");
  const results = $derived<SearchResult[]>(
    index && index.lang === lang && hasQuery
      ? searchEntries(index.prepared, query, { game: searchGame })
      : [],
  );
  const statusMessage = $derived.by(() => {
    if (status === "error") return t(lang, "search.error");
    if (status === "loading") return t(lang, "search.loading");
    if (!hasQuery) return t(lang, "search.hint");
    if (results.length === 0) return t(lang, "search.empty", { query: query.trim() });
    return results.length === 1
      ? t(lang, "search.count.one")
      : t(lang, "search.count.other", { count: results.length });
  });

  /**
   * Detail-page link keeping the current game: the header's resolved game, else the URL's
   * `?version=` while games load, else let the detail page resolve the game. Always keep the form.
   */
  function hrefFor(entry: GlobalSearchEntry): string {
    const target = version ?? page.url.searchParams.get("version");
    if (entry.kind !== "pokemon") {
      const path = entry.kind === "move"
        ? resolve(`${lang}/move/${entry.id}/`)
        : entry.kind === "ability"
          ? resolve(`${lang}/ability/${entry.id}/`)
          : resolve(`${lang}/item/${entry.id}/`);
      const params = new URLSearchParams();
      if (target) params.set("version", target);
      return path + (params.size ? `?${params}` : "");
    }
    const path = pokemonHref(lang, entry.speciesId, {
      version: target,
      form: entry.isDefault ? null : entry.identifier,
    });
    return resolve(path.slice(1) as PathnameWithSearchOrHash);
  }

  function navigate(href: string) {
    isOpen = false;
    query = "";
    void goto(href);
  }

  function retry() {
    ensureIndex(lang);
    input?.focus();
  }

  // Plain left clicks navigate in-app; modified and middle clicks keep native link behavior.
  function onResultClick(event: MouseEvent, href: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(href);
  }
</script>

<Dialog.Portal>
  <Dialog.Overlay />
  <Dialog.Content
    class="search-dialog"
    onOpenAutoFocus={(e) => {
      e.preventDefault();
      input?.focus();
      input?.setSelectionRange(query.length, query.length);
    }}
    {onCloseAutoFocus}
  >
    <div class="search-dialog-body">
      <div class="search-dialog-header">
        <Dialog.Title id="{id}-title">{t(lang, "search.label")}</Dialog.Title>
        <Dialog.Close>{t(lang, "search.close")}</Dialog.Close>
      </div>
      <Command.Root shouldFilter={false} vimBindings={false} label={t(lang, "search.label")}>
        {#snippet child({ props })}
          {@const { role: _role, ...commandProps } = props}
          <div {...commandProps} class="search-command">
            <div class="search-field">
              <Label.Root for="{id}-input">{t(lang, "search.input")}</Label.Root>
              <Command.Input
                id="{id}-input"
                bind:ref={input}
                bind:value={query}
                placeholder={t(lang, "search.placeholder")}
                aria-describedby="{id}-status"
                onkeydown={(e) => {
                  if (e.key === "Home" || e.key === "End") e.stopPropagation();
                }}
              />
            </div>
            <div class="search-status-region" class:search-feedback={results.length === 0}>
              <p id="{id}-status" class="search-status" role="status" aria-live="polite">
                {statusMessage}
              </p>
              {#if status === "error"}
                <p>
                  <Button.Root type="button" onclick={retry}>{t(lang, "search.retry")}</Button.Root>
                </p>
              {/if}
            </div>
            <Command.List
              class="search-results"
              aria-label={t(lang, "search.results")}
              hidden={results.length === 0}
            >
              <Command.Viewport>
                {#each results as result (result.entry.key)}
                  {@const entry = result.entry}
                  {@const href = hrefFor(entry)}
                  <Command.LinkItem
                    value={entry.key}
                    {href}
                    tabindex={-1}
                    onclick={(e) => onResultClick(e, href)}
                  >
                    <span class="search-result-icon">
                      {#if entry.kind === "pokemon"}
                        <PokemonIcon speciesId={entry.speciesId} />
                      {:else if entry.kind === "move"}
                        <MoveIcon typeId={entry.typeId} />
                      {:else if entry.kind === "ability"}
                        <AbilityIcon />
                      {:else}
                        <ItemIcon identifier={entry.identifier} />
                      {/if}
                    </span>
                    <span class="search-result-body">
                      <span class="search-result-name">
                        <Localized text={entry.name} />
                      </span>
                      <span class="search-result-meta">
                        <span class="search-result-kind">{t(lang, `search.kind.${entry.kind}`)}</span>
                        <span class="species-number">
                          {entry.kind === "pokemon" ? t(lang, "home.number", { number: entry.id }) : `#${entry.id}`}
                        </span>
                        {#if entry.kind === "pokemon" && entry.speciesName.text !== entry.name.text}
                          <span><Localized text={entry.speciesName} /></span>
                        {/if}
                      </span>
                      {#if selectedGame && result.introduction === "not-introduced"}
                        <span class="search-result-note">{t(lang, "search.notIntroduced", { game: gameName })}</span>
                      {:else if selectedGame && result.introduction === "unknown"}
                        <span class="search-result-note">{t(lang, "search.unknownIntroduction", { game: gameName })}</span>
                      {/if}
                    </span>
                  </Command.LinkItem>
                {/each}
              </Command.Viewport>
            </Command.List>
          </div>
        {/snippet}
      </Command.Root>
      <div class="search-keyboard-hints">
        <span><kbd>↑</kbd> <kbd>↓</kbd> {t(lang, "search.navigate")}</span>
        <span><kbd>Enter</kbd> {t(lang, "search.open")}</span>
        <span><kbd>Esc</kbd> {t(lang, "search.close")}</span>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Portal>

<style>
  .search-dialog-header { padding-block-end: 0.625rem; border-block-end: var(--border-width) solid var(--border); }
  .search-dialog-header :global([data-dialog-title]) { font-size: 1rem; font-weight: 650; }
  .search-field { padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .search-field:focus-within { border-inline-start-color: var(--accent); }
  .search-field :global(label) { font-size: var(--data-label-size); font-weight: 600; }
  .search-field :global(input) { min-height: 2.75rem; background: var(--surface); }
  .search-command > .search-feedback { flex: 0 0 auto; align-items: start; justify-content: start; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); border-radius: 0; text-align: start; }
  .search-status { font-size: var(--data-label-size); }
  .search-command :global(.search-results) { padding: 0.375rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); }
  .search-command :global(.search-results a[data-command-item]) { margin-block: 0.375rem; padding: 0.5rem 0.625rem; border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .search-command :global(.search-results a[data-command-item]:is([data-selected], :hover, :focus-visible)) { border-inline-start-color: var(--accent); background: var(--accent-soft); outline: none; }
  .search-command :global(.search-results a[data-command-item]:focus-visible) { outline: 2px solid var(--focus-ring); outline-offset: -2px; }
  .search-result-icon { border-radius: 0; background: transparent; }
  .search-result-name { font-size: 1rem; font-weight: 650; }
  .search-result-meta { font-size: var(--data-label-size); font-weight: 600; }
  .search-result-kind { padding: 0; border: 0; border-radius: 0; }
  .search-result-note { padding-block-start: 0.25rem; border-block-start: var(--border-width) solid var(--border); font-size: var(--data-label-size); }
  .search-keyboard-hints { font-size: var(--data-label-size); }
  @media (forced-colors: active) {
    .search-command :global(.search-results a[data-command-item][data-selected]) { border-inline-start-color: Highlight; outline: 1px solid Highlight; outline-offset: -1px; }
  }
</style>
