<script lang="ts">
  import { Popover } from "bits-ui";
  import type { ReferenceData, ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import TypeBadge from "#lib/components/TypeBadge.svelte";
  import { defensiveMatchups } from "#lib/data/type-matchups.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import { t as typeText } from "#lib/i18n/types.ts";

  let {
    lang, types, generationId, referenceTypes,
  }: {
    lang: Language;
    types: ResolvedPokemon["types"];
    generationId: number;
    referenceTypes: ReferenceData["types"];
  } = $props();

  let open = $state(false);
  let restoringFocus = false;
  const id = $props.id();
  const matchups = $derived(
    types.status === "available"
      ? defensiveMatchups(types.value.map((type) => type.id), generationId)
      : null,
  );
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
  <h2 id="types-heading">{t(lang, "types.heading")}</h2>
  {#if types.status === "available"}
    <Popover.Root bind:open>
      <Popover.Trigger
        class="type-trigger"
        openOnHover
        openDelay={150}
        closeDelay={250}
        aria-describedby={`${id}-hint`}
        aria-label={`${types.value.map((type) => type.name.text).join(" / ")} — ${typeText(lang, "heading")}`}
        onfocus={(event) => {
          if (!restoringFocus && event.currentTarget.matches(":focus-visible")) open = true;
        }}
      >
        {#each types.value as type (type.slot)}
          <TypeBadge typeId={type.id} name={type.name} />
        {/each}
        <span aria-hidden="true">ⓘ</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          class="type-matchups"
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          trapFocus={false}
          aria-labelledby={`${id}-title`}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            // Preserve an outside target; otherwise let Bits UI restore pre-open focus.
            if (document.activeElement !== document.body && !document.activeElement?.closest(".type-matchups")) {
              event.preventDefault();
              return;
            }
            // Restoration is synchronous inside Bits UI; don't treat it as a new open.
            restoringFocus = true;
            queueMicrotask(() => { restoringFocus = false; });
          }}
        >
          <div class="matchup-header">
            <h3 id={`${id}-title`}>{typeText(lang, "heading")}</h3>
            <Popover.Close aria-label={typeText(lang, "close")}>×</Popover.Close>
          </div>
          {#if matchups}
            {#each groups as group}
              <section class="matchup-group" aria-label={group.label}>
                <h4>{group.label}</h4>
                {#if group.rows.length}
                  <ul class="matchup-list">
                    {#each group.rows as row (row.typeId)}
                      <li>
                        <TypeBadge typeId={row.typeId} name={typeName(row.typeId)} />
                        <strong>×{row.multiplier}</strong>
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <p>{typeText(lang, "none")}</p>
                {/if}
              </section>
            {/each}
            <p class="matchup-scope">{typeText(lang, "scope", { generation: generationId })}</p>
          {:else}
            <p>{typeText(lang, "unavailable")}</p>
          {/if}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
    <p id={`${id}-hint`} class="type-hint">{typeText(lang, "hint")}</p>
  {:else}
    <p>{reasonText(lang, types.reason)}</p>
  {/if}
</section>

<style>
  :global(.type-trigger) {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.75rem;
    padding: 0.25rem;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 1px solid;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .type-hint {
    margin-block: 0.5rem;
    font-size: 0.875rem;
  }

  :global(.type-matchups) {
    z-index: 60;
    width: min(30rem, calc(100vw - 1.5rem));
    max-height: min(38rem, var(--bits-popover-content-available-height, calc(100dvh - 1.5rem)));
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 1rem;
    border: 1px solid;
    border-radius: 0.75rem;
    background: Canvas;
    color: CanvasText;
    box-shadow: 0 0.25rem 1rem rgb(0 0 0 / 0.15);
  }

  .matchup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .matchup-header h3,
  .matchup-group p {
    margin: 0;
  }

  .matchup-header :global(button) {
    min-width: 2.75rem;
    min-height: 2.75rem;
    font: inherit;
    cursor: pointer;
  }

  .matchup-group h4 {
    margin-block: 0.75rem 0.375rem;
  }

  .matchup-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .matchup-list li {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .matchup-scope {
    margin-bottom: 0;
    font-size: 0.8125rem;
  }
</style>
