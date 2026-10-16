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
  <Label.Root for="{id}-form">{t(lang, "forms.label")}</Label.Root>
  <Select.Root
    type="single"
    allowDeselect={false}
    value={selected}
    onValueChange={(next) => {
      if (next && next !== selected) onselect(next);
    }}
    {items}
  >
    <Select.Trigger id="{id}-form">
      {#if current}
        <Localized text={current.form.name} /> ({current.details})
      {/if}
    </Select.Trigger>
    <Select.Portal>
      <Select.Content>
        <Select.Viewport>
          {#each options as { form, details } (form.id)}
            <Select.Item value={form.identifier} label="{form.name.text} ({details})">
              <Localized text={form.name} /> ({details})
            </Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>

<style>
  .form-selector {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-block: 0.75rem;
  }
</style>
