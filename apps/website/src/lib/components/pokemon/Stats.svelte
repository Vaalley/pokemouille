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
      <p>{t(lang, "stats.special")}</p>
    {/if}
    <table>
      <caption>{t(lang, "stats.caption", { game })}</caption>
      <thead>
        <tr>
          <th scope="col">{t(lang, "stats.stat")}</th>
          <th scope="col">{t(lang, "stats.base")}</th>
          <th scope="col">{t(lang, "stats.effort")}</th>
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
            <td>
              {stat.value}
              <Meter.Root min={0} max={255} value={stat.value} aria-hidden="true"><span class="meter-fill" style="width: {(Math.min(255, stat.value) / 255) * 100}%"></span></Meter.Root>
            </td>
            <td>{stat.effort}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">{t(lang, "stats.total")}</th>
          <td>{stats.value.reduce((sum, stat) => sum + stat.value, 0)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  {:else}
    <p>{reasonText(lang, stats.reason)}</p>
  {/if}
</section>
