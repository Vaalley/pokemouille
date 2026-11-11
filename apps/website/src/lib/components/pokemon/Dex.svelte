<script lang="ts">
  import type {
    FlavorText,
    PokemonReferences,
    ResolvedPokemon,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { scrollable } from "#lib/actions/scrollable.ts";
  import { dexEntries, normalizeFlavorText } from "#lib/data/pokemon-history.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t as historyT } from "#lib/i18n/pokemon-history.ts";
  import { reasonText, t, versionName } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    flavorText,
    game,
    flavorTexts,
    references,
    versionId,
    formShared,
  }: {
    lang: Language;
    flavorText: ResolvedPokemon["flavorText"];
    /** The exact game the text was taken from (resolver context: exact version). */
    game: string;
    /** Every species entry; the source records them per species, not per form. */
    flavorTexts: readonly FlavorText[];
    references: Pick<PokemonReferences, "versions" | "versionGroups">;
    /** Exact selected version, marked in the list. */
    versionId: number;
    /** A non-default form is selected: say that it shares the species' entries. */
    formShared: boolean;
  } = $props();

  const text = $derived(
    flavorText.status === "available"
      ? {
          ...flavorText.value,
          text: normalizeFlavorText(flavorText.value.text, flavorText.value.sourceLanguageId),
        }
      : null,
  );
  const entries = $derived(dexEntries(flavorTexts, references, lang));
</script>

<section aria-labelledby="dex-heading">
  <h2 id="dex-heading">{t(lang, "dex.heading")}</h2>
  {#if text}
    <figure>
      <blockquote><p><Localized {text} /></p></blockquote>
      <figcaption>{t(lang, "dex.source", { game })}</figcaption>
    </figure>
  {:else if flavorText.status === "missing"}
    <p>{reasonText(lang, flavorText.reason)}</p>
  {/if}
  <details>
    <summary>{historyT(lang, "entries.summary", { count: entries.length })}</summary>
    <p class="note">{historyT(lang, "entries.scope")}</p>
    {#if formShared}
      <p class="note">{historyT(lang, "entries.form")}</p>
    {/if}
    {#if entries.length}
      <div class="entries-scroll" role="region" aria-label={historyT(lang, "entries.summary", { count: entries.length })} use:scrollable>
      <table>
        <caption>{historyT(lang, "entries.caption")}</caption>
        <thead>
          <tr>
            <th scope="col">{historyT(lang, "entries.games")}</th>
            <th scope="col">{historyT(lang, "entries.entry")}</th>
          </tr>
        </thead>
        <tbody>
          {#each entries as entry (entry.versions[0]!.id)}
            {@const selected = entry.versions.some((version) => version.id === versionId)}
            <tr class:selected>
              <th scope="row">
                <span class="entry-games">
                  {#each entry.versions as version (version.id)}
                    <span class="game-label">{versionName(lang, version)}</span>
                  {/each}
                </span>
                {#if selected}<small class="selected-label">{historyT(lang, "entries.selected")}</small>{/if}
              </th>
              <td><Localized text={entry.text} /></td>
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
    {:else}
      <p>{historyT(lang, "entries.empty")}</p>
    {/if}
  </details>
</section>

<style>
  section { min-width: 0; overflow-wrap: anywhere; }
  h2 { margin-block: 0 1rem; }
  figure { display: flex; flex-direction: column; gap: 0.75rem; margin: 0; }
  blockquote, blockquote p { margin: 0; }
  blockquote { max-width: 65ch; font-size: 1.0625rem; line-height: 1.7; overflow-wrap: anywhere; }
  figcaption { color: var(--muted); font-size: 0.875rem; line-height: 1.5; overflow-wrap: anywhere; }
  details { margin-block-start: 1.25rem; border-block-start: 1px solid var(--border); }
  summary { min-height: 2.75rem; padding-block: 0.75rem; font-weight: 600; cursor: pointer; overflow-wrap: anywhere; }
  summary:focus-visible, .entries-scroll:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 3px; border-radius: var(--radius-control); }
  .note { max-width: 75ch; margin-block: 0 0.75rem; line-height: 1.6; overflow-wrap: anywhere; }
  .entries-scroll { max-width: 100%; max-height: min(32rem, 70dvh); overflow: auto; overscroll-behavior: contain; }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; }
  caption { padding-block: 0 0.75rem; text-align: start; color: var(--muted); font-size: 0.875rem; line-height: 1.5; }
  th, td { padding: 0.875rem 0.75rem; overflow-wrap: anywhere; text-align: start; vertical-align: top; border-block-end: 1px solid var(--border); }
  thead th { position: sticky; top: 0; z-index: 1; background: var(--surface); color: var(--muted); font-size: var(--data-label-size); font-weight: 600; }
  thead th:first-child { width: 28%; }
  td { line-height: 1.7; }
  tbody tr:last-child > * { border-block-end: 0; }
  tr.selected > th { border-inline-start: var(--data-rule) solid var(--accent); background: var(--accent-soft); }
  th[scope="row"] { font-size: 0.875rem; font-weight: 600; line-height: 1.5; }
  .entry-games { display: flex; flex-direction: column; gap: 0.375rem; }
  .game-label { display: block; }
  .selected-label { display: block; margin-block-start: 0.5rem; color: var(--accent); font-size: 0.8125rem; line-height: 1.5; }
  @media (max-width: 38rem) {
    thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    tbody, tr, th, td { display: block; }
    tbody tr { border-block-end: 1px solid var(--border); }
    tbody tr:last-child { border-block-end: 0; }
    th, td { border-block-end: 0; padding: 0.75rem; }
    td { padding-block-start: 0.25rem; }
    .entry-games { flex-direction: row; flex-wrap: wrap; gap: 0.25rem 0.75rem; }
    .selected-label { margin-block-start: 0.375rem; }
  }
</style>
