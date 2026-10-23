<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import { DEFAULT_VERSION, readPreference } from "#lib/data/context.ts";
  import { t } from "#lib/i18n/breeding.ts";
  import type { PageProps } from "./$types";
  let { data }: PageProps = $props();
  let saved = $state<string | null>(null);
  let mounted = $state(false);
  onMount(() => { saved = readPreference("version"); mounted = true; });
  const version = $derived((page.shallow?.url ?? page.url).searchParams.get("version") ?? (mounted ? saved ?? DEFAULT_VERSION : null));
</script>
<svelte:head><title>{t(data.lang, "index")} — Pokémouille</title></svelte:head>
<header class="page-header">
  <h1>{t(data.lang, "index")} <span class="group-count">{data.groups.length}</span></h1>
</header>
<aside class="source-notes" aria-label={t(data.lang, "sourceNotes")}>
  <p class="note">{t(data.lang, "current")}</p>
</aside>
<nav class="group-directory" aria-label={t(data.lang, "index")}>
  <ul>
    {#each data.groups as group (group.id)}
      <li>
        <a href={resolve(`${data.lang}/egg-group/${group.id}/${version ? `?${new URLSearchParams({ version })}` : ""}` as PathnameWithSearchOrHash)}>
          <span>{localize(group.names, data.lang, group.identifier).text}</span>
          <span class="arrow" aria-hidden="true">→</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  h1 { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.5rem; }
  .group-count { border-radius: var(--radius-control); padding-inline: 0.5rem; background: var(--surface-muted); color: var(--muted); font: 600 1rem/1.6 var(--font-body); font-variant-numeric: tabular-nums; }
  .source-notes { padding-inline-start: 0.75rem; border-inline-start: var(--border-width) solid var(--border-strong); margin-block-end: 1rem; }
  .source-notes p { margin: 0; }
  .group-directory { min-width: 0; }
  ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: 0.5rem; padding: 0; margin: 0; list-style: none; }
  li { min-width: 0; }
  a { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; min-height: 3rem; height: 100%; padding: 0.625rem 0.75rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-control); background: var(--surface); font-weight: 600; overflow-wrap: anywhere; }
  a:hover { background: var(--accent-soft); border-color: var(--accent); }
  a:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 3px; }
  .arrow { flex-shrink: 0; color: var(--muted); }
</style>
