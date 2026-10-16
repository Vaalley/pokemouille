<script lang="ts">
  import { asset } from "$app/paths";
  import type { AssetPath } from "$app/types";

  let { speciesId }: { speciesId: number } = $props();

  // Pokémon Showdown's sheet uses National Dex slots, 12 columns of 40 × 30px.
  // Only base species 1–1025 are supported; never display an unrelated form slot.
  const index = $derived(
    Number.isInteger(speciesId) && speciesId >= 1 && speciesId <= 1025 ? speciesId : 0,
  );
</script>

<span
  class="pokemon-icon"
  aria-hidden="true"
  style:background-image={`url("${asset("pokemon-icons.png" as AssetPath)}")`}
  style:background-position={`${-(index % 12) * 40}px ${-Math.floor(index / 12) * 30}px`}
></span>

<style>
  .pokemon-icon {
    display: inline-block;
    flex: 0 0 40px;
    width: 40px;
    height: 30px;
    background-repeat: no-repeat;
    image-rendering: pixelated;
    vertical-align: middle;
  }
</style>
