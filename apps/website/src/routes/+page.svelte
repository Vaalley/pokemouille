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
