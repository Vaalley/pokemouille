<script lang="ts">
  import { LinkPreview } from "bits-ui";
  import type { ReferenceData, ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import MatchupGroups from "#lib/components/MatchupGroups.svelte";
  import TypeBadge from "#lib/components/TypeBadge.svelte";
  import { defensiveMatchups } from "#lib/data/type-matchups.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import { t as typeText } from "#lib/i18n/types.ts";

  let { lang, types, generationId, referenceTypes }: {
    lang: Language;
    types: ResolvedPokemon["types"];
    generationId: number;
    referenceTypes: ReferenceData["types"];
  } = $props();
  const defendingTypes = $derived(types.status === "available" ? types.value.map((type) => type.id) : []);
  const matchups = $derived(defensiveMatchups(defendingTypes, generationId));
  const groups = $derived([
    { label: typeText(lang, "weaknesses"), rows: matchups?.filter((row) => row.multiplier > 1) ?? [] },
    { label: typeText(lang, "resistances"), rows: matchups?.filter((row) => row.multiplier > 0 && row.multiplier < 1) ?? [] },
    { label: typeText(lang, "immunities"), rows: matchups?.filter((row) => row.multiplier === 0) ?? [] },
  ]);
  function typeName(typeId: number) {
    const type = referenceTypes.find((row) => row.id === typeId);
    return localize(type?.names ?? [], lang, type?.identifier ?? String(typeId));
  }
</script>

<section aria-labelledby="types-heading">
  <h2 id="types-heading" class="visually-hidden">{t(lang, "types.heading")}</h2>
  {#if types.status === "available"}
    <!-- Both links share one hover region and one combined preview. -->
    <LinkPreview.Root openDelay={150} closeDelay={250}>
      <LinkPreview.Trigger>
        {#snippet child({ props })}
          {@const { onfocus, onblur, "aria-haspopup": _hasPopup, "aria-expanded": expanded, "aria-controls": controls, ...groupProps } = props}
          <div
            {...groupProps}
            role="group"
            aria-labelledby="types-heading"
            class="types"
          >
            {#each types.value as type (type.slot)}
              <TypeBadge
                typeId={type.id}
                name={type.name}
                {defendingTypes}
                onfocus={(event) => { if (typeof onfocus === "function") onfocus(event); }}
                onblur={(event) => { if (typeof onblur === "function") onblur(event); }}
                aria-haspopup="dialog"
                aria-expanded={expanded === "true"}
                aria-controls={typeof controls === "string" ? controls : undefined}
              />
            {/each}
          </div>
        {/snippet}
      </LinkPreview.Trigger>
      <LinkPreview.Portal>
        <LinkPreview.Content class="type-matchups" side="bottom" align="start" sideOffset={8} collisionPadding={12}>
          <h3>{typeText(lang, "defensive")}</h3>
          {#if matchups}
            <MatchupGroups {groups} name={typeName} heading="h4" none={typeText(lang, "none")} />
            <p class="matchup-scope">{typeText(lang, "scope", { generation: generationId })}</p>
          {:else}
            <p>{typeText(lang, "unavailable")}</p>
          {/if}
        </LinkPreview.Content>
      </LinkPreview.Portal>
    </LinkPreview.Root>
  {:else}
    <p>{reasonText(lang, types.reason)}</p>
  {/if}
</section>

<style>
  .types { display: inline-flex; flex-wrap: wrap; gap: 0.5rem; }
  :global(.type-matchups) {
    z-index: 60;
    width: min(30rem, calc(100vw - 1.5rem));
    max-height: min(38rem, var(--bits-floating-available-height, calc(100dvh - 1.5rem)));
    overflow-y: auto;
    padding: 1rem;
    border: var(--border-width) solid var(--border-strong);
    border-radius: var(--radius-panel);
    background: var(--surface);
    color: var(--page-text);
    box-shadow: var(--popover-shadow);
  }
  :global(.type-matchups h3) { margin: 0; }
  :global(.type-matchups h4) { margin-block: 0.75rem 0.375rem; }
  :global(.type-matchups .matchup-scope) { margin-block: 0.75rem 0; font-size: 0.875rem; }
</style>
