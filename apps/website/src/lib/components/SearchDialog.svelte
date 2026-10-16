<script lang="ts">
  import { onMount, tick } from "svelte";
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
  import { getReferences, getSearchIndex } from "#lib/data/loader.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/messages.ts";
  import { versionName } from "#lib/i18n/pokemon.ts";
  import { buildSearchEntries } from "#lib/search/entries.ts";
  import type { GlobalSearchEntry } from "#lib/search/entries.ts";
  import { prepareSearchIndex, searchEntries } from "#lib/search/rank.ts";
  import type { PreparedIndex, SearchGame, SearchResult } from "#lib/search/rank.ts";

  interface Props {
    lang: Language;
    /** Main-series games, `null` until loaded (or when loading failed). */
    games: GameOption[] | null;
    /** The header's resolved game, `null` until games and context are known. */
    version: string | null;
  }

  let { lang, games, version }: Props = $props();

  const id = $props.id();

  let isOpen = $state(false);
  let input = $state<HTMLInputElement | null>(null);
  let query = $state("");
  let shortcut = $state<{ label: string; keys: string } | null>(null);
  // Element focused before opening; focus goes back there on close.
  let previousFocus: HTMLElement | null = null;
  // One prepared index for the current language. Typing only reads it; loading happens
  // ahead of time (idle preload) or when the dialog opens.
  let index = $state.raw<{ lang: Language; prepared: PreparedIndex } | null>(null);
  let failedLang = $state<Language | null>(null);
  let pendingLang: Language | null = null;

  function ensureIndex(target: Language) {
    if (index?.lang === target || pendingLang === target) return;
    pendingLang = target;
    failedLang = null;
    Promise.all([getSearchIndex(target), getReferences()]).then(
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

  // Preload without competing with the page: when the browser is idle, again per language.
  $effect(() => {
    const target = lang;
    const run = () => ensureIndex(target);
    if (typeof requestIdleCallback === "function") {
      const handle = requestIdleCallback(run, { timeout: 4000 });
      return () => cancelIdleCallback(handle);
    }
    const handle = setTimeout(run, 2000);
    return () => clearTimeout(handle);
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
   * `?version=` while games load, else a context-free link the detail page resolves itself.
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
    if (!target) return resolve(`${lang}/pokemon/${entry.speciesId}/`);
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

  function isEditable(target: EventTarget | null): boolean {
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return true;
    }
    if (target instanceof HTMLElement && target.isContentEditable) return true;
    if (!(target instanceof Element)) return false;
    return (
      target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="listbox"], [role="option"], [data-select-trigger], [data-select-content], [data-dialog-content]',
      ) !== null
    );
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
    if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();
      if (isOpen) {
        input?.focus();
        input?.select();
      } else {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        isOpen = true;
        ensureIndex(lang);
      }
      return;
    }
    if (isOpen || event.ctrlKey || event.metaKey || event.altKey) return;
    // One printable, non-space character typed outside any editable field starts a search.
    if ([...event.key].length !== 1 || !/\S/u.test(event.key)) return;
    if (isEditable(event.target)) return;
    event.preventDefault();
    const seed = event.key;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    query = seed;
    isOpen = true;
    ensureIndex(lang);
    void tick().then(() => {
      input?.focus();
      input?.setSelectionRange(seed.length, seed.length);
    });
  }
  onMount(() => {
    // Keyboard hint only where a keyboard is likely; touch devices just tap the button.
    if (matchMedia("(any-pointer: fine)").matches) {
      shortcut = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
        ? { label: "⌘K", keys: "Meta+K" }
        : { label: "Ctrl+K", keys: "Control+K" };
    }
    window.addEventListener("keydown", handleWindowKeydown);
    return () => window.removeEventListener("keydown", handleWindowKeydown);
  });
</script>

<Dialog.Root
  bind:open={isOpen}
  onOpenChange={(next) => {
    if (next) ensureIndex(lang);
    else query = "";
  }}
>
  <Dialog.Trigger class="search-trigger" aria-keyshortcuts={shortcut?.keys}>
    {t(lang, "search.label")}
    {#if shortcut}<kbd aria-hidden="true">{shortcut.label}</kbd>{/if}
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      class="search-dialog"
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        input?.focus();
      }}
      onCloseAutoFocus={(e) => {
        if (previousFocus && previousFocus.isConnected) {
          e.preventDefault();
          previousFocus.focus();
        }
        previousFocus = null;
      }}
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
                  aria-describedby="{id}-status"
                  onkeydown={(e) => {
                    if (e.key === "Home" || e.key === "End") e.stopPropagation();
                  }}
                />
              </div>
              <p id="{id}-status" class="search-status" role="status" aria-live="polite">
                {statusMessage}
              </p>
              {#if status === "error"}
                <p>
                  <Button.Root type="button" onclick={retry}>{t(lang, "search.retry")}</Button.Root>
                </p>
              {/if}
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
                      <span class="search-result-kind">{t(lang, `search.kind.${entry.kind}`)}</span>
                      <span class="species-number">
                        {entry.kind === "pokemon" ? t(lang, "home.number", { number: entry.id }) : `#${entry.id}`}
                      </span>
                      {#if entry.kind === "pokemon"}
                        <PokemonIcon speciesId={entry.speciesId} />
                      {:else if entry.kind === "move"}
                        <MoveIcon typeId={entry.typeId} />
                      {:else if entry.kind === "ability"}
                        <AbilityIcon />
                      {:else}
                        <ItemIcon identifier={entry.identifier} />
                      {/if}
                      <span class="search-result-name">
                        <Localized text={entry.name} />
                        {#if entry.kind === "pokemon" && entry.speciesName.text !== entry.name.text}
                          (<Localized text={entry.speciesName} />)
                        {/if}
                      </span>
                      {#if selectedGame && result.introduction === "not-introduced"}
                        <span>{t(lang, "search.notIntroduced", { game: gameName })}</span>
                      {:else if selectedGame && result.introduction === "unknown"}
                        <span>{t(lang, "search.unknownIntroduction", { game: gameName })}</span>
                      {/if}
                    </Command.LinkItem>
                  {/each}
                </Command.Viewport>
              </Command.List>
            </div>
          {/snippet}
        </Command.Root>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
