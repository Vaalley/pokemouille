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
  {:else}
    {#if locations.variety}
      <p class="note">{t(lang, "scope", { variety: locations.variety.identifier })}</p>
    {/if}
    <p class="note">{t(lang, "rarityNote")}</p>
    <p class="note">{t(lang, "defaultNote")}</p>
    <div class="encounter-groups">
      {#each locations.groups as group (`${group.location.id}:${group.area.id}:${group.method.id}`)}
        <div class="encounter-group">
          <h3>
            <a href={resolve(`${lang}/location/${group.location.id}/?version=${encodeURIComponent(version)}` as PathnameWithSearchOrHash)}>
              <Localized text={name(group.location)} />
            </a>
          </h3>
          <p class="area-method"><Localized text={name(group.area)} /> · <Localized text={name(group.method)} /></p>
          <div class="table-scroll" role="region" aria-label={t(lang, "table", { method: name(group.method).text })} tabindex="0">
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
      {/each}
    </div>
  {/if}
  <p class="note limits">{t(lang, "limits")}</p>
</section>

<style>
  .game-scope { font-weight: 600; }
  .encounter-groups { display: grid; gap: 1.5rem; }
  .encounter-group { min-width: 0; }
  h3 { margin-block: 0 0.25rem; }
  .area-method { margin-block: 0 0.75rem; }
  .table-scroll { max-width: 100%; overflow-x: auto; border: 1px solid var(--border, color-mix(in srgb, CanvasText 20%, Canvas)); border-radius: 0.5rem; }
  .table-scroll:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
  table { width: 100%; min-width: 38rem; border-collapse: collapse; text-align: start; }
  caption { padding: 0.5rem 0.75rem; text-align: start; font-size: 0.875rem; }
  th, td { padding: 0.625rem 0.75rem; vertical-align: top; }
  th { border-block: 1px solid color-mix(in srgb, CanvasText 20%, transparent); }
  tbody tr + tr { border-block-start: 1px solid color-mix(in srgb, CanvasText 15%, transparent); }
  .numeric { white-space: nowrap; font-variant-numeric: tabular-nums; }
  .conditions { margin: 0; padding-inline-start: 1.125rem; }
  .conditions li + li { margin-block-start: 0.25rem; }
  .source span, .source small { display: block; }
  .source small { margin-block-start: 0.25rem; }
  .note { font-size: 0.875rem; }
  .limits { margin-block-start: 1rem; }
</style>
