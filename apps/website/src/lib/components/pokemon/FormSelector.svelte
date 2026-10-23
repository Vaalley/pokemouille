<script lang="ts">
  import { Label, Select } from "bits-ui";
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  let {
    lang,
    forms,
    selected,
    onselect,
  }: {
    lang: Language;
    forms: ResolvedPokemon["forms"];
    /** Identifier of the form currently shown. */
    selected: string;
    onselect: (identifier: string) => void;
  } = $props();

  const id = $props.id();

  const STATUS_KEYS = {
    available: "forms.status.available",
    "not-introduced": "forms.status.notIntroduced",
    unknown: "forms.status.unknown",
  } as const satisfies Record<ResolvedPokemon["status"], string>;

  const options = $derived(
    forms.map((form) => ({
      form,
      details: [
        t(lang, STATUS_KEYS[form.status]),
        form.isBattleOnly ? t(lang, "forms.battleOnly") : null,
        form.isMega ? t(lang, "forms.mega") : null,
      ]
        .filter((detail) => detail !== null)
        .join(", "),
    })),
  );
  const current = $derived(options.find(({ form }) => form.identifier === selected));
  const items = $derived(
    options.map(({ form, details }) => ({
      value: form.identifier,
      label: `${form.name.text} (${details})`,
    })),
  );
</script>

<div class="form-selector">
  <Label.Root for="{id}-form" class="form-label">{t(lang, "forms.label")}</Label.Root>
  <Select.Root
    type="single"
    allowDeselect={false}
    value={selected}
    onValueChange={(next) => {
      if (next && next !== selected) onselect(next);
    }}
    {items}
  >
    <Select.Trigger id="{id}-form" class="form-trigger">
      {#if current}
        <span class="form-value">
          <strong><Localized text={current.form.name} /></strong>
          <span class="form-detail">({current.details})</span>
        </span>
      {/if}
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class="forms-menu">
        <Select.Viewport>
          {#each options as { form, details } (form.id)}
            <Select.Item value={form.identifier} label="{form.name.text} ({details})" class="form-option">
              <strong><Localized text={form.name} /></strong>
              <span class="form-detail">({details})</span>
            </Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>

<style>
  .form-selector {
    display: grid;
    gap: 0.375rem;
    width: fit-content;
    max-width: 100%;
    min-width: 0;
    margin: 0;
    padding: var(--data-padding);
    border-inline-start: var(--data-rule) solid var(--accent);
    background: var(--surface-muted);
  }
  .form-selector :global(.form-label) { font-size: var(--data-label-size); font-weight: 600; }
  .form-selector :global(.form-trigger) { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 0.5rem; min-width: 0; max-width: 100%; min-height: 2.75rem; padding: 0.5rem 0.75rem; text-align: start; white-space: normal; overflow-wrap: anywhere; }
  .form-selector :global(.form-trigger)::after { content: ""; width: 0.4rem; height: 0.4rem; margin-inline-start: 0.5rem; border-inline-end: 2px solid currentColor; border-block-end: 2px solid currentColor; transform: translateY(-0.125rem) rotate(45deg); }
  .form-value { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; min-width: 0; }
  .form-detail { font-size: var(--data-label-size); font-weight: 400; line-height: 1.4; overflow-wrap: anywhere; }
  :global(.forms-menu .form-option) { display: grid; gap: 0.25rem; min-height: 2.75rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); border-radius: 0; background: var(--surface-muted); white-space: normal; overflow-wrap: anywhere; }
  :global(.forms-menu .form-option + .form-option) { margin-block-start: 0.375rem; }
  :global(.forms-menu .form-option[data-selected]), :global(.forms-menu .form-option[data-highlighted]) { border-inline-start-color: var(--accent); }
</style>
