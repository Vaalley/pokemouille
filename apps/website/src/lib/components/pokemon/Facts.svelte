<script lang="ts">
  import { Collapsible } from "bits-ui";
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { messageKey, reasonText, t } from "#lib/i18n/pokemon.ts";

  let {
    lang,
    physical,
    speciesFacts,
  }: {
    lang: Language;
    physical: ResolvedPokemon["physical"];
    speciesFacts: ResolvedPokemon["speciesFacts"];
  } = $props();

  // Source units: height in decimetres, weight in hectograms.
  const metres = $derived(
    new Intl.NumberFormat(lang, { style: "unit", unit: "meter", maximumFractionDigits: 1 }),
  );
  const kilograms = $derived(
    new Intl.NumberFormat(lang, { style: "unit", unit: "kilogram", maximumFractionDigits: 1 }),
  );
  const percent = $derived(
    new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 1 }),
  );
  const yesNo = (value: boolean) => t(lang, value ? "value.yes" : "value.no");
</script>

<section aria-labelledby="facts-heading">
  <h2 id="facts-heading">{t(lang, "facts.heading")}</h2>
  {#if physical.status === "available" || speciesFacts.status === "available"}
    <p>{t(lang, "scope.current")}</p>
  {/if}
  {#if physical.status === "available"}
    <dl>
      <dt>{t(lang, "facts.height")}</dt>
      <dd>{metres.format(physical.value.height / 10)}</dd>
      <dt>{t(lang, "facts.weight")}</dt>
      <dd>{kilograms.format(physical.value.weight / 10)}</dd>
      <dt>{t(lang, "facts.baseExperience")}</dt>
      <dd>{physical.value.baseExperience ?? t(lang, "value.notRecorded")}</dd>
    </dl>
  {:else}
    <p>{reasonText(lang, physical.reason)}</p>
  {/if}
  {#if speciesFacts.status === "available"}
    {@const facts = speciesFacts.value}
    <dl>
      <dt>{t(lang, "facts.gender")}</dt>
      <dd>
        <!-- Source gender rate: -1 genderless, otherwise eighths female. -->
        {#if facts.genderRate < 0}
          {t(lang, "facts.genderless")}
        {:else}
          {t(lang, "facts.genderSplit", {
            female: percent.format(facts.genderRate / 8),
            male: percent.format(1 - facts.genderRate / 8),
          })}
        {/if}
      </dd>
      <dt>{t(lang, "facts.captureRate")}</dt>
      <dd>{facts.captureRate}</dd>
      <dt>{t(lang, "facts.baseHappiness")}</dt>
      <dd>{facts.baseHappiness ?? t(lang, "value.notRecorded")}</dd>
      <dt>{t(lang, "facts.baby")}</dt>
      <dd>{yesNo(facts.isBaby)}</dd>
      <dt>{t(lang, "facts.legendary")}</dt>
      <dd>{yesNo(facts.isLegendary)}</dd>
      <dt>{t(lang, "facts.mythical")}</dt>
      <dd>{yesNo(facts.isMythical)}</dd>
    </dl>
    <Collapsible.Root>
      <Collapsible.Trigger>{t(lang, "facts.source")}</Collapsible.Trigger>
      <Collapsible.Content>
        <dl>
          {#each Object.entries(facts.sourceFacts) as [key, value] (key)}
            {@const label = messageKey(`facts.source.${key}`)}
            <dt>{#if label}{t(lang, label)}{:else}<code>{key}</code>{/if}</dt>
            <dd>
              {#if value === null}
                {t(lang, "value.notRecorded")}
              {:else if typeof value === "boolean"}
                {yesNo(value)}
              {:else}
                {value}
              {/if}
            </dd>
          {/each}
        </dl>
      </Collapsible.Content>
    </Collapsible.Root>
  {:else}
    <p>{reasonText(lang, speciesFacts.reason)}</p>
  {/if}
</section>
