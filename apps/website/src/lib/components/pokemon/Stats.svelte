<script lang="ts">
  import { Meter } from "bits-ui";
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    stats,
    game,
  }: { lang: Language; stats: ResolvedPokemon["stats"]; game: string } = $props();

  // Stat 9 is the single Generation I "Special"; render exactly the resolver's layout.
  const SPECIAL_STAT_ID = 9;
</script>

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
            <th scope="row">
              {#if stat.id === 9 && stat.name.sourceLanguageId === null}
                <!-- PokéAPI has no localized name for Generation I Special; this is our UI label. -->
                {t(lang, "stat.special")}
              {:else}
                <Localized text={stat.name} />
              {/if}
            </th>
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
  {:else}
    <p>{reasonText(lang, stats.reason)}</p>
  {/if}
</section>

<style>
  table { width: 100%; }
  .base { width: 100%; }
  td.base { white-space: nowrap; }
  /* Fixed-width, right-aligned values keep every meter starting at the same x. */
  .value { display: inline-block; min-width: 3ch; margin-inline-end: 0.5rem; text-align: end; font-variant-numeric: tabular-nums; }
  td.base :global([data-meter-root]) { width: calc(100% - 4ch); max-width: 12rem; }
  th[scope="row"], thead th { white-space: nowrap; }
  tfoot th, tfoot td { border-block-end: none; font-weight: bold; }
</style>
