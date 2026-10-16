<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import GameSelector, { setSelectedVersion } from "#lib/components/GameSelector.svelte";
  import LanguageSwitcher from "#lib/components/LanguageSwitcher.svelte";
  import SearchDialog from "#lib/components/SearchDialog.svelte";
  import { readPreference, resolveContext, writePreference } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import { t } from "#lib/i18n/messages.ts";
  import { t as navigation } from "#lib/i18n/navigation.ts";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let games = $state<GameOption[] | null>(null);
  let gamesFailed = $state(false);
  let savedVersion = $state<string | null>(null);
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  const sections = [
    { key: "pokemon", path: "" },
    { key: "moves", path: "move/" },
    { key: "abilities", path: "ability/" },
    { key: "items", path: "item/" },
    { key: "types", path: "types/" },
  ] as const;

  // Games and the saved preference exist only in the browser, so prerendered HTML and the
  // first client render show a disabled selector rather than a guessed default game.
  onMount(() => {
    savedVersion = readPreference("version");
    getGames().then(
      (loaded) => {
        games = loaded;
      },
      () => {
        gamesFailed = true;
      },
    );
  });

  const version = $derived(
    games
      ? resolveContext({ url: currentUrl, language: data.lang, games, savedVersion }).version
      : null,
  );

  setSelectedVersion(() => version);

  function selectVersion(next: string) {
    writePreference("version", next);
    savedVersion = next;
    // Context-sensitive pages keep explicit game choices shareable. Start from the
    // shallow URL so catalogue filters and selected types survive game changes.
    if (
      page.route.id?.startsWith("/[lang]/pokemon/") ||
      page.route.id === "/[lang]/types" ||
      currentUrl.searchParams.has("version")
    ) {
      const url = new URL(currentUrl.href);
      url.searchParams.set("version", next);
      void goto(url, { reset: false });
    }
  }
</script>

<a class="skip-link" href="#main">{t(data.lang, "site.skipToContent")}</a>

<header class="site-header">
  <a class="site-name" href={resolve(`${data.lang}/`)}>{t(data.lang, "site.name")}</a>
  <SearchDialog lang={data.lang} {games} {version} />
  <div class="site-controls" role="group" aria-label={t(data.lang, "site.controls")}>
    <LanguageSwitcher lang={data.lang} />
    <GameSelector
      lang={data.lang}
      {games}
      value={version}
      onchange={selectVersion}
      error={gamesFailed}
    />
  </div>
  <nav class="browse-navigation" aria-label={navigation(data.lang, "label")}>
    <ul class="inline-list">
      {#each sections as section (section.key)}
        <li>
          <a
            href={resolve(`${data.lang}/${section.path}${version ? `?version=${encodeURIComponent(version)}` : ""}` as PathnameWithSearchOrHash)}
            aria-current={page.url.pathname === `/${data.lang}/${section.path}` ? "page" : undefined}
          >{navigation(data.lang, section.key)}</a>
        </li>
      {/each}
    </ul>
  </nav>
</header>

<noscript>
  <p class="noscript-notice">{t(data.lang, "noscript.notice")}</p>
</noscript>

<main id="main" tabindex="-1">
  {@render children()}
</main>
