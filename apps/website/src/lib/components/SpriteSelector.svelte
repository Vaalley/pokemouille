<script lang="ts" module>
  import { createContext } from "svelte";
  import type { SpriteStyle } from "../data/sprite-preference.ts";
  export const [getSelectedSprite, setSelectedSprite] = createContext<() => SpriteStyle>();
</script>

<script lang="ts">
  import { Label, Select } from "bits-ui";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "../i18n/core.ts";
  import { t } from "../i18n/pokemon.ts";
  import { spriteStyles, spriteStyleName } from "../data/sprite-preference.ts";

  let { lang, games, value, ready, onchange }: {
    lang: Language;
    games: readonly GameOption[] | null;
    value: string;
    ready: boolean;
    onchange: (value: string) => void;
  } = $props();
  const id = $props.id();
  const items = $derived(spriteStyles.map((style) => ({ value: style.id, label: spriteStyleName(style, lang, games ?? []) })));
</script>

<div class="sprite-selector">
  <Label.Root for={`${id}-sprite`}>{t(lang, "sprites.preference")}</Label.Root>
  <Select.Root type="single" allowDeselect={false} {value} onValueChange={onchange} disabled={!ready} {items}>
    <Select.Trigger id={`${id}-sprite`}>
      {items.find((item) => item.value === value)?.label}
    </Select.Trigger>
    <Select.Portal>
      <Select.Content>
        <Select.Viewport>
          {#each [false, true] as historical}
            <Select.Group>
              <Select.GroupHeading>{t(lang, historical ? "sprites.games" : "sprites.source")}</Select.GroupHeading>
              {#each spriteStyles.filter((style) => ("game" in style) === historical) as style (style.id)}
                {@const label = spriteStyleName(style, lang, games ?? [])}
                <Select.Item value={style.id} {label}>{label}</Select.Item>
              {/each}
            </Select.Group>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>

<style>
  .sprite-selector { display: grid; align-content: start; gap: 0.375rem; min-width: 0; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .sprite-selector :global(label) { font-size: var(--data-label-size); font-weight: 600; }
  .sprite-selector :global([data-select-trigger]) { width: 100%; min-width: 0; max-width: 100%; min-height: 2.75rem; text-align: start; font-weight: 600; background: var(--surface); }
</style>
