<script lang="ts">
  import type {
    PokemonReferences,
    SpeciesRecord,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { scrollable } from "#lib/actions/scrollable.ts";
  import {
    hasRecordedChange,
    pokemonHistory,
    type Segment,
    type StatHistory,
  } from "#lib/data/pokemon-history.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { generationRange, t as historyT } from "#lib/i18n/pokemon-history.ts";
  import { t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    record,
    references,
    form,
  }: {
    lang: Language;
    record: SpeciesRecord;
    references: PokemonReferences;
    form?: string;
  } = $props();

  const history = $derived(pokemonHistory(record, references, {
    language: lang,
    ...(form === undefined ? {} : { form }),
  }));
  const latest = $derived(history.generations.at(-1));
  const changed = $derived(hasRecordedChange(history));
  const integer = $derived(new Intl.NumberFormat(lang));
</script>

{#snippet statName(stat: StatHistory)}
  {#if stat.id === 9 && stat.name.sourceLanguageId === null}
    {t(lang, "stat.special")}
  {:else}
    <Localized text={stat.name} />
  {/if}
{/snippet}

{#snippet numericTimeline(segments: Segment<number>[])}
  <ol class="timeline numeric-timeline" class:multi-segment={segments.length > 1}>
    {#each segments as segment (segment.from)}
      <li class="segment">
        <span class="range">{generationRange(lang, segment.from, segment.to, segment.to === latest)}:</span>
        <span class="value">{segment.value === null ? historyT(lang, "history.unknown") : integer.format(segment.value)}</span>
      </li>
    {/each}
  </ol>
{/snippet}

<section aria-labelledby="history-heading">
  <h2 id="history-heading">{historyT(lang, "history.heading")}</h2>
  <p class="note">{historyT(lang, "history.scope")}</p>
  <p class="note">{historyT(lang, "history.incomplete")}</p>
  {#if !history.generations.length}
    <p>{historyT(lang, "history.unknownIntroduction")}</p>
  {:else}
    {#if !changed}<p>{historyT(lang, "history.none")}</p>{/if}
    <div class="history-overview">
      <div class="history-panel">
        <h3>{historyT(lang, "history.types")}</h3>
        <ol class="timeline" class:multi-segment={history.types.length > 1}>
          {#each history.types as segment (segment.from)}
            <li class="segment">
              <span class="range">{generationRange(lang, segment.from, segment.to, segment.to === latest)}:</span>
              <span class="value">
                {#if segment.value === null}
                  {historyT(lang, "history.unknown")}
                {:else}
                  {#each segment.value as type, typeIndex (type.id)}
                    {#if typeIndex > 0} / {/if}<Localized text={type.name} />
                  {/each}
                {/if}
              </span>
            </li>
          {/each}
        </ol>
      </div>

      <div class="history-panel">
        <h3>{t(lang, "abilities.heading")}</h3>
        {#if history.abilities.length}
          <dl class="ability-slots">
            {#each history.abilities as ability (ability.slot)}
              <div>
                <dt>{historyT(lang, ability.isHidden ? "history.hiddenAbility" : "history.ability", { slot: ability.slot })}</dt>
                <dd>
                  <ol class="timeline" class:multi-segment={ability.segments.length > 1}>
                    {#each ability.segments as segment (segment.from)}
                      <li class="segment">
                        <span class="range">{generationRange(lang, segment.from, segment.to, segment.to === latest)}:</span>
                        <span class="value">
                          {#if segment.value === null}
                            {historyT(lang, "history.unknown")}
                          {:else if segment.value === "none"}
                            {historyT(lang, "history.noAbility")}
                          {:else}
                            <Localized text={segment.value.name} />
                          {/if}
                        </span>
                      </li>
                    {/each}
                  </ol>
                </dd>
              </div>
            {/each}
          </dl>
        {:else}
          <p>{historyT(lang, "history.unknown")}</p>
        {/if}
      </div>
    </div>

    <h3 id="history-stats-heading">{historyT(lang, "history.stats")}</h3>
    {#if history.stats.some((stat) => stat.id === 9)}
      <p class="note">{historyT(lang, "history.special")}</p>
    {/if}
    <div class="table-scroll history-stats-scroll" role="region" aria-labelledby="history-stats-heading" use:scrollable>
      <table class="history-stats" aria-labelledby="history-stats-heading">
        <thead>
          <tr>
            <th scope="col">{t(lang, "stats.stat")}</th>
            <th scope="col">{t(lang, "stats.heading")}</th>
            <th scope="col">{t(lang, "stats.effort")}</th>
          </tr>
        </thead>
        <tbody>
          {#each history.stats as stat (stat.id)}
            <tr>
              <th scope="row">{@render statName(stat)}</th>
              <td>{@render numericTimeline(stat.base)}</td>
              <td>{@render numericTimeline(stat.effort)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  section { min-width: 0; }

  .note {
    max-width: 75ch;
    margin-block: 0.5rem;
    color: var(--muted);
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .history-overview {
    display: grid;
    gap: 0.75rem;
    margin-block: 1rem;
  }

  .history-panel {
    min-width: 0;
    padding: 0.75rem;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-panel);
    background: var(--surface);
  }

  .history-panel h3 {
    margin-block: 0 0.625rem;
    font-size: 1rem;
  }

  .history-panel p {
    margin: 0;
  }

  .ability-slots {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: 0.75rem;
    margin: 0;
  }

  .ability-slots > div {
    min-width: 0;
  }

  .ability-slots dt {
    margin-block-end: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .ability-slots dd {
    margin: 0;
  }

  .timeline {
    display: grid;
    align-items: start;
    gap: 0.375rem;
    margin: 0;
    padding: 0;
    list-style: none;
    line-height: 1.4;
  }

  .segment {
    display: grid;
    gap: 0.25rem;
    max-width: 100%;
    padding: 0.5rem 0.625rem;
    border-inline-start: 0.1875rem solid var(--border-strong);
    background: var(--surface-muted);
  }

  .multi-segment .segment {
    border-inline-start-color: var(--accent);
  }

  .range {
    color: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .value {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 600;
  }

  .numeric-timeline .value {
    font-variant-numeric: tabular-nums;
  }

  .history-stats-scroll {
    min-width: 0;
  }

  .history-stats {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .history-stats th,
  .history-stats td {
    padding: 0.5rem;
    border-block-end: var(--border-width) solid var(--border);
    vertical-align: top;
    text-align: start;
    overflow-wrap: anywhere;
  }

  .history-stats th:first-child {
    width: 22%;
    padding-inline-start: 0.5rem;
    overflow-wrap: anywhere;
  }

  .history-stats tbody th {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .history-stats thead th {
    background: var(--surface-muted);
    font-size: 0.8125rem;
  }

  .history-stats tbody tr:last-child > * {
    border-block-end: 0;
  }

  @media (max-width: 30rem) {
    .history-panel { padding: 0.625rem; }
    .history-stats th,
    .history-stats td { padding: 0.5rem 0.25rem; }
    .history-stats th:first-child { width: 25%; padding-inline-start: 0.25rem; }
    .history-stats tbody th { font-size: 0.8125rem; }
    .numeric-timeline .segment { padding: 0.375rem 0.25rem; }
    .numeric-timeline .range { font-size: 0.75rem; }
  }

  @media (min-width: 56rem) {
    .history-overview {
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
      align-items: start;
    }
  }
</style>
