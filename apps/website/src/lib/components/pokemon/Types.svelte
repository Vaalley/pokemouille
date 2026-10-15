<script lang="ts">
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  let { lang, types }: { lang: Language; types: ResolvedPokemon["types"] } = $props();
</script>

<section aria-labelledby="types-heading">
  <h2 id="types-heading">{t(lang, "types.heading")}</h2>
  {#if types.status === "available"}
    <ul class="inline-list">
      {#each types.value as type (type.slot)}
        <li><Localized text={type.name} /></li>
      {/each}
    </ul>
  {:else}
    <p>{reasonText(lang, types.reason)}</p>
  {/if}
</section>
