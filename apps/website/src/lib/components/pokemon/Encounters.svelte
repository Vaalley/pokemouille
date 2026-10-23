<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { NamedResource, PokemonReferences, PokemonVariety, ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import { resolveEncounters } from "#lib/data/encounters.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/encounters.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    varieties,
    pokemon,
    version,
    references,
    game,
  }: {
    lang: Language;
    varieties: PokemonVariety[];
    pokemon: Pick<ResolvedPokemon, "pokemonId" | "status">;
    version: string;
    references: Pick<PokemonReferences, "versions" | "encounterCoverage">;
    game: string;
  } = $props();

  const locations = $derived(resolveEncounters({ varieties, pokemon, version, references }));
  const stateMessage = $derived(locations.status === "rows" ? null : t(lang, `state.${locations.status}`, { game }));
  function name(resource: NamedResource) {
    return localize(resource.names, lang, resource.identifier);
  }
</script>

<section aria-labelledby="encounters-heading">
  <h2 id="encounters-heading">{t(lang, "heading")}</h2>
  <p class="game-scope">{t(lang, "game", { game })}</p>
  {#if stateMessage}
    <p>{stateMessage}</p>
    <p class="note">{t(lang, "limits")}</p>
  {:else}
    <details class="source-notes">
      <summary>{t(lang, "about")}</summary>
      {#if locations.variety}<p class="note">{t(lang, "scope", { variety: locations.variety.identifier })}</p>{/if}
      <p class="note">{t(lang, "rarityNote")}</p>
      <p class="note">{t(lang, "defaultNote")}</p>
      <p class="note">{t(lang, "limits")}</p>
    </details>
    <div class="encounter-groups">
      {#each locations.groups as group, index (`${group.location.id}:${group.area.id}:${group.method.id}`)}
        <details class="encounter-group" open={index === 0}>
          <summary>
            <span class="group-summary">
              <span class="group-location"><Localized text={name(group.location)} /></span>
              <span class="group-context">
                <span><Localized text={name(group.area)} /> · <Localized text={name(group.method)} /></span>
                <span class="group-count">{t(lang, "rowCount", { count: group.rows.length })}</span>
              </span>
            </span>
          </summary>
          <div class="group-body">
          <h3>
            <a href={resolve(`${lang}/location/${group.location.id}/?version=${encodeURIComponent(version)}` as PathnameWithSearchOrHash)}>
              <Localized text={name(group.location)} />
            </a>
          </h3>
          <p class="visually-hidden" id={`encounters-guide-${group.location.id}-${group.area.id}-${group.method.id}`}>
            <strong>{t(lang, "allRows", { count: group.rows.length })}</strong>
            <span>{t(lang, "scrollHint")}</span>
          </p>
          <div class="table-scroll" role="region" aria-label={`${name(group.location).text} · ${name(group.area).text} · ${t(lang, "table", { method: name(group.method).text })}`} aria-describedby={`encounters-guide-${group.location.id}-${group.area.id}-${group.method.id}`} tabindex="0">
            <table>
              <caption>{t(lang, "table", { method: name(group.method).text })}</caption>
              <thead>
                <tr>
                  <th scope="col">{t(lang, "levels")}</th>
                  <th scope="col">{t(lang, "rarity")}</th>
                  <th scope="col">{t(lang, "conditions")}</th>
                  <th scope="col">{t(lang, "slot")}</th>
                </tr>
              </thead>
              <tbody>
                {#each group.rows as row (row.id)}
                  <tr>
                    <td class="numeric">{row.minLevel === row.maxLevel ? row.minLevel : `${row.minLevel}–${row.maxLevel}`}</td>
                    <td class="numeric">{row.slot.rarity}%</td>
                    <td>
                      {#if row.conditions.length > 0}
                        <ul class="conditions">
                          {#each row.conditions as condition (condition.id)}
                            <li>
                              <Localized text={name(condition.condition)} />:
                              <Localized text={name(condition)} />
                              <small>({t(lang, condition.isDefault ? "default" : "nonDefault")})</small>
                            </li>
                          {/each}
                        </ul>
                      {:else}
                        {t(lang, "noConditions")}
                      {/if}
                      {#if row.sourceCounts.conditions > row.conditions.length}
                        <p class="note">{t(lang, "incompleteConditions")}</p>
                      {/if}
                    </td>
                    <td class="source">
                      <span>{row.slot.slot === null ? t(lang, "slotUnknown") : t(lang, "slotNumber", { slot: row.slot.slot })}</span>
                      <small>{t(lang, "sourceSlot", { id: row.slot.id })} · {t(lang, "sourceRow", { id: row.id })}</small>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          </div>
        </details>
      {/each}
    </div>
  {/if}
</section>

<style>
  .game-scope { padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); font-size: var(--data-label-size); font-weight: 600; overflow-wrap: anywhere; }
  section { min-width: 0; }
  .source-notes { margin-block: 0.75rem 1rem; padding: 0.25rem 0.75rem; border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .source-notes > summary { min-height: 2.75rem; padding: 0.5rem 0; border-radius: 0; font-size: var(--data-label-size); font-weight: 600; }
  .source-notes .note { margin-block: 0.5rem; }
  .encounter-groups { display: grid; gap: 0.75rem; }
  .encounter-group {
    min-width: 0;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-panel);
    background: var(--surface);
  }
  summary {
    min-height: 2.75rem;
    padding: 0.625rem 0.75rem;
    border-inline-start: var(--data-rule) solid var(--border-strong);
    border-radius: var(--radius-panel);
    background: var(--surface-muted);
    cursor: pointer;
  }
  details[open] > summary {
    border-block-end: var(--border-width) solid var(--border);
    border-inline-start-color: var(--accent);
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    background: var(--surface-muted);
  }
  .group-summary {
    display: inline-grid;
    gap: 0.375rem;
    width: calc(100% - 1.5rem);
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  .group-location { font-weight: 650; }
  .group-context { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.375rem 0.75rem; font-size: var(--data-label-size); font-weight: 600; }
  .group-count { color: var(--muted); font-variant-numeric: tabular-nums; }
  .group-body { min-width: 0; padding: 0.75rem; }
  h3 { margin-block: 0 0.625rem; font-size: 1rem; overflow-wrap: anywhere; }
  h3 a { display: inline-flex; align-items: center; min-height: 2.75rem; }
  .table-scroll {
    max-width: 100%;
    max-height: min(30rem, 65dvh);
    overflow: auto;
    scrollbar-gutter: stable;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-control);
    background: var(--surface);
  }
  .table-scroll:focus-visible { outline: var(--border-width) solid var(--focus-ring); outline-offset: 3px; }
  table { width: 100%; min-width: 38rem; border-collapse: separate; border-spacing: 0; text-align: start; }
  caption { padding: 0.5rem 0.75rem; text-align: start; font-size: 0.875rem; }
  th, td { padding: 0.625rem 0.75rem; vertical-align: top; border-block-end: var(--border-width) solid var(--border); }
  thead th {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    background: var(--surface-muted);
    color: var(--page-text);
    font-size: var(--data-label-size);
    font-weight: 600;
  }
  .numeric { white-space: nowrap; font-weight: 600; font-variant-numeric: tabular-nums; }
  .conditions { display: grid; gap: 0.375rem; margin: 0; padding: 0; list-style: none; }
  .conditions li { padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .source span, .source small { display: block; }
  .source small { margin-block-start: 0.25rem; }
  .note { font-size: 0.875rem; }
</style>
