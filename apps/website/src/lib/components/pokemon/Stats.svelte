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
    <table>
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
          <tr>
            <th scope="row">{@render statName(stat)}</th>
            <td class="base">
              <span class="value">{stat.value}</span>
              <Meter.Root min={0} max={255} value={stat.value} aria-hidden="true"><span class="meter-fill" style="width: {(Math.min(255, stat.value) / 255) * 100}%"></span></Meter.Root>
            </td>
            <td class="numeric">{stat.effort}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">{t(lang, "stats.total")}</th>
          <td class="base"><span class="value">{stats.value.reduce((sum, stat) => sum + stat.value, 0)}</span></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    {#if ranges?.status === "computed"}
      <h3>{calc(lang, "rangesHeading")}</h3>
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
      <p class="note">{calc(lang, ranges.formula === "classic" ? "rangesClassic" : "rangesModern")}</p>
      <p class="note">{calc(lang, "rangesIndependent")}</p>
      {#if ranges.formula === "modern" && hasUnitHp}
        <p class="note">{calc(lang, "rangesShedinja")}</p>
      {/if}
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
  table { width: 100%; }
  .ranges td { white-space: nowrap; }
  .base { width: 100%; }
  td.base { white-space: nowrap; }
  /* Fixed-width, right-aligned values keep every meter starting at the same x. */
  .value { display: inline-block; min-width: 3ch; margin-inline-end: 0.5rem; text-align: end; font-variant-numeric: tabular-nums; }
  td.base :global([data-meter-root]) { width: calc(100% - 4ch); max-width: 12rem; }
  tfoot th, tfoot td { border-block-end: none; font-weight: bold; }
</style>
