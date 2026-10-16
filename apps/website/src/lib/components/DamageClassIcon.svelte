<script module lang="ts">
  const DAMAGE_CLASS_ICONS: Partial<Record<number, string>> = {
    1: "status",
    2: "physical",
    3: "special",
  };
</script>

<script lang="ts">
  import { asset } from "$app/paths";
  import type { AssetPath } from "$app/types";

  let { damageClassId }: { damageClassId: number | null | undefined } = $props();
  const icon = $derived(damageClassId == null ? undefined : DAMAGE_CLASS_ICONS[damageClassId]);
  // Original game category sprites, vendored unchanged from Pokémon Showdown:
  // https://play.pokemonshowdown.com/sprites/categories/
  // Decorative only: callers supply the localized category name alongside them.
</script>

{#if icon}
  <img src={asset(`/damage-class-icons/${icon}.png` as AssetPath)} alt="" width="32" height="14" />
{/if}

<style>
  img {
    flex: 0 0 32px;
    width: 32px;
    height: 14px;
    image-rendering: pixelated;
    vertical-align: middle;
  }
</style>
