<script lang="ts">
  import type { Language, NamedResource } from "../../../../../packages/pokemon-data/src/index.ts";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { buildMoveProperties, type BattleMove } from "#lib/data/move-properties.ts";
  import { t } from "#lib/i18n/move-properties.ts";

  let { lang, move, stats }: { lang: Language; move: BattleMove; stats: NamedResource[] } = $props();
  const id = $props.id();
  const properties = $derived(buildMoveProperties(move, stats, lang));
</script>

<section aria-labelledby={`${id}-heading`} aria-describedby={`${id}-scope`}>
  <h2 id={`${id}-heading`}>{t(lang, "heading")}</h2>
  <p class="note" id={`${id}-scope`}>{t(lang, "scope")}</p>
  <div class="detail-grid">
    <div class="detail-panel">
      <h3>{t(lang, "target")}</h3>
      <p>{#if properties.target}<Localized text={properties.target} />{:else}{t(lang, "missing")}{/if}</p>
    </div>
    <div class="detail-panel">
      <h3>{t(lang, "stats")}</h3>
      {#if properties.statChanges.length}
        <dl class="properties stat-changes">
          {#each properties.statChanges as change (change.id)}
            <dt><Localized text={change.name} /></dt>
            <dd>{change.stages}</dd>
          {/each}
        </dl>
      {:else}
        <p>{t(lang, "noStats")}</p>
      {/if}
    </div>
  </div>

  <div class="mechanic-group">
    <h3>{t(lang, "flags")}</h3>
    {#if properties.flags.length}
      <ul class="flag-list">
        {#each properties.flags as flag}<li><Localized text={flag} /></li>{/each}
      </ul>
    {:else}
      <p>{t(lang, "noFlags")}</p>
    {/if}
  </div>

  <div class="mechanic-group">
    <h3>{t(lang, "metadata")}</h3>
    {#if properties.metadata}
      <dl class="properties">
        <dt>{t(lang, "category")}</dt>
        <dd>{#if properties.metadata.category}<Localized text={properties.metadata.category} />{:else}{t(lang, "missing")}{/if}</dd>
        <dt>{t(lang, "ailment")}</dt>
        <dd>{#if properties.metadata.ailment}<Localized text={properties.metadata.ailment} />{:else}{t(lang, "missing")}{/if}</dd>
        {#each properties.metadata.rows as row (row.key)}
          <dt>{t(lang, row.key)}</dt><dd>{row.value}</dd>
        {/each}
      </dl>
      <p class="note">{t(lang, "chanceNote")}</p>
      <details class="metadata-raw">
        <summary>{t(lang, "raw")}</summary>
        <div class="raw-content">
          <p class="note">{t(lang, "rawNote")}</p>
          <dl class="properties">
            {#each properties.metadata.allRows as row (row.key)}
              <dt>{t(lang, row.key)}</dt><dd>{row.value}</dd>
            {/each}
          </dl>
        </div>
      </details>
    {:else}
      <p>{t(lang, "missingMetadata")}</p>
    {/if}
  </div>
</section>

<style>
  section { min-width: 0; }
  .detail-grid { gap: 0.75rem; }
  .detail-panel { min-width: 0; padding: var(--data-padding); border: 0; border-inline-start: var(--data-rule) solid var(--border-strong); border-radius: 0; background: var(--surface-muted); }
  .detail-panel h3, .mechanic-group > h3 { margin-block: 0 0.5rem; font-size: var(--data-label-size); font-weight: 600; }
  .detail-panel p { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
  .mechanic-group { margin-block-start: 1rem; }
  .flag-list { display: flex; flex-wrap: wrap; gap: 0.375rem; padding: 0; margin: 0; list-style: none; }
  .flag-list li { max-width: 100%; padding: 0.5rem 0.625rem; border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); font-size: var(--data-label-size); font-weight: 600; overflow-wrap: anywhere; }
  .properties { grid-template-columns: minmax(0, 16rem) minmax(0, 1fr); margin: 0; }
  .properties dd { font-variant-numeric: tabular-nums; }
  .stat-changes { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .stat-changes dd { color: var(--accent); }
  .metadata-raw { border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); }
  .metadata-raw summary { min-height: 2.75rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); font-size: var(--data-label-size); font-weight: 600; cursor: pointer; }
  .metadata-raw[open] summary { border-inline-start-color: var(--accent); border-block-end: var(--border-width) solid var(--border); }
  .raw-content { min-width: 0; padding: 0.75rem; }
  @media (max-width: 32rem) {
    .properties { grid-template-columns: minmax(0, 1fr); gap: 0; }
    .properties dt { padding-block-end: 0.125rem; }
    .properties dd { padding-block-start: 0; border-inline-start: var(--data-rule) solid var(--border-strong); }
    .properties dd:not(:last-child) { margin-block-end: 0.375rem; }
  }
</style>
