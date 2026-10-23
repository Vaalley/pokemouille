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
  let mounted = $state(false);
  onMount(() => { mounted = true; getGames().then((loaded) => { games = loaded; }, () => { failed = true; }); });
  const context = $derived(games ? resolveContext({ url: page.shallow?.url ?? page.url, language: data.lang, games, savedVersion: readPreference("version") }) : null);
  const game = $derived(games?.find((entry) => entry.version.identifier === context?.version));
  const linkVersion = $derived(context?.version ?? (mounted ? (page.shallow?.url ?? page.url).searchParams.get("version") : null));
  const name = $derived(localize(data.group.names, data.lang, data.group.identifier).text);
  function href(path: string) { return resolve(path.slice(1) as PathnameWithSearchOrHash); }
</script>
<svelte:head><title>{name} — {t(data.lang, "index")} — Pokémouille</title></svelte:head>
<header class="page-header">
  <nav aria-label={t(data.lang, "index")}><a href={href(`/${data.lang}/egg-group/${linkVersion ? `?${new URLSearchParams({ version: linkVersion })}` : ""}`)}>← {t(data.lang, "index")}</a></nav>
  <h1>{name}</h1>
</header>
<aside class="source-notes" aria-label={t(data.lang, "sourceNotes")}>
  <p class="note">{t(data.lang, "current")}</p>
  <p class="note">{t(data.lang, "chronology")}</p>
  <p class="note">{t(data.lang, "formScope")}</p>
</aside>
<noscript><p>{t(data.lang, "nojs")}</p></noscript>
{#if failed}<p role="alert">{t(data.lang, "gameError")}</p>{:else if !game}<p role="status">{t(data.lang, "gamePending")}</p>{/if}
<section class="members" aria-labelledby="members-heading">
  <h2 id="members-heading">{t(data.lang, "members")} <span class="member-count">{data.members.length}</span></h2>
  <div class="member-table">
    <table>
      <thead><tr><th scope="col">Pokémon</th><th scope="col">{t(data.lang, "memberFacts")}</th></tr></thead>
      <tbody>
        {#each data.members as member (member.pokemonId)}
          {@const ratio = genderPercent(member.genderRate)}
          {@const status = game ? introductionStatus(member.generationId, member.introductionOrder, game.group) : null}
          {@const otherGroups = member.eggGroupIds.filter((id) => id !== data.group.id)}
          <tr>
            <th scope="row">
              <a class="member-link" href={href(linkVersion ? pokemonHref(data.lang, member.speciesId, { version: linkVersion, form: member.form }) : `/${data.lang}/pokemon/${member.speciesId}/${member.form ? `?${new URLSearchParams({ form: member.form })}` : ""}`)}>{member.names[data.lang].text}</a>
              <small>#{member.speciesId}</small>
            </th>
            <td>
              <dl class="member-facts">
                <div><dt>{t(data.lang, "gender")}</dt><dd>{ratio ? t(data.lang, "ratio", ratio) : member.genderRate === -1 ? t(data.lang, "genderless") : t(data.lang, "unknown")}</dd></div>
                <div>
                  <dt>{t(data.lang, "other")}</dt>
                  <dd>
                    {#if otherGroups.length}
                      <ul class="other-groups">
                        {#each otherGroups as id (id)}
                          {@const group = data.groups.find((entry) => entry.id === id)}
                          <li>{#if group}<a href={href(`/${data.lang}/egg-group/${id}/${linkVersion ? `?${new URLSearchParams({ version: linkVersion })}` : ""}`)}>{localize(group.names, data.lang, group.identifier).text}</a>{:else}{t(data.lang, "unknown")}{/if}</li>
                        {/each}
                      </ul>
                    {:else}<span class="note">{t(data.lang, "noOtherGroups")}</span>{/if}
                  </dd>
                </div>
                <div><dt>{t(data.lang, "chronologyLabel")}</dt><dd><span class:later={status === "not-introduced"} class:undated={status === "unknown"}>{status ? t(data.lang, status === "available" ? "introduced" : status === "not-introduced" ? "later" : "undated") : "—"}</span></dd></div>
              </dl>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
<style>
  .source-notes { margin-block: 0.75rem 1.25rem; padding-inline-start: 0.75rem; border-inline-start: var(--border-width) solid var(--border-strong); }
  .source-notes p { margin-block: 0.375rem; }
  .page-header nav a { display: inline-block; padding-block: 0.375rem; overflow-wrap: anywhere; }
  h1 { overflow-wrap: anywhere; }
  h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; }
  .member-count { padding-inline: 0.5rem; border-radius: var(--radius-control); background: var(--surface-muted); color: var(--muted); font: 600 0.875rem/1.6 var(--font-body); font-variant-numeric: tabular-nums; }
  .members, .member-table { min-width: 0; }
  .member-table { border: var(--border-width) solid var(--border); border-radius: var(--radius-control); background: var(--surface); }
  table { width: 100%; table-layout: fixed; border-collapse: collapse; overflow-wrap: anywhere; }
  thead { background: var(--surface-muted); }
  th, td { text-align: start; vertical-align: top; padding: 0.625rem 0.75rem; }
  thead th { font-size: 0.875rem; }
  th:first-child { width: 26%; }
  tbody th { font-weight: 600; }
  tbody tr + tr :is(th, td) { border-block-start: var(--border-width) solid var(--border); }
  tbody tr:focus-within { background: var(--accent-soft); }
  .member-link { display: inline-block; padding-block: 0.25rem; }
  small { display: block; color: var(--muted); font-size: 0.8125rem; font-weight: normal; font-variant-numeric: tabular-nums; }
  .member-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem 1rem; margin: 0; }
  .member-facts > div { min-width: 0; }
  dt { color: var(--muted); font-size: 0.8125rem; }
  dd { margin: 0.125rem 0 0; font-size: 0.9375rem; }
  .other-groups { display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; list-style: none; margin: 0; padding: 0; }
  .other-groups a { display: inline-block; padding-block: 0.25rem; }
  .later { color: var(--muted); }
  .undated { text-decoration: underline dotted; text-underline-offset: 0.2em; }
  a:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 3px; border-radius: var(--radius-control); }
  @media (max-width: 48rem) {
    .member-facts { grid-template-columns: minmax(0, 1fr); gap: 0.625rem; }
    th:first-child { width: 35%; }
    th, td { padding: 0.5rem; }
  }
</style>
