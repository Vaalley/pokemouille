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
  .detail-panel h3, .mechanic-group > h3 { margin-block: 0 0.75rem; font-size: 1rem; font-weight: 600; }
  .detail-panel p { margin: 0; overflow-wrap: anywhere; }
  .mechanic-group { margin-block-start: 1.75rem; }
  .flag-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: 0 1.5rem; padding: 0; margin: 0; list-style: none; }
  .flag-list li { min-width: 0; padding-block: 0.625rem; border-block-end: 1px solid var(--border); font-size: var(--data-label-size); font-weight: 600; overflow-wrap: anywhere; }
  .properties { max-width: var(--measure); grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); margin: 0; }
  .properties dd { font-variant-numeric: tabular-nums; }
  .stat-changes dd { color: var(--accent); }
  .metadata-raw { max-width: var(--measure); margin-block-start: 1.25rem; border-block: 1px solid var(--border); }
  .metadata-raw summary { min-height: 2.75rem; padding: 0.75rem 0.25rem; font-size: var(--data-label-size); font-weight: 600; cursor: pointer; overflow-wrap: anywhere; }
  .metadata-raw summary:hover { color: var(--accent); }
  .metadata-raw[open] summary { border-block-end: 1px solid var(--border); }
  .raw-content { min-width: 0; padding-block: 0.75rem 1rem; }
  .raw-content > .note { margin-block: 0 0.75rem; }
  @media (max-width: 32rem) {
    .properties:not(.stat-changes) { grid-template-columns: minmax(0, 1fr); gap: 0; }
    .properties:not(.stat-changes) dt { padding-block-end: 0.125rem; border-block-end: 0; }
    .properties:not(.stat-changes) dd { padding-block-start: 0; }
  }
</style>
