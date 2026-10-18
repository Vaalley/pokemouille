<script lang="ts">
  import { Button, Command, Label } from "bits-ui";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { MAX_COMPARED, compareKey } from "#lib/data/compare.ts";
  import type { ComparedPokemon } from "#lib/data/compare.ts";
  import { getSearchIndex } from "#lib/data/loader.ts";
  import { t } from "#lib/i18n/compare.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t as pokemonText, versionName } from "#lib/i18n/pokemon.ts";
  import { buildSearchEntries } from "#lib/search/entries.ts";
  import type { PokemonSearchEntry } from "#lib/search/entries.ts";
  import { prepareSearchIndex, searchEntries } from "#lib/search/rank.ts";
  import type { PreparedIndex, SearchGame } from "#lib/search/rank.ts";

  let {
    lang,
    games,
    version,
    selected,
    onadd,
  }: {
    lang: Language;
    games: GameOption[] | null;
    version: string | null;
    /** `compareKey`s already compared. */
    selected: readonly string[];
    onadd: (entry: ComparedPokemon) => void;
  } = $props();

  const id = $props.id();
  let query = $state("");
  let input = $state<HTMLInputElement | null>(null);

  // Only the per-language Pokémon search index: no species files, no move/ability/item names.
  const NO_RESOURCES = { moves: [], abilities: [], items: [] };
  let index = $state.raw<{ lang: Language; prepared: PreparedIndex } | null>(null);
  let failedLang = $state<Language | null>(null);
  let pendingLang: Language | null = null;

  function ensureIndex(target: Language) {
    if (index?.lang === target || pendingLang === target) return;
    pendingLang = target;
    failedLang = null;
    getSearchIndex(target).then(
      (entries) => {
        // A newer language request supersedes this one.
        if (pendingLang !== target) return;
        pendingLang = null;
        index = {
          lang: target,
          prepared: prepareSearchIndex(buildSearchEntries(entries, NO_RESOURCES, target)),
        };
      },
      () => {
        if (pendingLang !== target) return;
        pendingLang = null;
        failedLang = target;
      },
    );
  }

  const hasQuery = $derived(query.trim() !== "");
  // Load once the visitor starts typing, and again if the language changes meanwhile.
  $effect(() => {
    if (hasQuery) ensureIndex(lang);
  });
  const status = $derived(
    index?.lang === lang ? "ready" : failedLang === lang ? "error" : "loading",
  );

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
  const full = $derived(selected.length >= MAX_COMPARED);

  const results = $derived(
    index && index.lang === lang && hasQuery && !full
      ? searchEntries(index.prepared, query, { game: searchGame, limit: 12 }).flatMap((result) =>
          result.entry.kind === "pokemon"
            ? [{ entry: result.entry, introduction: result.introduction }]
            : [],
        )
      : [],
  );

  const statusMessage = $derived.by(() => {
    if (full) return t(lang, "pickerFull", { max: MAX_COMPARED });
    if (!hasQuery) return t(lang, "pickerHint");
    if (status === "error") return t(lang, "pickerError");
    if (status === "loading") return t(lang, "pickerLoading");
    if (results.length === 0) return t(lang, "pickerEmpty", { query: query.trim() });
    return results.length === 1
      ? t(lang, "pickerCountOne")
      : t(lang, "pickerCountOther", { count: results.length });
  });

  function toCompared(entry: PokemonSearchEntry): ComparedPokemon {
    return { speciesId: entry.speciesId, form: entry.isDefault ? null : entry.identifier };
  }

  function add(entry: PokemonSearchEntry) {
    onadd(toCompared(entry));
    query = "";
    input?.focus();
  }
</script>

<Command.Root shouldFilter={false} vimBindings={false} label={t(lang, "pickerLabel")}>
  {#snippet child({ props })}
    {@const { role: _role, ...commandProps } = props}
    <div {...commandProps} class="compare-picker">
      <div class="filters">
        <div class="filter-field wide">
          <Label.Root for="{id}-input">{t(lang, "pickerLabel")}</Label.Root>
          <Command.Input
            id="{id}-input"
            bind:ref={input}
            bind:value={query}
            placeholder={t(lang, "pickerPlaceholder")}
            autocomplete="off"
            disabled={full}
            aria-describedby="{id}-status"
            onkeydown={(e) => {
              if (e.key === "Home" || e.key === "End") e.stopPropagation();
            }}
          />
        </div>
      </div>
      <p id="{id}-status" class="note" role="status" aria-live="polite">{statusMessage}</p>
      {#if hasQuery && status === "error" && !full}
        <p>
          <Button.Root type="button" onclick={() => ensureIndex(lang)}>{t(lang, "retry")}</Button.Root>
        </p>
      {/if}
      <Command.List class="compare-results" aria-label={t(lang, "pickerResults")} hidden={results.length === 0}>
        <Command.Viewport>
          {#each results as { entry, introduction } (entry.key)}
            {@const added = selected.includes(compareKey(toCompared(entry)))}
            <Command.Item value={entry.key} disabled={added} onSelect={() => add(entry)}>
              <span class="species-number">{pokemonText(lang, "identity.numberValue", { number: entry.speciesId })}</span>
              <PokemonIcon speciesId={entry.speciesId} />
              <span class="result-name">
                <Localized text={entry.name} />
                {#if entry.speciesName.text !== entry.name.text}
                  (<Localized text={entry.speciesName} />)
                {/if}
              </span>
              {#if added}
                <span class="note">{t(lang, "added")}</span>
              {:else if selectedGame && introduction === "not-introduced"}
                <span class="note">{t(lang, "resultNotIntroduced", { game: gameName })}</span>
              {:else if selectedGame && introduction === "unknown"}
                <span class="note">{t(lang, "resultUnknown", { game: gameName })}</span>
              {/if}
            </Command.Item>
          {/each}
        </Command.Viewport>
      </Command.List>
    </div>
  {/snippet}
</Command.Root>

<style>
  .compare-picker {
    max-width: 40rem;
  }

  .compare-picker .filters {
    margin-block-end: 0.25rem;
  }

  .compare-picker > p {
    margin-block: 0.25rem 0.5rem;
  }

  :global(.compare-results) {
    max-height: 20rem;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--border);
    list-style: none;
  }

  .result-name {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  :global(.compare-results [data-command-item]) {
    cursor: pointer;
  }

  :global(.compare-results [data-command-item][data-disabled]) {
    cursor: default;
    color: GrayText;
  }
</style>
