<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { pickRootLanguage, readPreference, writePreference } from "#lib/data/context.ts";
  import { LANGUAGES } from "#lib/i18n/core.ts";
  import { LANGUAGE_ENDONYMS, t } from "#lib/i18n/messages.ts";

  // Only `/` picks a language for the visitor; explicit localized URLs are never redirected.
  onMount(() => {
    const lang = pickRootLanguage(readPreference("language"), navigator.languages);
    void goto(resolve(`${lang}/`), { replace: true });
  });
</script>

<svelte:head>
  <title>{t("en", "root.title")}</title>
</svelte:head>

<main id="main">
  <h1>{t("en", "site.name")}</h1>
  <nav aria-labelledby="choose-language">
    <p id="choose-language">
      {#each LANGUAGES as language, index (language)}
        {#if index > 0}
          <span aria-hidden="true"> · </span>
        {/if}
        <span lang={language}>{t(language, "root.choose")}</span>
      {/each}
    </p>
    <ul>
      {#each LANGUAGES as language (language)}
        <li>
          <a
            href={resolve(`${language}/`)}
            hreflang={language}
            lang={language}
            onclick={() => writePreference("language", language)}
          >
            {LANGUAGE_ENDONYMS[language]}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</main>

<style>
  main { padding-block: clamp(3rem, 12vh, 8rem); max-width: 52rem; }
  h1 { font-size: clamp(2.25rem, 6vw, 4rem); letter-spacing: -0.045em; }
  nav { margin-block-start: 2rem; }
  nav p { color: var(--muted); max-width: var(--measure); line-height: 1.8; }
  ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: 0 1.5rem; max-width: 45rem; padding: 0; list-style: none; }
  a:any-link { display: flex; justify-content: space-between; align-items: center; gap: 1rem; min-height: 3.5rem; padding-block: 0.875rem; border-block-end: 1px solid var(--border); color: var(--page-text); font-weight: 500; text-decoration: none; }
  a::after { content: "→" / ""; color: var(--muted); }
  a:is(:hover, :focus-visible) { text-decoration: underline; text-underline-offset: 0.25em; }
  a:is(:hover, :focus-visible)::after { color: var(--accent); }
</style>
