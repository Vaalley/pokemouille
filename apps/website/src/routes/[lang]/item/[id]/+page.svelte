<script lang="ts">
  import ItemIcon from "#lib/components/ItemIcon.svelte";
  import ItemEvolutions from "#lib/components/ItemEvolutions.svelte";
  import Machines from "#lib/components/Machines.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { t } from "#lib/i18n/item.ts";
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
      <ItemIcon identifier={data.identifier} />
      <span class="identity-name"><Localized text={data.name} /></span>
    </h1>
    <dl class="properties">
      <dt>{t(lang, "identity.number")}</dt>
      <dd>{data.itemId}</dd>
    </dl>
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
            <span class="detail-feedback detail-feedback--missing detail-feedback--inline">{t(lang, "effect.missing")}</span>
          {/if}
        </dd>
      </div>
      <div class="effect-full">
        <dt>{t(lang, "effect.full")}</dt>
        <dd class="source-text">
          {#if data.effect}
            <Localized text={data.effect} />
          {:else}
            <span class="detail-feedback detail-feedback--missing detail-feedback--inline">{t(lang, "effect.missing")}</span>
          {/if}
        </dd>
      </div>
    </dl>
    <p class="note" id="effects-scope">{t(lang, "effect.scope")}</p>
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
                    <span class="detail-feedback detail-feedback--missing detail-feedback--inline">{t(lang, "flavor.missing")}</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="detail-feedback detail-feedback--empty">{t(lang, "flavor.empty")}</p>
    {/if}
  </section>
  <Machines {lang} kind="item" data={data.machines} />
  <ItemEvolutions {lang} data={data.evolutions} />
</article>

<style>
  .identity-name {
    min-width: 0;
    overflow-wrap: anywhere;
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
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: 1.7;
  }
</style>
