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
                {entry.versions.map((version) => versionName(lang, version)).join(" / ")}
                {#if selected}<small>({historyT(lang, "entries.selected")})</small>{/if}
              </th>
              <td><Localized text={entry.text} /></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>{historyT(lang, "entries.empty")}</p>
    {/if}
  </details>
</section>

<style>
  table { width: 100%; }
  th[scope="row"] { font-weight: normal; vertical-align: top; }
  tr.selected th[scope="row"] { font-weight: bold; }
  summary { cursor: pointer; }
</style>
