<script lang="ts">
  import type {
    FlavorText,
    PokemonReferences,
    ResolvedPokemon,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
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
      <div class="entries-scroll" role="region" aria-label={historyT(lang, "entries.summary", { count: entries.length })} tabindex="0">
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
  section { min-width: 0; }
  figure { margin: 0; padding: 1rem; border: var(--border-width) solid var(--border); border-inline-start: 0.25rem solid var(--accent); border-radius: var(--radius-panel); background: var(--surface); }
  blockquote, blockquote p { margin: 0; }
  blockquote { max-width: 65ch; line-height: 1.75; overflow-wrap: anywhere; }
  figcaption { margin-block-start: 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--muted); overflow-wrap: anywhere; }
  details { margin-block-start: 1rem; border-block-start: var(--border-width) solid var(--border); }
  summary { min-height: 2.75rem; padding-block: 0.75rem; font-weight: 600; cursor: pointer; overflow-wrap: anywhere; }
  .note { max-width: 75ch; margin-block: 0 0.75rem; line-height: 1.6; overflow-wrap: anywhere; }
  .entries-scroll { max-height: min(32rem, 70dvh); overflow: auto; overscroll-behavior: contain; border: var(--border-width) solid var(--border); border-radius: var(--radius-control); }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; }
  caption { padding: 0.75rem; text-align: start; color: var(--muted); font-size: 0.875rem; line-height: 1.5; }
  th, td { padding: 0.875rem; overflow-wrap: anywhere; text-align: start; vertical-align: top; border-block-end: var(--border-width) solid var(--border); }
  thead th { position: sticky; top: 0; z-index: 1; background: var(--surface); font-size: 0.875rem; }
  thead th:first-child { width: 30%; }
  td { line-height: 1.7; }
  tbody tr:last-child > * { border-block-end: 0; }
  tr.selected { background: var(--accent-soft); }
  th[scope="row"] { font-size: 0.875rem; font-weight: 600; line-height: 1.5; }
  .entry-games { display: flex; flex-direction: column; gap: 0.375rem; }
  .game-label { display: block; }
  .selected-label { display: inline-block; margin-block-start: 0.625rem; padding: 0.125rem 0.375rem; border: var(--border-width) solid var(--border-strong); border-radius: var(--radius-control); font-size: 0.75rem; line-height: 1.4; }
  @media (max-width: 30rem) {
    figure { padding: 0.75rem; }
    th, td { padding: 0.625rem 0.5rem; }
    thead th:first-child { width: 34%; }
    th[scope="row"] { font-size: 0.8125rem; }
  }
</style>
