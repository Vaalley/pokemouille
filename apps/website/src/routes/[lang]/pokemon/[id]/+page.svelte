<script lang="ts">
  import { Button } from "bits-ui";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { EvolutionChainProjection, GameOption } from "../../../../../../../packages/pokemon-data/src/index.ts";
  import Abilities from "#lib/components/pokemon/Abilities.svelte";
  import Breeding from "#lib/components/pokemon/Breeding.svelte";
  import Coverage from "#lib/components/pokemon/Coverage.svelte";
  import Dex from "#lib/components/pokemon/Dex.svelte";
  import Encounters from "#lib/components/pokemon/Encounters.svelte";
  import Evolution from "#lib/components/pokemon/Evolution.svelte";
  import Facts from "#lib/components/pokemon/Facts.svelte";
  import FormSelector from "#lib/components/pokemon/FormSelector.svelte";
  import History from "#lib/components/pokemon/History.svelte";
  import Identity from "#lib/components/pokemon/Identity.svelte";
  import Learnset from "#lib/components/pokemon/Learnset.svelte";
  import Sprites from "#lib/components/pokemon/Sprites.svelte";
  import Stats from "#lib/components/pokemon/Stats.svelte";
  import Types from "#lib/components/pokemon/Types.svelte";
  import { compareKey } from "#lib/data/compare.ts";
  import {
    DEFAULT_VERSION,
    pokemonHref,
    readPreference,
    resolveContext,
  } from "#lib/data/context.ts";
  import { DataError, getEvolutionChain, getGames } from "#lib/data/loader.ts";
  import { loadPokemonData, resolvePokemonView } from "#lib/data/pokemon.ts";
  import type { PokemonData, PokemonView } from "#lib/data/pokemon.ts";
  import { reasonText, t, versionGroupName, versionName } from "#lib/i18n/pokemon.ts";
  import { t as breedingT } from "#lib/i18n/breeding.ts";
  import { t as encountersT } from "#lib/i18n/encounters.ts";
  import { t as historyT } from "#lib/i18n/pokemon-history.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const lang = $derived(data.lang);

  // Context-free paths from `pokemonHref` → base-resolved hrefs.
  function href(path: string) {
    return resolve(path.slice(1) as PathnameWithSearchOrHash);
  }

  // Games and the saved preference exist only in the browser: until they load, every
  // game-dependent panel stays in an explicit loading state (also in prerendered HTML).
  let games = $state<GameOption[] | null>(null);
  let gamesError = $state<unknown>(null);
  let mounted = $state(false);
  function loadGames() {
    gamesError = null;
    getGames().then(
      (loaded) => {
        games = loaded;
      },
      (cause: unknown) => {
        gamesError = cause;
      },
    );
  }
  onMount(() => {
    mounted = true;
    loadGames();
  });

  // All context lives in the URL, so Back/Forward and game/form changes re-derive it.
  const context = $derived(
    games
      ? resolveContext({
          url: page.url,
          language: lang,
          games,
          savedVersion: readPreference("version"),
        })
      : null,
  );

  let details = $state.raw<PokemonData | null>(null);
  let failure = $state<unknown>(null);
  let attempt = $state(0);
  $effect(() => {
    const speciesId = data.speciesId;
    void attempt;
    if (!mounted) return;
    let active = true;
    details = null;
    failure = null;
    loadPokemonData(speciesId).then(
      (loaded) => {
        if (active) details = loaded;
      },
      (cause: unknown) => {
        if (active) failure = cause;
      },
    );
    return () => { active = false; };
  });

  // Resolution waits for context, but downloading the inputs does not.
  const resolved = $derived.by((): { view: PokemonView | null; failure: unknown } => {
    if (!details || details.record.id !== data.speciesId || !context)
      return { view: null, failure: null };
    try {
      return { view: resolvePokemonView(details, context), failure: null };
    } catch (cause) {
      return { view: null, failure: cause };
    }
  });
  const view = $derived(resolved.view);

  let chain = $state.raw<EvolutionChainProjection | null>(null);
  let evolutionLoading = $state(true);
  let evolutionFailure = $state(false);
  let evolutionAttempt = $state(0);
  $effect(() => {
    const chainId = data.evolutionChainId;
    void attempt;
    void evolutionAttempt;
    if (!mounted) return;
    let active = true;
    chain = null;
    evolutionLoading = true;
    evolutionFailure = false;
    (chainId === null ? Promise.resolve(null) : getEvolutionChain(chainId)).then(
      (loaded) => {
        if (!active) return;
        chain = loaded;
        evolutionLoading = false;
      },
      () => {
        if (!active) return;
        evolutionFailure = true;
        evolutionLoading = false;
      },
    );
    return () => { active = false; };
  });

  function retry() {
    if (gamesError) loadGames();
    else attempt += 1;
  }

  const pokemon = $derived(view?.pokemon ?? null);
  const identityKey = $derived(
    `${(page.shallow?.url ?? page.url).pathname}:${mounted ? (page.shallow?.url ?? page.url).searchParams.get("form") ?? "" : ""}`,
  );
  const game = $derived(
    context ? games?.find((option) => option.version.identifier === context.version) : undefined,
  );
  const gameName = $derived(game ? versionName(lang, game.version) : (context?.version ?? ""));
  const groupName = $derived(
    view && pokemon
      ? versionGroupName(lang, view.references.versions, pokemon.context.versionGroupId)
      : "",
  );
  const defaultForm = $derived(
    view?.record.varieties
      .find((variety) => variety.isDefault)
      ?.forms.find((form) => form.isDefault)?.identifier ?? null,
  );
  const selectedForm = $derived(pokemon?.forms.find((form) => form.id === pokemon.formId) ?? null);
  const isDefaultForm = $derived(!selectedForm || selectedForm.identifier === defaultForm);
  const compareHref = $derived(
    context && pokemon
      ? href(`/${lang}/compare/?${new URLSearchParams({
          p: compareKey({
            speciesId: data.speciesId,
            form: selectedForm && isDefaultForm ? null : selectedForm?.identifier ?? context.form ?? null,
          }),
          version: context.version,
        })}`)
      : null,
  );

  // Not introduced / unknown: offer the game that introduced the shown form, else Scarlet.
  const alternative = $derived.by(() => {
    if (!view || !pokemon || pokemon.status === "available" || !games) return null;
    const introducedIn = view.record.varieties
      .flatMap((variety) => variety.forms)
      .find((form) => form.id === pokemon.formId)?.versionGroupId;
    const target =
      games.find((option) => option.group.id === introducedIn) ??
      games.find((option) => option.version.identifier === DEFAULT_VERSION);
    return target && target.version.identifier !== pokemon.context.version ? target : null;
  });

  const errorMessage = $derived.by(() => {
    const cause = resolved.failure ?? failure ?? gamesError;
    if (cause === null) return null;
    if (!(cause instanceof DataError)) return t(lang, "state.error.unknown");
    if (cause.kind === "network") return t(lang, "state.error.network");
    if (cause.kind === "not-found") return t(lang, "state.error.notFound");
    return context?.form
      ? t(lang, "state.error.invalidForm", { form: context.form })
      : t(lang, "state.error.invalid");
  });

  function selectForm(identifier: string) {
    if (!context) return;
    void goto(
      href(
        pokemonHref(lang, data.speciesId, {
          version: context.version,
          form: identifier === defaultForm ? null : identifier,
        }),
      ),
      { reset: false },
    );
  }

  const neighbours = $derived([
    { key: "identity.previous", entry: data.previous },
    { key: "identity.next", entry: data.next },
  ] as const);
  const SOURCE_KEYS = {
    url: "context.source.url",
    preference: "context.source.preference",
    default: "context.source.default",
  } as const;

  let contentsOpen = $state(false);
  const currentHash = $derived((page.shallow?.url ?? page.url).hash);
  const sectionItems = $derived([
    { id: "pokemon-overview", label: t(lang, "page.overview") },
    { id: "pokemon-stats", label: t(lang, "stats.heading") },
    { id: "pokemon-facts", label: t(lang, "facts.heading") },
    { id: "pokemon-abilities", label: t(lang, "abilities.heading") },
    { id: "pokemon-dex", label: t(lang, "dex.heading") },
    { id: "pokemon-evolution", label: t(lang, "evolution.heading") },
    { id: "pokemon-breeding", label: breedingT(lang, "heading") },
    { id: "pokemon-sprites", label: t(lang, "sprites.heading") },
    { id: "pokemon-history", label: historyT(lang, "history.heading") },
    { id: "pokemon-moves", label: t(lang, "moves.heading") },
    { id: "pokemon-encounters", label: encountersT(lang, "heading") },
    { id: "pokemon-coverage", label: t(lang, "coverage.heading") },
  ]);
