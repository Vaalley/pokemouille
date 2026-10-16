<script module lang="ts">
  const TYPE_ICONS: Partial<Record<number, string>> = {
    1: "normal",
    2: "fighting",
    3: "flying",
    4: "poison",
    5: "ground",
    6: "rock",
    7: "bug",
    8: "ghost",
    9: "steel",
    10: "fire",
    11: "water",
    12: "grass",
    13: "electric",
    14: "psychic",
    15: "ice",
    16: "dragon",
    17: "dark",
    18: "fairy",
  };
</script>

<script lang="ts">
  import { asset } from "$app/paths";
  import type { AssetPath } from "$app/types";
  import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
  import Localized from "./pokemon/Localized.svelte";

  let { typeId, name }: { typeId: number; name: LocalizedText } = $props();
  const icon = $derived(TYPE_ICONS[typeId]);

  // Icons: MIT © James Watkins; see static/type-icons/LICENSE.
  // https://github.com/partywhale/pokemon-type-icons/tree/fcbe6978c61c359680bc07636c3f9bdc0f346b43
</script>

<span class="type-badge">
  {#if icon}
    <img src={asset(`/type-icons/${icon}.svg` as AssetPath)} alt="" width="22" height="22" />
  {/if}
  <span class="type-name"><Localized text={name} /></span>
</span>

<style>
  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.55rem;
    border: 1px solid currentColor;
    border-radius: 999px;
    color: inherit;
    font-size: 0.875rem;
    line-height: 1.3;
    vertical-align: middle;
  }

  img {
    flex: 0 0 22px;
    width: 22px;
    height: 22px;
  }

  .type-name {
    min-width: 0;
  }
</style>
