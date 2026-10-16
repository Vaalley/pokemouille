<script lang="ts">
  import { resolve } from "$app/paths";
  import type { NamedResource } from "../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import ItemIcon from "./ItemIcon.svelte";
  import Localized from "./pokemon/Localized.svelte";

  let {
    item,
    lang,
    version = null,
  }: { item: NamedResource; lang: Language; version?: string | null } = $props();

  const href = $derived(
    resolve(`${lang}/item/${item.id}/`) +
      (version ? `?${new URLSearchParams({ version })}` : ""),
  );
</script>

<a {href} class="item-link">
  <ItemIcon identifier={item.identifier} />
  <Localized text={localize(item.names, lang, item.identifier)} />
</a>

<style>
  .item-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    vertical-align: middle;
  }
</style>
