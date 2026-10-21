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
  import GameSelector, { getVersionChangeHandler } from "#lib/components/GameSelector.svelte";
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

  const selectVersion = getVersionChangeHandler();

  const neighbours = $derived([
    { key: "identity.previous", entry: data.previous },
    { key: "identity.next", entry: data.next },
  ] as const);
  const SOURCE_KEYS = {
    url: "context.source.url",
    preference: "context.source.preference",
    default: "context.source.default",
  } as const;
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

<article>
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
    {#snippet types()}
      {#if view && pokemon}
        <Types {lang} types={pokemon.types} generationId={pokemon.context.generationId} referenceTypes={view.references.types} />
      {/if}
    {/snippet}
    <div class="pokemon-context">
      <div class="context-fields">
        <GameSelector {lang} {games} value={context?.version ?? null} onchange={selectVersion} error={!!gamesError} />
        {#if view && pokemon && pokemon.forms.length > 1 && selectedForm}
          <FormSelector {lang} forms={pokemon.forms} selected={selectedForm.identifier} onselect={selectForm} />
        {/if}
      </div>
      <div class="context-meta">
        {#if context}
          <p class="note">{t(lang, SOURCE_KEYS[context.versionSource])}</p>
        {/if}
        {#if compareHref}<p><a href={compareHref}>{historyT(lang, "compare.link")}</a></p>{/if}
      </div>
      {#if context?.rejectedVersion}
        <p class="note">
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
      <h2>{t(lang, "state.errorHeading")}</h2>
      <p>{errorMessage}</p>
      <p>
        <Button.Root type="button" onclick={retry}>{t(lang, "state.retry")}</Button.Root>
        {#if context?.form}
          <a
            href={href(pokemonHref(lang, data.speciesId, { version: context.version, form: null }))}
            >{t(lang, "state.defaultForm")}</a
          >
        {/if}
      </p>
    {:else if !games}
      <p>{t(lang, "state.loadingGames")}</p>
    {:else if !view}
      <p>{t(lang, "state.loading", { game: gameName })}</p>
    {:else if pokemon && pokemon.status !== "available"}
      <p>
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
    <!-- Balance the figure-heavy sections across columns instead of stacking both on the left. -->
    <div class="overview">
      <div class="column">
        <Stats {lang} stats={pokemon.stats} game={gameName} mechanicsGame={{ generationId: pokemon.context.generationId, versionGroup: game.group.identifier }} />
        <Abilities {lang} abilities={pokemon.abilities} games={groupName} />
      </div>
      <div class="column">
        <Facts {lang} physical={pokemon.physical} speciesFacts={pokemon.speciesFacts} regionalDexNumbers={pokemon.regionalDexNumbers} game={gameName} mechanicsGame={{ generationId: pokemon.context.generationId, versionGroup: game.group.identifier }} />
        <Dex {lang} flavorText={pokemon.flavorText} game={gameName} flavorTexts={view.record.flavorTexts} references={view.references} versionId={pokemon.context.versionId} formShared={!isDefaultForm} />
      </div>
    </div>
    <Breeding {lang} record={view.record} {pokemon} references={view.references} group={game.group} version={context.version} />
    <div class="page-sections">
      {#key pokemon.pokemonId}
        <Sprites {lang} name={pokemon.name.text} sprites={pokemon.media.sprites} versions={view.references.versions} versionGroups={view.references.versionGroups} />
      {/key}
      <History {lang} record={view.record} references={view.references} form={context.form ?? undefined} />
      <Learnset {lang} learnset={pokemon.learnset} games={groupName} referenceMoves={view.references.moves} />
      <Encounters {lang} varieties={view.record.varieties} {pokemon} version={context.version} references={view.references} game={gameName} />
      <Coverage {lang} coverage={pokemon.coverage} games={groupName} />
    </div>
  {/if}
</article>

<style>
  .pager {
    margin-block-end: 1rem;
    font-size: 0.875rem;
  }

  .pager ul {
    justify-content: space-between;
  }

  .pager .next {
    margin-inline-start: auto;
  }

  .pager .previous a::before {
    content: "← " / "";
  }

  .pager .next a::after {
    content: " →" / "";
  }

  .pokemon-context {
    padding-block-start: 0.75rem;
    border-block-start: var(--border-width) solid var(--border);
  }

  .context-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
  }

  .context-fields :global(.game-selector),
  .context-fields :global(.form-selector) {
    display: grid;
    flex: 1 1 12rem;
    align-content: start;
    align-items: start;
    gap: 0.25rem;
    min-width: 0;
    margin: 0;
  }

  .context-fields :global([data-select-trigger]) {
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    padding: 0.5rem 0.75rem;
    border: var(--border-width) solid var(--border-strong);
    background: var(--surface);
    color: var(--page-text);
    font: inherit;
    text-align: start;
    overflow-wrap: anywhere;
  }

  .context-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    margin-block-start: 0.5rem;
  }

  .context-meta p {
    margin: 0;
  }

  .context-notes {
    margin-block: 0.75rem 1.25rem;
  }

  .context-notes p {
    margin-block: 0.25rem;
  }
  .overview {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 3rem;
  }

  .column {
    min-width: 0;
  }

  /* Long full-width sections get a rule so each starts visibly. */
  .page-sections > :global(section) {
    margin-block-start: 3rem;
    border-block-start: var(--border-width) solid var(--border);
  }

  .page-sections > :global(section > h2) {
    margin-block-start: 1.25rem;
  }

  @media (max-width: 48rem) {
    .overview {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
