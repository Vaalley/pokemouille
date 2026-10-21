<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../../packages/pokemon-data/src/localization.ts";
  import { introductionStatus } from "../../../../../../../packages/pokemon-data/src/resolve.ts";
  import { genderPercent } from "#lib/data/breeding.ts";
  import { pokemonHref, readPreference, resolveContext } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import { t } from "#lib/i18n/breeding.ts";
  import type { PageProps } from "./$types";
  let { data }: PageProps = $props();
  let games = $state<GameOption[] | null>(null);
  let failed = $state(false);
  onMount(() => { getGames().then((loaded) => { games = loaded; }, () => { failed = true; }); });
  const context = $derived(games ? resolveContext({ url: page.shallow?.url ?? page.url, language: data.lang, games, savedVersion: readPreference("version") }) : null);
  const game = $derived(games?.find((entry) => entry.version.identifier === context?.version));
  const name = $derived(localize(data.group.names, data.lang, data.group.identifier).text);
  function href(path: string) { return resolve(path.slice(1) as PathnameWithSearchOrHash); }
</script>
<svelte:head><title>{name} — {t(data.lang, "index")} — Pokémouille</title></svelte:head>
<header class="page-header"><p><a href={href(`/${data.lang}/egg-group/${context ? `?${new URLSearchParams({ version: context.version })}` : ""}`)}>{t(data.lang, "index")}</a></p><h1>{name}</h1></header>
<p class="note">{t(data.lang, "current")}</p>
<p class="note">{t(data.lang, "chronology")}</p>
<p class="note">{t(data.lang, "formScope")}</p>
<noscript><p>{t(data.lang, "nojs")}</p></noscript>
{#if failed}<p role="alert">{t(data.lang, "gameError")}</p>{:else if !game}<p role="status">{t(data.lang, "gamePending")}</p>{/if}
<h2>{t(data.lang, "members")}</h2>
<div class="table-scroll">
  <table>
    <thead><tr><th>Pokémon</th><th>{t(data.lang, "gender")}</th><th>{t(data.lang, "other")}</th><th>{t(data.lang, "chronology")}</th></tr></thead>
    <tbody>
      {#each data.members as member (member.pokemonId)}
        {@const ratio = genderPercent(member.genderRate)}
        {@const status = game ? introductionStatus(member.generationId, member.introductionOrder, game.group) : null}
        <tr>
          <td><a href={href(context ? pokemonHref(data.lang, member.speciesId, { version: context.version, form: member.form }) : `/${data.lang}/pokemon/${member.speciesId}/${member.form ? `?${new URLSearchParams({ form: member.form })}` : ""}`)}>{member.names[data.lang].text}</a> <small>#{member.speciesId}</small></td>
          <td>{ratio ? t(data.lang, "ratio", ratio) : member.genderRate === -1 ? t(data.lang, "genderless") : t(data.lang, "unknown")}</td>
          <td>{#each member.eggGroupIds.filter((id) => id !== data.group.id) as id (id)}
            {@const group = data.groups.find((entry) => entry.id === id)}
            {#if group}<a href={href(`/${data.lang}/egg-group/${id}/${context ? `?${new URLSearchParams({ version: context.version })}` : ""}`)}>{localize(group.names, data.lang, group.identifier).text}</a>{/if}
          {/each}</td>
          <td>{status ? t(data.lang, status === "available" ? "introduced" : status === "not-introduced" ? "later" : "undated") : "—"}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<style>
  .table-scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: start; padding: 0.6rem; border-block-end: var(--border-width) solid var(--border); }
  small { white-space: nowrap; }
</style>
