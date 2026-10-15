<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import { pokemonHref } from "#lib/data/context.ts";
  import { t } from "#lib/i18n/messages.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const selectedVersion = getSelectedVersion();
</script>

<svelte:head>
  <title>{t(data.lang, "home.title")} – {t(data.lang, "site.name")}</title>
</svelte:head>

<h1>{t(data.lang, "home.title")}</h1>
<p>{t(data.lang, "home.intro")}</p>
<p>{t(data.lang, "home.count", { count: data.species.length })}</p>

<!-- Prerendered links are context-free; once the browser resolves the game they carry it. -->
<ol class="species-list" aria-label={t(data.lang, "home.listLabel")}>
  {#each data.species as species (species.id)}
    {@const version = selectedVersion()}
    <li>
      <a
        href={version
          ? resolve(
              pokemonHref(data.lang, species.id, { version }).slice(1) as PathnameWithSearchOrHash,
            )
          : resolve(`${data.lang}/pokemon/${species.id}/`)}
      >
        <span class="species-number">
          {t(data.lang, "home.number", { number: String(species.id).padStart(4, "0") })}
        </span>
        {species.name}
      </a>
    </li>
  {/each}
</ol>
