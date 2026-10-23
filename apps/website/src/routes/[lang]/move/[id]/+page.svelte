<script lang="ts">
  import { resolve } from "$app/paths";
  import { scrollable } from "#lib/actions/scrollable.ts";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import RelatedPokemon from "#lib/components/RelatedPokemon.svelte";
  import MoveIcon from "#lib/components/MoveIcon.svelte";
  import TypeBadge from "#lib/components/TypeBadge.svelte";
  import Machines from "#lib/components/Machines.svelte";
  import MoveProperties from "#lib/components/MoveProperties.svelte";
  import { t } from "#lib/i18n/move.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const lang = $derived(data.lang);
  const category = $derived(
    data.damageClassId === 1 ? t(lang, "status") :
    data.damageClassId === 2 ? t(lang, "physical") :
    data.damageClassId === 3 ? t(lang, "special") : t(lang, "missing"),
  );
</script>

<svelte:head>
  <title>{data.name.text} | {t(lang, "heading")} | Pokémouille</title>
  <meta name="description" content={`${data.name.text} (${t(lang, "heading")}). ${data.shortEffect?.text ?? t(lang, "scope")}`} />
</svelte:head>

<article class="resource-detail">
  <header class="page-header">
    <p class="kicker">{t(lang, "number", { id: data.id })}</p>
    <h1><MoveIcon typeId={data.typeId} /><span><Localized text={data.name} /></span></h1>
    <p>{t(lang, "generation", { generation: data.generationId })}</p>
  </header>

  <section aria-labelledby="overview-heading" aria-describedby="move-scope">
    <h2 id="overview-heading">{t(lang, "overview")}</h2>
    <p class="note" id="move-scope">{t(lang, "scope")}</p>
    <dl class="move-identity">
      <div>
        <dt>{t(lang, "type")}</dt>
        <dd>{#if data.type}<TypeBadge typeId={data.typeId} name={data.type} />{:else}{t(lang, "missing")}{/if}</dd>
      </div>
      <div><dt>{t(lang, "category")}</dt><dd>{category}</dd></div>
    </dl>
    <dl class="move-figures">
      <div><dt>{t(lang, "power")}</dt><dd>{data.power ?? t(lang, "variable")}</dd></div>
      <div><dt>{t(lang, "accuracy")}</dt><dd>{data.accuracy === null ? t(lang, "variable") : `${data.accuracy}%`}</dd></div>
      <div><dt>{t(lang, "pp")}</dt><dd>{data.pp ?? t(lang, "variable")}</dd></div>
      <div><dt>{t(lang, "priority")}</dt><dd>{data.priority}</dd></div>
      <div><dt>{t(lang, "effectChance")}</dt><dd>{data.effectChance === null ? t(lang, "variable") : `${data.effectChance}%`}</dd></div>
    </dl>
  </section>

  <section aria-labelledby="effect-heading">
    <h2 id="effect-heading">{t(lang, "effect")}</h2>
    {#if data.shortEffect && data.shortEffect.text !== data.effect?.text}
      <p class="effect-summary"><Localized text={data.shortEffect} /></p>
    {/if}
    {#if data.effect}<p class="effect-text"><Localized text={data.effect} /></p>{:else}<p class="detail-feedback detail-feedback--missing">{t(lang, "missing")}</p>{/if}
  </section>
  <MoveProperties {lang} move={data.move} stats={data.stats} />

  <section aria-labelledby="descriptions-heading">
    <h2 id="descriptions-heading">{t(lang, "descriptions")}</h2>
    {#if data.descriptions.length > 0}
      <div class="detail-table move-descriptions" role="region" aria-labelledby="descriptions-heading" use:scrollable>
        <table>
          <thead><tr><th scope="col">{t(lang, "games")}</th><th scope="col">{t(lang, "description")}</th></tr></thead>
          <tbody>
            {#each data.descriptions as row (row.id)}
              <tr><th scope="row">{row.games}</th><td><Localized text={row.text} /></td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="detail-feedback detail-feedback--empty">{t(lang, "noDescriptions")}</p>
    {/if}
  </section>
  <Machines {lang} kind="move" data={data.machines} />
  <RelatedPokemon {lang} kind="move" data={data.related} />
  <p><a href={resolve(`${lang}/`)}>{t(lang, "back")}</a></p>
</article>

<style>
  .move-identity {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block: 1rem;
  }
  .move-identity > div { flex: 1 1 10rem; min-width: 0; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .move-identity dt, .move-figures dt { color: var(--muted); font-size: var(--data-label-size); font-weight: 600; }
  .move-identity dd { margin: 0.25rem 0 0; font-weight: 600; }
  .move-figures {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
    gap: 0.5rem;
    margin-block: 0;
  }
  .move-figures > div {
    min-width: 0;
    padding: var(--data-padding);
    border: 0;
    border-inline-start: var(--data-rule) solid var(--border-strong);
    border-radius: 0;
    background: var(--surface-muted);
  }
  .move-figures dd {
    margin: 0.375rem 0 0;
    font-size: 1.125rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .effect-summary { max-width: var(--measure); padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--accent); background: var(--surface-muted); font-weight: 600; white-space: pre-wrap; overflow-wrap: anywhere; }
  .effect-text { max-width: var(--measure); padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); white-space: pre-wrap; overflow-wrap: anywhere; }
  .move-descriptions thead th { font-size: var(--data-label-size); font-weight: 600; }
  .move-descriptions tbody th { font-weight: 600; }
  .move-descriptions th[scope="row"] { min-width: 8rem; width: 28%; }
  .move-descriptions td { min-width: 12rem; white-space: pre-line; overflow-wrap: anywhere; }
</style>
