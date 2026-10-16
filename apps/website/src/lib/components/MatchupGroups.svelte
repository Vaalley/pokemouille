<script lang="ts">
  import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
  import TypeBadge from "./TypeBadge.svelte";

  let { groups, name, heading, none }: {
    groups: { label: string; rows: { typeId: number; multiplier: number }[] }[];
    name: (typeId: number) => LocalizedText;
    heading: "h2" | "h3" | "h4";
    none: string;
  } = $props();
</script>

<div class="groups">
  {#each groups as group (group.label)}
    <section aria-label={group.label}>
      <svelte:element this={heading}>{group.label}</svelte:element>
      {#if group.rows.length}
        <ul>
          {#each group.rows as row (row.typeId)}
            <li><TypeBadge typeId={row.typeId} name={name(row.typeId)} /><strong>×{row.multiplier}</strong></li>
          {/each}
        </ul>
      {:else}<p>{none}</p>{/if}
    </section>
  {/each}
</div>

<style>
  .groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: 0 2rem; }
  ul { display: grid; gap: 0.5rem; justify-items: start; padding: 0; margin: 0; list-style: none; }
  li { display: flex; align-items: center; gap: 0.5rem; }
  p { margin: 0; }
</style>
