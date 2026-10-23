<script lang="ts">
  import { Meter } from "bits-ui";
  import type {
    LocalizedText,
    ResolvedPokemon,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { RANGE_LEVELS, statRanges, type MechanicsGame, type StatBounds } from "#lib/data/stat-formulas.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import { t as calc } from "#lib/i18n/stat-calc.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    stats,
    game,
    mechanicsGame,
  }: {
    lang: Language;
    stats: ResolvedPokemon["stats"];
    game: string;
    mechanicsGame: MechanicsGame;
  } = $props();

  // Stat 9 is the single Generation I "Special"; render exactly the resolver's layout.
  const SPECIAL_STAT_ID = 9;

  // The page supplies the exact game used to resolve these historical base stats.
  const ranges = $derived(
    stats.status === "available" ? statRanges(mechanicsGame, stats.value) : null,
  );
  const hasUnitHp = $derived(
    stats.status === "available" && stats.value.some((stat) => stat.id === 1 && stat.value === 1),
  );
  const integer = $derived(new Intl.NumberFormat(lang));
  const bounds = (value: StatBounds) =>
    value.min === value.max
      ? integer.format(value.min)
      : calc(lang, "range", { min: integer.format(value.min), max: integer.format(value.max) });
</script>

{#snippet statName(stat: { id: number; name: LocalizedText })}
  {#if stat.id === SPECIAL_STAT_ID && stat.name.sourceLanguageId === null}
    <!-- PokéAPI has no localized name for Generation I Special; this is our UI label. -->
    {t(lang, "stat.special")}
  {:else}
    <Localized text={stat.name} />
  {/if}
{/snippet}

<section aria-labelledby="stats-heading">
  <h2 id="stats-heading">{t(lang, "stats.heading")}</h2>
  {#if stats.status === "available"}
    {#if stats.value.some((stat) => stat.id === SPECIAL_STAT_ID)}
      <p class="note">{t(lang, "stats.special")}</p>
    {/if}
    <table class="stat-summary">
      <caption>{t(lang, "stats.caption", { game })}</caption>
      <thead>
        <tr>
          <th scope="col">{t(lang, "stats.stat")}</th>
          <th scope="col" class="base">{t(lang, "stats.base")}</th>
          <th scope="col" class="numeric">{t(lang, "stats.effort")}</th>
        </tr>
      </thead>
      <tbody>
        {#each stats.value as stat (stat.id)}
          <tr data-stat={stat.id}>
            <th scope="row">{@render statName(stat)}</th>
            <td class="base">
              <div class="stat-measure">
                <span class="value">{integer.format(stat.value)}</span>
                <Meter.Root min={0} max={255} value={stat.value} aria-hidden="true"><span class="meter-fill" style="width: {(Math.min(255, stat.value) / 255) * 100}%"></span></Meter.Root>
              </div>
            </td>
            <td class="numeric">{stat.effort}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">{t(lang, "stats.total")}</th>
          <td class="base"><span class="value">{integer.format(stats.value.reduce((sum, stat) => sum + stat.value, 0))}</span></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    {#if ranges?.status === "computed"}
      <div class="calculated-ranges">
      <h3 id="stat-ranges-heading">{calc(lang, "rangesHeading")}</h3>
      <div class="ranges-scroll" role="region" aria-labelledby="stat-ranges-heading" tabindex="0">
      <table class="ranges">
        <caption>{calc(lang, "rangesCaption", { game })}</caption>
        <thead>
          <tr>
            <th scope="col">{t(lang, "stats.stat")}</th>
            {#each RANGE_LEVELS as level (level)}
              <th scope="col" class="numeric">{calc(lang, "level", { level })}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each stats.value as stat, index (stat.id)}
            {@const row = ranges.rows[index]!}
            <tr>
              <th scope="row">{@render statName(stat)}</th>
              {#each RANGE_LEVELS as level (level)}
                <td class="numeric">{bounds(row.levels[level])}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
      </div>
      <p class="note">{calc(lang, ranges.formula === "classic" ? "rangesClassic" : "rangesModern")}</p>
      <p class="note">{calc(lang, "rangesIndependent")}</p>
      {#if ranges.formula === "modern" && hasUnitHp}
        <p class="note">{calc(lang, "rangesShedinja")}</p>
      {/if}
      </div>
    {:else if ranges?.status === "not-computed"}
      <p class="note">
        {calc(
          lang,
          ranges.reason === "go-power"
            ? "rangesGoPower"
            : ranges.reason === "effort-levels"
              ? "rangesEffortLevels"
              : "rangesSpecialGame",
          { game },
        )}
      </p>
    {/if}
  {:else}
    <p>{reasonText(lang, stats.reason)}</p>
  {/if}
</section>

<style>
  section { min-width: 0; }
  table { width: 100%; border-collapse: collapse; }
  caption { margin-block-end: 0.625rem; text-align: start; color: var(--muted); font-size: var(--data-label-size); }
  thead th { font-size: var(--data-label-size); font-weight: 600; }
  .stat-summary {
    --stat-color: var(--accent);
    table-layout: fixed;
  }
  .stat-summary th, .stat-summary td {
    vertical-align: middle;
    padding-block: 0.5rem;
    padding-inline-end: 0.5rem;
  }
  .stat-summary th:first-child { width: 30%; overflow-wrap: anywhere; }
  .stat-summary .numeric { width: 16%; padding-inline-end: 0; }
  .stat-summary tbody th { font-size: var(--data-label-size); font-weight: 600; }
  .stat-summary tbody .numeric { font-weight: 600; font-variant-numeric: tabular-nums; }
  .stat-summary tr[data-stat="1"] { --stat-color: light-dark(#ab565c, #d68b91); }
  .stat-summary tr[data-stat="2"] { --stat-color: light-dark(#a76b35, #d4a16f); }
  .stat-summary tr[data-stat="3"] { --stat-color: light-dark(#4e78a5, #8aadd2); }
  .stat-summary tr[data-stat="4"] { --stat-color: light-dark(#8464ab, #b39ad2); }
  .stat-summary tr[data-stat="5"] { --stat-color: light-dark(#438477, #83bcad); }
  .stat-summary tr[data-stat="6"] { --stat-color: light-dark(#a85e89, #d798bd); }
  .stat-summary tr[data-stat="9"] { --stat-color: light-dark(#8e7839, #c8b67a); }
  .base { width: 54%; }
  .stat-measure {
    display: grid;
    grid-template-columns: 3ch minmax(1.5rem, 1fr);
    align-items: center;
    gap: 0.625rem;
    font-size: 1.125rem;
  }
  .stat-measure {
    padding: 0.5rem 0.625rem;
    border-inline-start: var(--data-rule) solid var(--border-strong);
    background: var(--surface-muted);
  }
  .value {
    display: inline-block;
    min-width: 3ch;
    font-size: 1.125rem;
    font-weight: 700;
    text-align: end;
    font-variant-numeric: tabular-nums;
  }
  .stat-measure :global([data-meter-root]) {
    width: 100%;
    height: 0.625rem;
    border: none;
    background: var(--surface);
  }
  .stat-measure .meter-fill { background: var(--stat-color); }
  tfoot th, tfoot td {
    padding-block-start: 0.75rem;
    border-block-end: none;
    font-weight: 700;
  }
  tfoot .base .value { padding: 0.5rem 0.625rem; border-inline-start: var(--data-rule) solid var(--accent); background: var(--surface-muted); }
  .calculated-ranges {
    margin-block-start: 1.5rem;
    padding-block-start: 1.25rem;
    border-block-start: var(--border-width) solid var(--border);
  }
  .calculated-ranges h3 { margin-block: 0 0.625rem; font-size: 1rem; }
  .ranges-scroll { max-width: 100%; overflow-x: auto; border: var(--border-width) solid var(--border); border-radius: var(--radius-control); }
  .ranges-scroll:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 3px; }
  .ranges { min-width: 24rem; }
  .ranges th, .ranges td { padding: 0.625rem 0.75rem; border-block-end: var(--border-width) solid var(--border); }
  .ranges td { white-space: nowrap; font-weight: 600; font-variant-numeric: tabular-nums; }
  .ranges tbody th { font-size: var(--data-label-size); font-weight: 600; }
  .ranges tbody tr:last-child > * { border-block-end: none; }
  @media (forced-colors: active) {
    .stat-measure :global([data-meter-root]) { border: var(--border-width) solid CanvasText; }
    .stat-measure .meter-fill { background: CanvasText; }
  }
</style>
