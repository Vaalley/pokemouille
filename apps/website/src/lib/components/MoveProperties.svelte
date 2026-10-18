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
  <dl class="properties">
    <dt>{t(lang, "target")}</dt>
    <dd>{#if properties.target}<Localized text={properties.target} />{:else}{t(lang, "missing")}{/if}</dd>
    <dt>{t(lang, "flags")}</dt>
    <dd>
      {#if properties.flags.length}
        <ul class="flag-list">
          {#each properties.flags as flag}<li><Localized text={flag} /></li>{/each}
        </ul>
      {:else}
        {t(lang, "noFlags")}
      {/if}
    </dd>
  </dl>

  <h3>{t(lang, "stats")}</h3>
  {#if properties.statChanges.length}
    <dl class="properties">
      {#each properties.statChanges as change (change.id)}
        <dt><Localized text={change.name} /></dt>
        <dd>{change.stages}</dd>
      {/each}
    </dl>
  {:else}
    <p>{t(lang, "noStats")}</p>
  {/if}

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
    <details>
      <summary>{t(lang, "raw")}</summary>
      <p class="note">{t(lang, "rawNote")}</p>
      <dl class="properties">
        {#each properties.metadata.allRows as row (row.key)}
          <dt>{t(lang, row.key)}</dt><dd>{row.value}</dd>
        {/each}
      </dl>
    </details>
  {:else}
    <p>{t(lang, "missingMetadata")}</p>
  {/if}
</section>

<style>
  .flag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
    padding-inline-start: 1.25rem;
    margin: 0;
  }
  .properties {
    grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
    overflow-wrap: anywhere;
  }
  @media (max-width: 32rem) {
    .properties { grid-template-columns: minmax(0, 1fr); gap: 0.25rem; }
    .properties dd { margin-block-end: 0.75rem; }
  }
</style>
