<script lang="ts">
  import ItemIcon from "#lib/components/ItemIcon.svelte";
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

<article>
  <header>
    <p>{t(lang, "identity.kind")}</p>
    <h1><ItemIcon identifier={data.identifier} /><Localized text={data.name} /></h1>
    <dl>
      <dt>{t(lang, "identity.number")}</dt>
      <dd>{data.itemId}</dd>
    </dl>
  </header>

  <section aria-labelledby="effects-heading" aria-describedby="effects-scope">
    <h2 id="effects-heading">{t(lang, "effect.heading")}</h2>
    <p id="effects-scope">{t(lang, "effect.scope")}</p>
    <dl>
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
  </section>

  <section aria-labelledby="descriptions-heading" aria-describedby="descriptions-scope">
    <h2 id="descriptions-heading">{t(lang, "flavor.heading")}</h2>
    <p id="descriptions-scope">{t(lang, "flavor.scope")}</p>
    {#if data.descriptions.length}
      {#each data.descriptions as description (description.versionGroupId)}
        <section aria-labelledby={`version-group-${description.versionGroupId}`}>
          <h3 id={`version-group-${description.versionGroupId}`}>
            {#each description.games as game, index}
              {#if index > 0} / {/if}<Localized text={game} />
            {/each}
          </h3>
          <p class="source-text">
            {#if description.text}
              <Localized text={description.text} />
            {:else}
              {t(lang, "flavor.missing")}
            {/if}
          </p>
        </section>
      {/each}
    {:else}
      <p>{t(lang, "flavor.empty")}</p>
    {/if}
  </section>
</article>

<style>
  h1 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .source-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
