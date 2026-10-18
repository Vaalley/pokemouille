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
  const version = $derived(mounted ? (page.shallow?.url ?? page.url).searchParams.get("version") ?? saved ?? DEFAULT_VERSION : null);
</script>
<svelte:head><title>{t(data.lang, "index")} — Pokémouille</title></svelte:head>
<header class="page-header"><h1>{t(data.lang, "index")}</h1></header>
<p class="note">{t(data.lang, "current")}</p>
<ul>
  {#each data.groups as group (group.id)}
    <li><a href={resolve(`${data.lang}/egg-group/${group.id}/${version ? `?${new URLSearchParams({ version })}` : ""}` as PathnameWithSearchOrHash)}>{localize(group.names, data.lang, group.identifier).text}</a></li>
  {/each}
</ul>
