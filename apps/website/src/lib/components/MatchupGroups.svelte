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
  section { min-width: 0; padding: 0.75rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
  :is(h2, h3, h4) { margin: 0 0 0.625rem; font-size: var(--data-label-size); font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
  ul { display: grid; gap: 0.375rem; padding: 0; margin: 0; list-style: none; }
  li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.375rem 0.5rem; padding: 0.375rem 0.625rem; border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  li[data-effect="weak"] { border-inline-start-color: var(--accent); }
  li[data-effect="resisted"] { border-inline-start-style: dashed; }
  li[data-effect="immune"] { border-inline-start-style: double; }
  strong { min-width: 3.25rem; text-align: end; font-weight: 650; font-variant-numeric: tabular-nums; }
  p { margin: 0; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); color: var(--muted); font-size: var(--data-label-size); }
</style>
