<script lang="ts">
  import { onMount } from "svelte";
  import { afterNavigate, goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import GameSelector, { setSelectedVersion } from "#lib/components/GameSelector.svelte";
  import LanguageSwitcher from "#lib/components/LanguageSwitcher.svelte";
  import SearchDialog from "#lib/components/SearchDialog.svelte";
  import SpriteSelector, { setSelectedSprite } from "#lib/components/SpriteSelector.svelte";
  import ThemeSelector from "#lib/components/ThemeSelector.svelte";
  import { spriteStyle } from "#lib/data/sprite-preference.ts";
  import { readPreference, resolveContext, writePreference } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import { t } from "#lib/i18n/messages.ts";
  import { t as navigation } from "#lib/i18n/navigation.ts";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let games = $state<GameOption[] | null>(null);
  let gamesFailed = $state(false);
  let savedVersion = $state<string | null>(null);
  let selectedSprite = $state("official");
  let spriteReady = $state(false);
  let browseOpen = $state(false);
  let settingsOpen = $state(false);

  afterNavigate(() => {
    browseOpen = false;
    settingsOpen = false;
  });

  function dismissHeader(event: PointerEvent) {
    if (event.target instanceof Element && event.target.closest(".header-disclosure, [data-select-content]")) return;
    browseOpen = false;
    settingsOpen = false;
  }

  function escapeHeader(event: KeyboardEvent) {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    // A portalled select owns its first Escape; don't also dismiss its parent panel.
    if (event.target instanceof Element && event.target.closest("[data-select-content]")) return;
    const summary = document.querySelector<HTMLElement>(".header-disclosure[open] > summary");
    if (!summary) return;
    browseOpen = false;
    settingsOpen = false;
    summary.focus();
  }
  setSelectedSprite(() => spriteStyle(selectedSprite));

  function selectSprite(next: string) {
    selectedSprite = spriteStyle(next).id;
    writePreference("sprite", selectedSprite);
  }
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  // `detail` is the per-entry route under each section, so detail pages mark their section.
  const sections = [
    { key: "pokemon", path: "", detail: "pokemon/" },
    { key: "moves", path: "move/", detail: "move/" },
    { key: "abilities", path: "ability/", detail: "ability/" },
    { key: "items", path: "item/", detail: "item/" },
    { key: "eggGroups", path: "egg-group/", detail: "egg-group/" },
    { key: "types", path: "types/", detail: "types/" },
    { key: "compare", path: "compare/", detail: "compare/" },
    { key: "moveset", path: "moveset/", detail: "moveset/" },
    { key: "locations", path: "location/", detail: "location/" },
  ] as const;

  function current(section: (typeof sections)[number]) {
    const pathname = currentUrl.pathname;
    if (pathname === `/${data.lang}/${section.path}`) return "page";
    return pathname.startsWith(`/${data.lang}/${section.detail}`) ? "true" : undefined;
  }

  // Games and the saved preference exist only in the browser, so prerendered HTML and the
  // first client render show a disabled selector rather than a guessed default game.
  onMount(() => {
    savedVersion = readPreference("version");
    selectedSprite = spriteStyle(readPreference("sprite")).id;
    spriteReady = true;
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

  // Pages whose content depends on the game keep explicit game choices shareable.
  const versionedRoutes: ReadonlySet<string> = new Set([
    "/[lang]",
    "/[lang]/egg-group",
    "/[lang]/egg-group/[id]",
    "/[lang]/types",
    "/[lang]/types/coverage",
    "/[lang]/compare",
    "/[lang]/moveset",
    "/[lang]/location",
    "/[lang]/location/[id]",
  ]);

  function selectVersion(next: string) {
    writePreference("version", next);
    savedVersion = next;
    // Start from the shallow URL so catalogue filters and selected types survive game changes.
    const routeId = page.route.id ?? "";
    if (
      routeId.startsWith("/[lang]/pokemon/") ||
      versionedRoutes.has(routeId) ||
      currentUrl.searchParams.has("version")
    ) {
      const url = new URL(currentUrl.href);
      url.searchParams.set("version", next);
      void goto(url, { reset: false });
    }
  }

</script>

<a class="skip-link" href="#main">{t(data.lang, "site.skipToContent")}</a>

<svelte:window onpointerdown={dismissHeader} onkeydown={escapeHeader} />

{#snippet browseLinks()}
  <ul class="inline-list">
    {#each sections as section (section.key)}
      <li>
        <a
          href={resolve(`${data.lang}/${section.path}${version ? `?version=${encodeURIComponent(version)}` : ""}` as PathnameWithSearchOrHash)}
          aria-current={current(section)}
          onclick={() => { browseOpen = false; }}
        >{navigation(data.lang, section.key)}</a>
      </li>
    {/each}
  </ul>
{/snippet}

<header class="site-header">
  <div class="site-bar">
    <a class="site-name" href={resolve(`${data.lang}/`)}>{t(data.lang, "site.name")}</a>
    <SearchDialog lang={data.lang} {games} {version} />
    <details class="header-disclosure mobile-browse" name="header-panel" bind:open={browseOpen}>
      <summary>{navigation(data.lang, "browse")}</summary>
      <nav class="header-panel browse-navigation" aria-label={navigation(data.lang, "label")}>
        {@render browseLinks()}
      </nav>
    </details>
    <details class="header-disclosure settings-menu" name="header-panel" bind:open={settingsOpen}>
      <summary>{t(data.lang, "site.settings")}</summary>
      <div class="header-panel settings-panel" role="group" aria-label={t(data.lang, "site.controls")}>
        <GameSelector
          lang={data.lang}
          {games}
          value={version}
          onchange={selectVersion}
          error={gamesFailed}
        />
        <LanguageSwitcher lang={data.lang} />
        <SpriteSelector lang={data.lang} {games} value={selectedSprite} ready={spriteReady && !!games} onchange={selectSprite} />
        <ThemeSelector lang={data.lang} />
      </div>
    </details>
    <nav class="browse-navigation desktop-navigation" aria-label={navigation(data.lang, "label")}>
      {@render browseLinks()}
    </nav>
  </div>
</header>

<noscript>
  <p class="noscript-notice">{t(data.lang, "noscript.notice")}</p>
</noscript>

<main id="main" tabindex="-1">
  {@render children()}
</main>
