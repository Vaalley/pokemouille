<script lang="ts">
  import { asset } from "$app/paths";
  import type { AssetPath } from "$app/types";
  import { itemIconIdentifiers } from "#lib/data/item-icons.ts";

  let { identifier }: { identifier: string } = $props();
  let failedIdentifier = $state<string | null>(null);
  const available = $derived(itemIconIdentifiers[identifier] === true && failedIdentifier !== identifier);
</script>

<span class="item-icon" aria-hidden="true">
  {#if available}
    <img
      src={asset(`item-icons/${identifier}.png` as AssetPath)}
      alt=""
      width="30"
      height="30"
      loading="lazy"
      onerror={() => { failedIdentifier = identifier; }}
    />
  {:else}
    <span class="unavailable"></span>
  {/if}
</span>

<style>
  .item-icon {
    display: inline-flex;
    flex: 0 0 30px;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    vertical-align: middle;
  }
  img {
    width: 30px;
    height: 30px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .unavailable {
    width: 12px;
    height: 12px;
    border: 1px dashed currentColor;
    border-radius: 3px;
    opacity: 0.45;
  }
</style>
