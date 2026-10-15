<script lang="ts">
  import { Button } from "bits-ui";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../../../packages/pokemon-data/src/index.ts";
  import Abilities from "#lib/components/pokemon/Abilities.svelte";
  import Coverage from "#lib/components/pokemon/Coverage.svelte";
  import Dex from "#lib/components/pokemon/Dex.svelte";
  import Evolution from "#lib/components/pokemon/Evolution.svelte";
  import Facts from "#lib/components/pokemon/Facts.svelte";
  import FormSelector from "#lib/components/pokemon/FormSelector.svelte";
  import Identity from "#lib/components/pokemon/Identity.svelte";
  import Learnset from "#lib/components/pokemon/Learnset.svelte";
  import Stats from "#lib/components/pokemon/Stats.svelte";
  import Types from "#lib/components/pokemon/Types.svelte";
  import {
    DEFAULT_VERSION,
    pokemonHref,
    readPreference,
    resolveContext,
  } from "#lib/data/context.ts";
  import { DataError, getGames } from "#lib/data/loader.ts";
  import { loadPokemonView } from "#lib/data/pokemon.ts";
  import type { PokemonView } from "#lib/data/pokemon.ts";
  import { reasonText, t, versionGroupName, versionName } from "#lib/i18n/pokemon.ts";
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
  onMount(loadGames);

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

  let view = $state<PokemonView | null>(null);
  let failure = $state<unknown>(null);
  let attempt = $state(0);
  // Monotonic request token: only the newest context's result may be shown.
  let token = 0;
  $effect(() => {
    const current = context;
    const speciesId = data.speciesId;
    void attempt;
    if (!current) return;
    const request = ++token;
    view = null;
    failure = null;
    loadPokemonView(speciesId, current).then(
      (loaded) => {
        if (request === token) view = loaded;
      },
      (cause: unknown) => {
        if (request === token) failure = cause;
      },
    );
  });

  function retry() {
    if (gamesError) loadGames();
    else attempt += 1;
  }

  const pokemon = $derived(view?.pokemon ?? null);
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
    const cause = failure ?? gamesError;
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
  <Identity
    {lang}
    speciesId={data.speciesId}
    name={data.name}
    genus={data.genus}
    generationId={data.generationId}
    formName={pokemon && !isDefaultForm ? pokemon.name : null}
    artwork={pokemon ? pokemon.media.artwork : undefined}
  />

  <nav aria-label={t(lang, "identity.adjacent")}>
    <ul class="inline-list">
      {#each neighbours as { key, entry } (key)}
        {#if entry}
          <li>
            <a
              href={context
                ? href(pokemonHref(lang, entry.speciesId, { version: context.version, form: null }))
                : resolve(`${lang}/pokemon/${entry.speciesId}/`)}
              >{t(lang, key, { number: entry.speciesId, name: entry.name.text })}</a
            >
          </li>
        {/if}
      {/each}
    </ul>
  </nav>

  {#if context}
    <p>
      {t(lang, "context.game", { game: gameName })}
      <small>({t(lang, SOURCE_KEYS[context.versionSource])})</small>
    </p>
    {#if context.rejectedVersion}
      <p>
        {t(lang, "context.rejected", { version: context.rejectedVersion, game: gameName })}
        <a href={href(pokemonHref(lang, data.speciesId, context))}
          >{t(lang, "context.rejectedLink", { game: gameName })}</a
        >
      </p>
    {/if}
  {/if}

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

  {#if view && pokemon && context}
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

    <p>{reasonText(lang, pokemon.availability.reason)}</p>
    {#if pokemon.mechanics.gameSpecificRules === "unverified"}
      <p>{t(lang, "context.mechanics")}</p>
    {/if}

    {#if pokemon.forms.length > 1 && selectedForm}
      <FormSelector {lang} forms={pokemon.forms} selected={selectedForm.identifier} onselect={selectForm} />
    {/if}

    <div class="panels">
      <Types {lang} types={pokemon.types} />
      <Stats {lang} stats={pokemon.stats} game={gameName} />
      <Abilities {lang} abilities={pokemon.abilities} games={groupName} />
      <Facts {lang} physical={pokemon.physical} speciesFacts={pokemon.speciesFacts} />
      <Dex {lang} flavorText={pokemon.flavorText} game={gameName} />
      <Evolution
        {lang}
        chain={view.chain}
        hasChain={view.record.evolutionChainId !== null}
        speciesId={data.speciesId}
        version={context.version}
        generationId={pokemon.context.generationId}
        game={gameName}
        references={view.references}
      />
    </div>
    <Learnset {lang} learnset={pokemon.learnset} games={groupName} />
    <Coverage {lang} coverage={pokemon.coverage} games={groupName} />
  {/if}
</article>

<style>
  .panels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: 1rem 2rem;
  }
</style>
