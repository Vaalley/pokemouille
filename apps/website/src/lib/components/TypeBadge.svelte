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
  import { asset, resolve } from "$app/paths";
  import type { AssetPath, PathnameWithSearchOrHash } from "$app/types";
  import { page } from "$app/state";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import { typesHref } from "#lib/data/type-selection.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
  import Localized from "./pokemon/Localized.svelte";

  let { typeId, name, defendingTypes }: {
    typeId: number;
    name: LocalizedText;
    defendingTypes?: readonly number[];
  } = $props();
  const icon = $derived(TYPE_ICONS[typeId]);
  const selectedVersion = getSelectedVersion();
  const lang = $derived(page.params.lang as Language);
  const href = $derived(resolve(typesHref(lang, defendingTypes ?? [typeId], selectedVersion()) as PathnameWithSearchOrHash));

  // Icons: MIT © James Watkins; see static/type-icons/LICENSE.
  // https://github.com/partywhale/pokemon-type-icons/tree/fcbe6978c61c359680bc07636c3f9bdc0f346b43
</script>

<a class="type-badge" {href}>
  {#if icon}
    <img src={asset(`/type-icons/${icon}.svg` as AssetPath)} alt="" width="22" height="22" />
  {/if}
  <span class="type-name"><Localized text={name} /></span>
</a>

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
