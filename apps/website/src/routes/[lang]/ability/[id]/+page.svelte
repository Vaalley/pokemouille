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

<article>
  <header class="page-header">
    <p class="kicker">{t(lang, "identity.kind")}</p>
    <h1><AbilityIcon /><Localized text={data.name} /></h1>
    <dl class="properties">
      <dt>{t(lang, "identity.number")}</dt>
      <dd>{data.abilityId}</dd>
    </dl>
  </header>

  <section aria-labelledby="effects-heading" aria-describedby="effects-scope">
    <h2 id="effects-heading">{t(lang, "effect.heading")}</h2>
    <dl class="definitions">
      <dt>{t(lang, "effect.short")}</dt>
      <dd class="source-text">
        {#if data.shortEffect}
          <Localized text={data.shortEffect} />
        {:else}
          {t(lang, "effect.missing")}
        {/if}
      </dd>
      <dt>{t(lang, "effect.full")}</dt>
      <dd class="source-text">
        {#if data.effect}
          <Localized text={data.effect} />
        {:else}
          {t(lang, "effect.missing")}
        {/if}
      </dd>
    </dl>
    <p class="note" id="effects-scope">{t(lang, "effect.scope")}</p>
  </section>

  <section aria-labelledby="descriptions-heading" aria-describedby="descriptions-scope">
    <h2 id="descriptions-heading">{t(lang, "flavor.heading")}</h2>
    <p class="note" id="descriptions-scope">{t(lang, "flavor.scope")}</p>
    {#if data.descriptions.length}
      <table>
        <thead>
          <tr><th scope="col">{t(lang, "flavor.games")}</th><th scope="col">{t(lang, "flavor.text")}</th></tr>
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
    {:else}
      <p>{t(lang, "flavor.empty")}</p>
    {/if}
  </section>
  <RelatedPokemon {lang} kind="ability" data={data.related} />
</article>

<style>
  .source-text {
    white-space: pre-line;
  }
</style>
