<script lang="ts">
  import { asset } from "$app/paths";
  import type { AssetPath } from "$app/types";
  import { itemIconColumns, itemIconSlots } from "#lib/data/item-icons.ts";

  let { identifier }: { identifier: string } = $props();
  // Object.hasOwn: identifiers such as "constructor" must not hit prototype keys.
  const slot = $derived(Object.hasOwn(itemIconSlots, identifier) ? itemIconSlots[identifier] : undefined);
</script>

<span class="item-icon" aria-hidden="true">
  {#if slot === undefined}
    <span class="unavailable"></span>
  {:else}
    <span
      class="sprite"
      style:background-image={`url("${asset("item-icons/sheet.png" as AssetPath)}")`}
      style:background-position={`${-(slot % itemIconColumns) * 30}px ${-Math.floor(slot / itemIconColumns) * 30}px`}
    ></span>
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
  .sprite {
    width: 30px;
    height: 30px;
    background-repeat: no-repeat;
    image-rendering: pixelated;
  }
  .unavailable {
    width: 12px;
    height: 12px;
    border: var(--border-width) dashed currentColor;
    border-radius: 3px;
    opacity: 0.45;
  }
</style>
