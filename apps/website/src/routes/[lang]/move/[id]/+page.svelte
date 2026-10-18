<script lang="ts">
  import { resolve } from "$app/paths";
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

<article>
  <header class="page-header">
    <p class="kicker">{t(lang, "number", { id: data.id })}</p>
    <h1><MoveIcon typeId={data.typeId} /><Localized text={data.name} /></h1>
    <p>{t(lang, "generation", { generation: data.generationId })}</p>
  </header>

  <dl class="figures">
    <div>
      <dt>{t(lang, "type")}</dt>
      <dd>{#if data.type}<TypeBadge typeId={data.typeId} name={data.type} />{:else}{t(lang, "missing")}{/if}</dd>
    </div>
    <div><dt>{t(lang, "category")}</dt><dd>{category}</dd></div>
    <div><dt>{t(lang, "power")}</dt><dd>{data.power ?? t(lang, "variable")}</dd></div>
    <div><dt>{t(lang, "accuracy")}</dt><dd>{data.accuracy === null ? t(lang, "variable") : `${data.accuracy}%`}</dd></div>
    <div><dt>{t(lang, "pp")}</dt><dd>{data.pp ?? t(lang, "variable")}</dd></div>
    <div><dt>{t(lang, "priority")}</dt><dd>{data.priority}</dd></div>
    <div><dt>{t(lang, "effectChance")}</dt><dd>{data.effectChance === null ? t(lang, "variable") : `${data.effectChance}%`}</dd></div>
  </dl>
  <p class="note">{t(lang, "scope")}</p>
  <MoveProperties {lang} move={data.move} stats={data.stats} />

  <section aria-labelledby="effect-heading">
    <h2 id="effect-heading">{t(lang, "effect")}</h2>
    {#if data.shortEffect && data.shortEffect.text !== data.effect?.text}
      <p><Localized text={data.shortEffect} /></p>
    {/if}
    {#if data.effect}<p class="effect-text"><Localized text={data.effect} /></p>{:else}<p>{t(lang, "missing")}</p>{/if}
  </section>

  <section aria-labelledby="descriptions-heading">
    <h2 id="descriptions-heading">{t(lang, "descriptions")}</h2>
    {#if data.descriptions.length > 0}
      <table>
        <thead><tr><th scope="col">{t(lang, "games")}</th><th scope="col">{t(lang, "description")}</th></tr></thead>
        <tbody>
          {#each data.descriptions as row (row.id)}
            <tr><th scope="row">{row.games}</th><td><Localized text={row.text} /></td></tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p>{t(lang, "noDescriptions")}</p>
    {/if}
  </section>
  <Machines {lang} kind="move" data={data.machines} />
  <RelatedPokemon {lang} kind="move" data={data.related} />
  <p><a href={resolve(`${lang}/`)}>{t(lang, "back")}</a></p>
</article>

<style>
  .effect-text { white-space: pre-line; }
</style>
