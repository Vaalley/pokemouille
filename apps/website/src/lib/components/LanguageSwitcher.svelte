<script lang="ts">
  import { Label, Select } from "bits-ui";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { swapLanguageHref, writePreference } from "../data/context.ts";
  import { LANGUAGES } from "../i18n/core.ts";
  import type { Language } from "../i18n/core.ts";
  import { LANGUAGE_ENDONYMS, t } from "../i18n/messages.ts";

  let { lang }: { lang: Language } = $props();

  const id = $props.id();
  const items = LANGUAGES.map((language) => ({
    value: language,
    label: LANGUAGE_ENDONYMS[language],
  }));

  // Prerendering cannot read the query string, and hydration keeps server-rendered hrefs,
  // so targets carry `?version=`/`?form=` only once the component runs in the browser.
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });

  const source = $derived(
    hydrated ? (page.shallow?.url ?? page.url) : { pathname: page.url.pathname, search: "", hash: "" },
  );

  function href(language: Language) {
    return resolve(swapLanguageHref(source, language).slice(1) as PathnameWithSearchOrHash);
  }

  function select(next: string) {
    const language = LANGUAGES.find((entry) => entry === next);
    if (!language || language === lang) return;
    writePreference("language", language);
    void goto(href(language));
  }
</script>

<div class="language-selector">
  <Label.Root for="{id}-language">{t(lang, "language.label")}</Label.Root>
  <!-- Disabled until hydrated, like the game selector: without JavaScript it can't navigate. -->
  <Select.Root type="single" allowDeselect={false} value={lang} onValueChange={select} disabled={!hydrated} {items}>
    <Select.Trigger id="{id}-language">
      <span {lang}>{LANGUAGE_ENDONYMS[lang]}</span>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content>
        <Select.Viewport>
          {#each LANGUAGES as language (language)}
            <Select.Item value={language} label={LANGUAGE_ENDONYMS[language]} lang={language}>
              {LANGUAGE_ENDONYMS[language]}
            </Select.Item>
          {/each}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
  <!-- The select needs JavaScript; plain links keep every translation reachable without it. -->
  <noscript>
    <ul class="inline-list">
      {#each LANGUAGES as language (language)}
        <li>
          <a
            href={href(language)}
            hreflang={language}
            lang={language}
            aria-current={language === lang ? "true" : undefined}>{LANGUAGE_ENDONYMS[language]}</a
          >
        </li>
      {/each}
    </ul>
  </noscript>
</div>

<style>
  .language-selector { display: grid; align-content: start; gap: 0.375rem; min-width: 0; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .language-selector :global(label) { font-size: var(--data-label-size); font-weight: 600; }
  .language-selector :global([data-select-trigger]) { width: 100%; min-width: 0; min-height: 2.75rem; text-align: start; font-weight: 600; background: var(--surface); }
  .inline-list { margin: 0; padding: 0; list-style: none; }
  .inline-list a { display: inline-flex; align-items: center; min-height: 2.75rem; padding-inline: 0.5rem; }
  .inline-list a[aria-current] { border-inline-start: var(--data-rule) solid var(--accent); font-weight: 600; }
</style>
