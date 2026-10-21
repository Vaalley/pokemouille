<script lang="ts">
  import AbilityIcon from "#lib/components/AbilityIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import RelatedPokemon from "#lib/components/RelatedPokemon.svelte";
  import { t } from "#lib/i18n/ability.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const lang = $derived(data.lang);
</script>

<svelte:head>
  <title>{t(lang, "meta.title", { name: data.name.text })}</title>
  <meta name="description" content={t(lang, "meta.description", { name: data.name.text })} />
</svelte:head>

<article class="resource-detail">
  <header class="page-header">
    <p class="kicker">{t(lang, "identity.kind")}</p>
    <h1>
      <AbilityIcon />
      <span class="identity-name"><Localized text={data.name} /></span>
    </h1>
    <dl class="properties">
      <dt>{t(lang, "identity.number")}</dt>
      <dd>{data.abilityId}</dd>
    </dl>
    <p class="introduced">{t(lang, "generation", { generation: data.generationId })}</p>
  </header>

  <section aria-labelledby="effects-heading" aria-describedby="effects-scope">
    <h2 id="effects-heading">{t(lang, "effect.heading")}</h2>
    <dl class="definitions effect-copy">
      <div class="effect-summary detail-panel">
        <dt>{t(lang, "effect.short")}</dt>
        <dd class="source-text">
          {#if data.shortEffect}
            <Localized text={data.shortEffect} />
          {:else}
            {t(lang, "effect.missing")}
          {/if}
        </dd>
      </div>
      <div class="effect-full">
        <dt>{t(lang, "effect.full")}</dt>
        <dd class="source-text">
          {#if data.effect}
            <Localized text={data.effect} />
          {:else}
            {t(lang, "effect.missing")}
          {/if}
        </dd>
      </div>
    </dl>
    <p class="note" id="effects-scope">{t(lang, "effect.scope")}</p>
  </section>

  <section aria-labelledby="history-heading" aria-describedby="history-scope">
    <h2 id="history-heading">{t(lang, "history.heading")}</h2>
    <p class="note" id="history-scope">{t(lang, "history.scope")}</p>
    {#if data.history.length}
      <ol class="history-list" role="list">
        {#each data.history as change (change.versionGroupId)}
          <li class="history-entry detail-panel">
            <h3>
              <span class="history-before">{t(lang, "history.before")}</span>
              {#each change.games as game, index}
                {#if index > 0} / {/if}<Localized text={game} />
              {/each}
            </h3>
            <div class="history-texts">
              {#each change.texts as text}
                <p class="source-text">
                  {#if text}
                    <Localized {text} />
                  {:else}
                    {t(lang, "history.missing")}
                  {/if}
                </p>
              {/each}
            </div>
          </li>
        {/each}
      </ol>
    {:else}
      <p>{t(lang, "history.empty")}</p>
    {/if}
  </section>

  <section aria-labelledby="descriptions-heading" aria-describedby="descriptions-scope">
    <h2 id="descriptions-heading">{t(lang, "flavor.heading")}</h2>
    <p class="note" id="descriptions-scope">{t(lang, "flavor.scope")}</p>
    {#if data.descriptions.length}
      <p class="result-count">{t(lang, "flavor.count", { count: data.descriptions.length })}</p>
      <div
        class="detail-table description-table"
        role="region"
        aria-labelledby="descriptions-heading"
        aria-describedby="descriptions-scope"
        tabindex="0"
      >
        <table>
          <thead>
            <tr>
              <th scope="col">{t(lang, "flavor.games")}</th>
              <th scope="col">{t(lang, "flavor.text")}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.descriptions as description (description.versionGroupId)}
              <tr>
                <th scope="row">
                  {#each description.games as game, index}
                    {#if index > 0} / {/if}<Localized text={game} />
                  {/each}
                </th>
                <td class="source-text">
                  {#if description.text}
                    <Localized text={description.text} />
                  {:else}
                    {t(lang, "flavor.missing")}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p>{t(lang, "flavor.empty")}</p>
    {/if}
  </section>
  <RelatedPokemon {lang} kind="ability" data={data.related} />
</article>

<style>
  .identity-name {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .introduced {
    color: var(--muted);
  }

  .effect-copy {
    display: grid;
    gap: 1.25rem;
    max-width: var(--measure);
    margin-block: 1rem;
  }

  .effect-copy dd {
    margin: 0.5rem 0 0;
    line-height: 1.7;
  }

  .effect-summary {
    border-inline-start-color: var(--accent);
    background: var(--surface-muted);
  }

  .effect-summary dd {
    font-size: 1.0625rem;
  }

  .history-list {
    display: grid;
    gap: 1rem;
    max-width: var(--measure);
    margin-block: 1rem;
    padding: 0;
    list-style: none;
  }

  .history-entry {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .history-entry h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
  }

  .history-before {
    display: block;
    margin-block-end: 0.25rem;
    color: var(--muted);
    font-size: 0.875rem;
    font-weight: 400;
  }

  .history-texts {
    display: grid;
    gap: 0.75rem;
  }

  .history-texts p {
    margin: 0;
  }

  .description-table table {
    table-layout: fixed;
  }

  .description-table th,
  .description-table td {
    overflow-wrap: anywhere;
  }

  .description-table thead th:first-child {
    width: 32%;
  }

  .source-text {
    white-space: pre-line;
    overflow-wrap: anywhere;
    line-height: 1.7;
  }
</style>
