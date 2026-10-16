<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import TypeBadge from "#lib/components/TypeBadge.svelte";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import { typesHref } from "#lib/data/type-selection.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import { t as typeText } from "#lib/i18n/types.ts";

  let { lang, types }: {
    lang: Language;
    types: ResolvedPokemon["types"];
  } = $props();
  const selectedVersion = getSelectedVersion();
  const defendingTypes = $derived(types.status === "available" ? types.value.map((type) => type.id) : []);
</script>

<section aria-labelledby="types-heading">
  <h2 id="types-heading">{t(lang, "types.heading")}</h2>
  {#if types.status === "available"}
    <div class="types">
      {#each types.value as type (type.slot)}
        <TypeBadge typeId={type.id} name={type.name} {defendingTypes} />
      {/each}
    </div>
    <p><a href={resolve(typesHref(lang, defendingTypes, selectedVersion()) as PathnameWithSearchOrHash)}>{typeText(lang, "combined")}</a></p>
  {:else}
    <p>{reasonText(lang, types.reason)}</p>
  {/if}
</section>

<style>
  .types { display: flex; flex-wrap: wrap; gap: 0.5rem; }
</style>
