<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import GameSelector, { setSelectedVersion } from "#lib/components/GameSelector.svelte";
  import LanguageSwitcher from "#lib/components/LanguageSwitcher.svelte";
  import SearchDialog from "#lib/components/SearchDialog.svelte";
  import { readPreference, resolveContext, writePreference } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import { t } from "#lib/i18n/messages.ts";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let games = $state<GameOption[] | null>(null);
  let gamesFailed = $state(false);
  let savedVersion = $state<string | null>(null);

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
      ? resolveContext({ url: page.url, language: data.lang, games, savedVersion }).version
      : null,
  );

  setSelectedVersion(() => version);

  function selectVersion(next: string) {
    writePreference("version", next);
    savedVersion = next;
    // Pokémon pages (and any URL already carrying a game) keep the game in the URL so the
    // choice is shareable and Back/Forward restores it; `form` and other params are kept.
    if (page.route.id?.startsWith("/[lang]/pokemon/") || page.url.searchParams.has("version")) {
      const url = new URL(page.url.href);
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
</header>

<noscript>
  <p class="noscript-notice">{t(data.lang, "noscript.notice")}</p>
</noscript>

<main id="main" tabindex="-1">
  {@render children()}
</main>
