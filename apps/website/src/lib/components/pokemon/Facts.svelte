<script lang="ts">
  import { Collapsible } from "bits-ui";
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { captureChance, eggSteps, type MechanicsGame } from "#lib/data/stat-formulas.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { messageKey, reasonText, t } from "#lib/i18n/pokemon.ts";
  import { t as calc } from "#lib/i18n/stat-calc.ts";
  import { t as dex } from "#lib/i18n/regional-dex.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    physical,
    speciesFacts,
    regionalDexNumbers,
    game,
    mechanicsGame,
  }: {
    lang: Language;
    physical: ResolvedPokemon["physical"];
    speciesFacts: ResolvedPokemon["speciesFacts"];
    regionalDexNumbers: ResolvedPokemon["regionalDexNumbers"];
    game: string;
    mechanicsGame: MechanicsGame;
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
  const chance = $derived(
    new Intl.NumberFormat(lang, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  );
  const integer = $derived(new Intl.NumberFormat(lang));
  const yesNo = (value: boolean) => t(lang, value ? "value.yes" : "value.no");

  const capture = $derived(
    speciesFacts.status === "available"
      ? captureChance(mechanicsGame, speciesFacts.value.captureRate)
      : null,
  );
  const hatchCounter = $derived.by(() => {
    if (speciesFacts.status !== "available") return null;
    const value = speciesFacts.value.sourceFacts.hatch_counter;
    return typeof value === "number" ? value : null;
  });
  const hatch = $derived(eggSteps(mechanicsGame, hatchCounter));
</script>

<section aria-labelledby="facts-heading">
  <h2 id="facts-heading">{t(lang, "facts.heading")}</h2>
  {#if physical.status === "available"}
    <dl class="properties">
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
    <dl class="properties">
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
        <dl class="properties">
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
  {#if physical.status === "available" || speciesFacts.status === "available"}
    <p class="note">{t(lang, "scope.current")}</p>
  {/if}
  <h3>{dex(lang, "heading", { game })}</h3>
  {#if regionalDexNumbers.status === "available"}
    <dl class="properties">
      {#each regionalDexNumbers.value as entry (entry.pokedexId)}
        <dt><Localized text={entry.name} /></dt>
        <dd>{integer.format(entry.number)}</dd>
      {/each}
    </dl>
  {:else if regionalDexNumbers.reason === "The source lists this species in no regional Pokédex of the selected game"}
    <p>{dex(lang, "noEntry")}</p>
  {:else if regionalDexNumbers.reason === "The source maps no regional Pokédex to the selected game"}
    <p>{dex(lang, "noMapped")}</p>
  {:else}
    <p>{reasonText(lang, regionalDexNumbers.reason)}</p>
  {/if}
  <p class="note">{dex(lang, "scope")}</p>
  {#if speciesFacts.status === "available" && capture}
    <h3>{calc(lang, "calcHeading", { game })}</h3>
    <dl class="properties">
      <dt>{calc(lang, "captureChance")}</dt>
      <dd>
        {#if capture.status === "not-computed"}
          {calc(lang, capture.reason === "different-system" ? "captureNotComputed" : "captureNotVerified")}
        {:else if capture.min !== capture.max}
          {calc(lang, "captureRange", { min: chance.format(capture.min), max: chance.format(capture.max) })}
        {:else}
          {calc(lang, capture.approximate ? "captureApproximate" : "captureValue", { percent: chance.format(capture.min) })}
        {/if}
      </dd>
      <dt>{calc(lang, "eggSteps")}</dt>
      <dd>
        {#if hatch.status === "no-breeding"}
          {calc(lang, "eggNoBreeding")}
        {:else if hatch.status === "not-recorded"}
          {calc(lang, "eggNotRecorded")}
        {:else if hatch.status === "cycles-only"}
          {calc(lang, "eggCyclesOnly", { cycles: integer.format(hatch.cycles) })}
        {:else}
          {calc(lang, "eggStepsValue", {
            steps: integer.format(hatch.steps),
            cycles: integer.format(hatch.cycles),
            perCycle: integer.format(hatch.stepsPerCycle),
          })}
        {/if}
      </dd>
    </dl>
    {#if capture.status === "computed" || hatch.status === "computed"}
      <p class="note">{calc(lang, "calcScope")}</p>
    {/if}
    {#if capture.status === "computed"}
      <p class="note">{calc(lang, "captureAssumptions")}</p>
      {#if capture.min !== capture.max}
        <p class="note">{calc(lang, "captureHpRange")}</p>
      {/if}
      {#if capture.approximate}
        <p class="note">{calc(lang, "captureRounding")}</p>
      {/if}
    {/if}
    {#if hatch.status === "computed"}
      <p class="note">{calc(lang, "eggStepsNote")}</p>
      {#each hatch.notes as note (note)}
        <p class="note">
          {calc(lang, note === "extra-cycle" ? "eggExtraCycle" : "eggSpecialDates")}
        </p>
      {/each}
    {:else if hatch.status === "cycles-only"}
      <p class="note">{calc(lang, "eggCyclesOnlyNote")}</p>
    {/if}
  {/if}
</section>

<style>
  /* Several lists stack here: a shared label width keeps their values aligned. */
  dl {
    grid-template-columns: minmax(0, 12rem) minmax(0, 1fr);
    overflow-wrap: anywhere;
  }
  @media (max-width: 32rem) {
    dl { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 0.375rem 0.75rem; }
  }
</style>
