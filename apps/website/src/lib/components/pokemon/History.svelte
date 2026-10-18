<script lang="ts">
  import type {
    PokemonReferences,
    SpeciesRecord,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
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
  {#each segments as segment, index (segment.from)}
    {#if index > 0}<span aria-hidden="true"> → </span>{/if}
    <span class="segment">
      <span class="range">{generationRange(lang, segment.from, segment.to, segment.to === latest)}:</span>
      {segment.value === null ? historyT(lang, "history.unknown") : integer.format(segment.value)}
    </span>
  {/each}
{/snippet}

<section aria-labelledby="history-heading">
  <h2 id="history-heading">{historyT(lang, "history.heading")}</h2>
  <p class="note">{historyT(lang, "history.scope")}</p>
  <p class="note">{historyT(lang, "history.incomplete")}</p>
  {#if !history.generations.length}
    <p>{historyT(lang, "history.unknownIntroduction")}</p>
  {:else}
    {#if !changed}<p>{historyT(lang, "history.none")}</p>{/if}
    <h3>{historyT(lang, "history.types")}</h3>
    <p class="timeline">
      {#each history.types as segment, index (segment.from)}
        {#if index > 0}<span aria-hidden="true"> → </span>{/if}
        <span class="segment">
          <span class="range">{generationRange(lang, segment.from, segment.to, segment.to === latest)}:</span>
          {#if segment.value === null}
            {historyT(lang, "history.unknown")}
          {:else}
            {#each segment.value as type, typeIndex (type.id)}
              {#if typeIndex > 0} / {/if}<Localized text={type.name} />
            {/each}
          {/if}
        </span>
      {/each}
    </p>

    <h3>{t(lang, "stats.base")}</h3>
    {#if history.stats.some((stat) => stat.id === 9)}
      <p class="note">{historyT(lang, "history.special")}</p>
    {/if}
    <dl class="definitions">
      {#each history.stats as stat (stat.id)}
        <div>
          <dt>{@render statName(stat)}</dt>
          <dd class="timeline">{@render numericTimeline(stat.base)}</dd>
        </div>
      {/each}
    </dl>

    <h3>{t(lang, "stats.effort")}</h3>
    <dl class="definitions">
      {#each history.stats as stat (stat.id)}
        <div>
          <dt>{@render statName(stat)}</dt>
          <dd class="timeline">{@render numericTimeline(stat.effort)}</dd>
        </div>
      {/each}
    </dl>

    <h3>{t(lang, "abilities.heading")}</h3>
    {#if history.abilities.length}
      <dl class="definitions">
        {#each history.abilities as ability (ability.slot)}
          <div>
            <dt>{historyT(lang, ability.isHidden ? "history.hiddenAbility" : "history.ability", { slot: ability.slot })}</dt>
            <dd class="timeline">
              {#each ability.segments as segment, index (segment.from)}
                {#if index > 0}<span aria-hidden="true"> → </span>{/if}
                <span class="segment">
                  <span class="range">{generationRange(lang, segment.from, segment.to, segment.to === latest)}:</span>
                  {#if segment.value === null}
                    {historyT(lang, "history.unknown")}
                  {:else if segment.value === "none"}
                    {historyT(lang, "history.noAbility")}
                  {:else}
                    <Localized text={segment.value.name} />
                  {/if}
                </span>
              {/each}
            </dd>
          </div>
        {/each}
      </dl>
    {:else}
      <p>{historyT(lang, "history.unknown")}</p>
    {/if}
  {/if}
</section>

<style>
  .timeline { line-height: 1.8; }
  .segment { display: inline-block; }
  .range { font-weight: 500; }
</style>
