<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { swapLanguageHref, writePreference } from "../data/context.ts";
  import { LANGUAGES } from "../i18n/core.ts";
  import type { Language } from "../i18n/core.ts";
  import { LANGUAGE_ENDONYMS, t } from "../i18n/messages.ts";

  let { lang }: { lang: Language } = $props();

  // Prerendering cannot read the query string, and hydration keeps server-rendered hrefs,
  // so links carry `?version=`/`?form=` only once the component runs in the browser.
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });

  const source = $derived(
    hydrated ? page.url : { pathname: page.url.pathname, search: "", hash: "" },
  );
</script>

<nav aria-label={t(lang, "language.label")}>
  <ul class="inline-list">
    {#each LANGUAGES as language (language)}
      <li>
        <a
          href={resolve(swapLanguageHref(source, language).slice(1) as PathnameWithSearchOrHash)}
          hreflang={language}
          lang={language}
          aria-current={language === lang ? "true" : undefined}
          onclick={() => writePreference("language", language)}
        >
          {LANGUAGE_ENDONYMS[language]}
        </a>
      </li>
    {/each}
  </ul>
</nav>
