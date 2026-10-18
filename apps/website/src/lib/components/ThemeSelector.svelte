<script lang="ts">
  import { Label, Select } from "bits-ui";
  import { onMount } from "svelte";
  import { readPreference, writePreference } from "../data/context.ts";
  import type { Language } from "../i18n/core.ts";
  import { t } from "../i18n/theme.ts";

  let { lang }: { lang: Language } = $props();
  const id = $props.id();
  const themes = ["auto", "light", "dark"] as const;
  type Theme = (typeof themes)[number];

  // The inline script in src/app.html already applied the saved theme before first paint;
  // the selector only shows it once the browser can read the preference.
  let value = $state<Theme>("auto");
  let ready = $state(false);
  const items = $derived(themes.map((theme) => ({ value: theme, label: t(lang, theme) })));

  onMount(() => {
    const saved = readPreference("theme");
    value = saved === "light" || saved === "dark" ? saved : "auto";
    ready = true;
  });

  function select(next: string) {
    value = next === "light" || next === "dark" ? next : "auto";
    writePreference("theme", value);
    // "auto" removes the override so `prefers-color-scheme` decides again.
    if (value === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = value;
  }
</script>

<div class="theme-selector">
  <Label.Root for={`${id}-theme`}>{t(lang, "label")}</Label.Root>
  <Select.Root type="single" allowDeselect={false} {value} onValueChange={select} disabled={!ready} {items}>
    <Select.Trigger id={`${id}-theme`}>
      {t(lang, value)}
    </Select.Trigger>
    <Select.Portal>
      <Select.Content>
        <Select.Viewport>
          {#each items as item (item.value)}
            <Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
</div>

<style>
  .theme-selector { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; min-width: 0; }
</style>
