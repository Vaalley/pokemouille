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
            <li data-effect={row.multiplier === 0 ? "immune" : row.multiplier < 1 ? "resisted" : "weak"}>
              <TypeBadge typeId={row.typeId} name={name(row.typeId)} />
              <strong>×{row.multiplier}</strong>
            </li>
          {/each}
        </ul>
      {:else}<p>{none}</p>{/if}
    </section>
  {/each}
</div>

<style>
  .groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: 0.75rem; }
  section { min-width: 0; padding: 0.875rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-control); background: var(--surface); }
  :is(h2, h3, h4) { margin: 0 0 0.75rem; font-family: var(--font-heading); font-size: 1rem; line-height: 1.3; overflow-wrap: anywhere; }
  ul { display: grid; gap: 0.4rem; padding: 0; margin: 0; list-style: none; }
  li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.35rem 0.5rem; }
  strong { min-width: 3.25rem; padding: 0.1rem 0.4rem; border: 1px solid var(--border-strong); border-radius: var(--radius-control); text-align: center; font-variant-numeric: tabular-nums; }
  [data-effect="weak"] strong { border-width: var(--border-width); background: var(--accent-soft); }
  [data-effect="resisted"] strong { border-style: dashed; }
  [data-effect="immune"] strong { border-style: double; border-width: 3px; }
  p { margin: 0; color: var(--muted); }
</style>