</script>

<svelte:head>
  <title>{t(lang, "meta.title", { name: data.name.text, number: data.speciesId })}</title>
  <meta
    name="description"
    content={data.genus
      ? t(lang, "meta.descriptionGenus", {
          name: data.name.text,
          number: data.speciesId,
          genus: data.genus.text,
          generation: data.generationId,
        })
      : t(lang, "meta.description", {
          name: data.name.text,
          number: data.speciesId,
          generation: data.generationId,
        })}
  />
</svelte:head>

{#snippet contentsLinks()}
  <ol>
    {#each sectionItems as section (section.id)}
      <li><a href={`#${section.id}`} aria-current={currentHash === `#${section.id}` || (!currentHash && section.id === "pokemon-overview") ? "location" : undefined} onclick={() => { contentsOpen = false; }}>{section.label}</a></li>
    {/each}
  </ol>
{/snippet}

<div class="pokemon-layout">
  <aside class="page-contents">
    {#if view}
      <nav aria-label={t(lang, "page.contents")}>
        <p class="contents-heading">{t(lang, "page.contents")}</p>
        {@render contentsLinks()}
        {#if context}<div class="contents-context"><span>{t(lang, "context.game", { game: gameName })}</span></div>{/if}
      </nav>
    {/if}
  </aside>
  <article id="pokemon-overview" tabindex="-1">
    {#if view}
      <details class="mobile-contents" bind:open={contentsOpen}>
        <summary>{t(lang, "page.contents")}</summary>
        <nav aria-label={t(lang, "page.contents")}>{@render contentsLinks()}</nav>
      </details>
    {/if}
  <nav class="pager" aria-label={t(lang, "identity.adjacent")}>
    <ul class="inline-list">
      {#each neighbours as { key, entry } (key)}
        {#if entry}
          <li class={key === "identity.next" ? "next" : "previous"}>
            <a
              rel={key === "identity.next" ? "next" : "prev"}
              href={href(pokemonHref(lang, entry.speciesId, {
                version: context?.version ?? (mounted ? page.url.searchParams.get("version") : null),
                form: null,
              }))}
              >{t(lang, key, { number: entry.speciesId, name: entry.name.text })}</a
            >
          </li>
        {/if}
      {/each}
    </ul>
  </nav>

  <Identity
    {lang}
    {pokemon}
    {identityKey}
    speciesId={data.speciesId}
    name={data.name}
    genus={data.genus}
    generationId={data.generationId}
    isLegendary={data.isLegendary}
    isMythical={data.isMythical}
    formName={pokemon && !isDefaultForm ? pokemon.name : null}
    artwork={pokemon ? pokemon.media.artwork : undefined}
    sprites={pokemon?.media.sprites}
    games={games ?? []}
  >
    {#snippet actions()}
      {#if compareHref}
        <a class="compare-link" href={compareHref}>{t(lang, "page.compare")} <span aria-hidden="true">↗</span></a>
      {/if}
      {#if view && pokemon}
        <a class="stats-link" href="#pokemon-stats">{t(lang, "page.exploreStats")} <span aria-hidden="true">↓</span></a>
      {/if}
    {/snippet}
    {#snippet types()}
      {#if view && pokemon}
        <Types {lang} types={pokemon.types} generationId={pokemon.context.generationId} referenceTypes={view.references.types} />
      {/if}
    {/snippet}
    <div class="pokemon-context">
      {#if context}
        <div class="context-game">
          <strong>{t(lang, "context.game", { game: gameName })}</strong>
          <p class="note">{t(lang, SOURCE_KEYS[context.versionSource])}</p>
        </div>
      {/if}
      {#if view && pokemon && pokemon.forms.length > 1 && selectedForm}
        <div class="context-fields">
          <FormSelector {lang} forms={pokemon.forms} selected={selectedForm.identifier} onselect={selectForm} />
        </div>
      {/if}
      {#if context?.rejectedVersion}
        <p class="context-rejected note">
          {t(lang, "context.rejected", { version: context.rejectedVersion, game: gameName })}
          <a href={href(pokemonHref(lang, data.speciesId, context))}
            >{t(lang, "context.rejectedLink", { game: gameName })}</a
          >
        </p>
      {/if}
    </div>
  </Identity>

  <div aria-live="polite">
    {#if errorMessage}
      <div class="detail-feedback detail-feedback--error">
      <h2>{t(lang, "state.errorHeading")}</h2>
      <p>{errorMessage}</p>
      <p class="detail-feedback__actions">
        <Button.Root type="button" onclick={retry}>{t(lang, "state.retry")}</Button.Root>
        {#if context?.form}
          <a
            href={href(pokemonHref(lang, data.speciesId, { version: context.version, form: null }))}
            >{t(lang, "state.defaultForm")}</a
          >
        {/if}
      </p>
      </div>
    {:else if !games}
      <p class="detail-feedback detail-feedback--loading">{t(lang, "state.loadingGames")}</p>
    {:else if !view}
      <p class="detail-feedback detail-feedback--loading">{t(lang, "state.loading", { game: gameName })}</p>
    {:else if pokemon && pokemon.status !== "available"}
      <p class="detail-feedback detail-feedback--missing">
        {t(lang, pokemon.status === "not-introduced" ? "status.notIntroduced" : "status.unknown", {
          name: pokemon.name.text,
          game: gameName,
        })}
      </p>
    {/if}
  </div>

  {#if view && pokemon && context && game}
    {#if pokemon.status !== "available"}
      <ul class="inline-list">
        {#if alternative}
          <li>
            <a
              href={href(
                pokemonHref(lang, data.speciesId, {
                  version: alternative.version.identifier,
                  form: context.form,
                }),
              )}>{t(lang, "status.alternative", { game: versionName(lang, alternative.version) })}</a
            >
          </li>
        {/if}
        {#if !isDefaultForm}
          <li>
            <a
              href={href(
                pokemonHref(lang, data.speciesId, { version: context.version, form: null }),
              )}>{t(lang, "state.defaultForm")}</a
            >
          </li>
        {/if}
      </ul>
    {/if}

    <div class="context-notes note">
      <p>{reasonText(lang, pokemon.availability.reason)}</p>
      {#if pokemon.mechanics.gameSpecificRules === "unverified"}
        <p>{t(lang, "context.mechanics")}</p>
      {/if}
    </div>

    <div class="overview">
      <div class="column">
        <div class="detail-section" id="pokemon-stats" tabindex="-1">
          <Stats {lang} stats={pokemon.stats} game={gameName} mechanicsGame={{ generationId: pokemon.context.generationId, versionGroup: game.group.identifier }} />
        </div>
        <div class="detail-section" id="pokemon-abilities" tabindex="-1">
          <Abilities {lang} abilities={pokemon.abilities} games={groupName} />
        </div>
      </div>
      <div class="column">
        <div class="detail-section" id="pokemon-facts" tabindex="-1">
          <Facts {lang} physical={pokemon.physical} speciesFacts={pokemon.speciesFacts} regionalDexNumbers={pokemon.regionalDexNumbers} game={gameName} mechanicsGame={{ generationId: pokemon.context.generationId, versionGroup: game.group.identifier }} />
        </div>
        <div class="detail-section" id="pokemon-dex" tabindex="-1">
          <Dex {lang} flavorText={pokemon.flavorText} game={gameName} flavorTexts={view.record.flavorTexts} references={view.references} versionId={pokemon.context.versionId} formShared={!isDefaultForm} />
        </div>
      </div>
    </div>
    <div class="page-sections">
      <div class="detail-section" id="pokemon-evolution" tabindex="-1">
        <Evolution
          {lang}
          {chain}
          loading={evolutionLoading}
          failed={evolutionFailure}
          onretry={() => { evolutionAttempt += 1; }}
          forms={data.evolutionForms}
          hasChain={view.record.evolutionChainId !== null}
          speciesId={data.speciesId}
          formId={pokemon.formId}
          version={context.version}
          generationId={pokemon.context.generationId}
          game={gameName}
          references={view.references}
        />
      </div>
      <div class="detail-section" id="pokemon-breeding" tabindex="-1">
        <Breeding {lang} record={view.record} {pokemon} references={view.references} group={game.group} version={context.version} />
      </div>
      <div class="detail-section" id="pokemon-sprites" tabindex="-1">
        {#key pokemon.pokemonId}
          <Sprites {lang} name={pokemon.name.text} sprites={pokemon.media.sprites} versions={view.references.versions} versionGroups={view.references.versionGroups} />
        {/key}
      </div>
      <div class="detail-section" id="pokemon-history" tabindex="-1">
        <History {lang} record={view.record} references={view.references} form={context.form ?? undefined} />
      </div>
      <div class="detail-section" id="pokemon-moves" tabindex="-1">
        <Learnset {lang} learnset={pokemon.learnset} games={groupName} referenceMoves={view.references.moves} />
      </div>
      <div class="detail-section" id="pokemon-encounters" tabindex="-1">
        <Encounters {lang} varieties={view.record.varieties} {pokemon} version={context.version} references={view.references} game={gameName} />
      </div>
      <div class="detail-section" id="pokemon-coverage" tabindex="-1">
        <Coverage {lang} coverage={pokemon.coverage} games={groupName} />
      </div>
    </div>
  {/if}
  </article>
</div>

<style>
  .pokemon-layout { display: grid; grid-template-columns: 11rem minmax(0, 1fr); gap: 2.5rem; align-items: start; }
  article { min-width: 0; scroll-margin-block-start: 1.5rem; }
  .page-contents { position: sticky; top: 1.5rem; min-width: 0; max-height: calc(100dvh - 3rem); overflow-y: auto; padding-inline-end: 1.25rem; border-inline-end: 1px solid var(--border); }
  .contents-heading { margin: 0 0 1rem; color: var(--muted); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.08em; }
  .page-contents ol, .mobile-contents ol { margin: 0; padding: 0; list-style: none; }
  .page-contents a, .mobile-contents a { display: flex; align-items: center; min-height: 2.75rem; padding: 0.5rem 0.625rem; border-inline-start: 2px solid transparent; color: var(--muted); font-size: 0.75rem; line-height: 1.5; text-decoration: none; overflow-wrap: anywhere; }
  .page-contents a[aria-current], .mobile-contents a[aria-current] { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); font-weight: 600; }
  .page-contents a:hover, .mobile-contents a:hover { color: var(--page-text); text-decoration: underline; text-underline-offset: 0.25em; }
  .contents-context { margin-block-start: 2rem; padding-block-start: 1rem; border-block-start: 1px solid var(--border); color: var(--muted); font-size: 0.75rem; overflow-wrap: anywhere; }
  .mobile-contents { display: none; }
  .pager { margin-block-end: 0.75rem; font-size: 0.6875rem; font-weight: 400; }
  .pager ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
  .pager li { min-width: 0; }
  .pager a { display: flex; align-items: center; gap: 0.625rem; min-height: 2.75rem; padding: 0.375rem 0; color: var(--muted); text-underline-offset: 0.25em; line-height: 1.5; overflow-wrap: anywhere; }
  .pager a:is(:hover, :focus-visible) { color: var(--page-text); }
  .pager .next { grid-column: 2; }
  .pager .next a { justify-content: flex-end; text-align: end; }
  .pager a::before, .pager a::after { flex-shrink: 0; }
  .pager .previous a::before { content: "← " / ""; }
  .pager .next a::after { content: " →" / ""; }
  .pokemon-context { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: center; gap: 1rem 1.5rem; min-width: 0; }
  .context-game, .context-fields { min-width: 0; }
  .context-game strong { display: block; overflow-wrap: anywhere; font-size: 0.875rem; font-weight: 500; }
  .context-game p { margin: 0.25rem 0 0; font-size: 0.6875rem; }
  .context-fields :global(.form-selector) { width: 100%; }
  .context-fields :global(.form-trigger) { width: 100%; font-size: 0.8125rem; }
  .compare-link { display: inline-flex; align-items: center; justify-content: space-between; gap: 1.25rem; min-height: 2.75rem; max-width: 100%; padding: 0.625rem 0.875rem; border: 1px solid var(--page-text); border-radius: var(--radius-control); color: var(--page-background); background: var(--page-text); font-size: 0.8125rem; font-weight: 600; text-decoration: none; overflow-wrap: anywhere; }
  .compare-link:hover { color: var(--page-background); background: var(--muted); border-color: var(--muted); }
  .stats-link { display: inline-flex; align-items: center; gap: 0.75rem; min-height: 2.75rem; font-size: 0.8125rem; text-decoration: none; }
  .stats-link:hover { text-decoration: underline; text-underline-offset: 0.25em; }
  .context-rejected { grid-column: 1 / -1; margin: 0; }
  .context-notes { margin-block: 1rem 2.5rem; color: var(--muted); font-size: 0.75rem; line-height: 1.7; }
  .context-notes p { margin-block: 0.25rem; max-width: var(--measure); }
  .overview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2.5rem; }
  .column { min-width: 0; display: flex; flex-direction: column; gap: 2rem; }
  .detail-section { min-width: 0; scroll-margin-block-start: 1.5rem; }
  .page-sections > .detail-section { margin-block-start: 2.5rem; padding-block-start: 2rem; border-block-start: 1px solid var(--border); }
  .page-sections > .detail-section :global(section > h2:first-child) { margin-block-start: 0; }
  @media (max-width: 74rem) {
    .pokemon-layout { grid-template-columns: minmax(0, 1fr); gap: 0; }
    .page-contents { display: none; }
    .mobile-contents { display: block; margin-block-end: 1rem; border-block-end: 1px solid var(--border); }
    .mobile-contents > summary { min-height: 2.75rem; align-content: center; padding-block: 0.625rem; color: var(--muted); font-size: 0.8125rem; cursor: pointer; }
    .mobile-contents nav { max-height: 60dvh; overflow-y: auto; padding-block-end: 0.75rem; }
  }
  @media (max-width: 48rem) {
    .overview { grid-template-columns: minmax(0, 1fr); gap: 2rem; }
  }
  @media (max-width: 40rem) {
    .pokemon-context { grid-template-columns: minmax(0, 1fr); }
  }
  @media (forced-colors: active) {
    .compare-link, .compare-link:hover { color: LinkText; background: Canvas; border-color: ButtonBorder; }
  }
</style>
