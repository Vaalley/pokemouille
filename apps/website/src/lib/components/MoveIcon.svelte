<script module lang="ts">
  const TYPE_ICONS: Readonly<Record<number, string>> = {
    1: "tm-normal",
    2: "tm-fighting",
    3: "tm-flying",
    4: "tm-poison",
    5: "tm-ground",
    6: "tm-rock",
    7: "tm-bug",
    8: "tm-ghost",
    9: "tm-steel",
    10: "tm-fire",
    11: "tm-water",
    12: "tm-grass",
    13: "tm-electric",
    14: "tm-psychic",
    15: "tm-ice",
    16: "tm-dragon",
    17: "tm-dark",
    18: "tm-fairy",
  };
</script>

<script lang="ts">
  import ItemIcon from "./ItemIcon.svelte";

  let { typeId }: { typeId: number | null | undefined } = $props();
  // Illustrates the current source type, not TM learnability or historical disc art.
  const identifier = $derived(typeId == null ? "" : TYPE_ICONS[typeId] ?? "");
</script>

<ItemIcon {identifier} />
