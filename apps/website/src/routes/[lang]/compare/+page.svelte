<script lang="ts">
  import { Meter } from "bits-ui";
  import { onMount, untrack } from "svelte";
  import { pushState } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type {
    GameOption,
    LocalizedText,
    ResolvedPokemon,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import ComparePicker from "#lib/components/ComparePicker.svelte";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import TypeBadge from "#lib/components/TypeBadge.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import {
    MAX_COMPARED,
    addCompared,
    compareKey,
    compareStats,
    compareUrl,
    readCompareSelection,
    removeCompared,
    splitDefensiveMatchups,
  } from "#lib/data/compare.ts";
  import type { ComparedPokemon, MatchupRow } from "#lib/data/compare.ts";
  import { DEFAULT_VERSION, pokemonHref, readPreference } from "#lib/data/context.ts";
  import { DataError, getGames } from "#lib/data/loader.ts";
  import { loadPokemonData, resolvePokemonView } from "#lib/data/pokemon.ts";
  import type { PokemonData, PokemonView } from "#lib/data/pokemon.ts";
  import { defensiveMatchups } from "#lib/data/type-matchups.ts";
  import { t } from "#lib/i18n/compare.ts";
  import { reasonText, t as pokemonText, versionName } from "#lib/i18n/pokemon.ts";
  import { t as typeText } from "#lib/i18n/types.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const lang = $derived(data.lang);
  const id = $props.id();

  let mounted = $state(false);
  let games = $state<GameOption[] | null>(null);
  let gamesFailed = $state(false);
  function loadGames() {
    gamesFailed = false;
    getGames().then(
      (loaded) => {
        games = loaded;
      },
      () => {
        gamesFailed = true;
      },
    );
  }
  onMount(() => {
    mounted = true;
    loadGames();
  });

  // The header's game (URL → saved preference → Scarlet), shared by every page.
  const selectedVersion = getSelectedVersion();
  const version = $derived(selectedVersion());
  const game = $derived(games?.find((entry) => entry.version.identifier === version) ?? null);
  const gameName = $derived(game ? versionName(lang, game.version) : "");

  // Prerendered HTML cannot know query parameters: read them once hydrated.
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  const selection = $derived(
    readCompareSelection(mounted ? new URL(currentUrl.href).searchParams : new URLSearchParams()),
  );
  const selectedKeys = $derived(selection.entries.map(compareKey));

  function update(entries: ComparedPokemon[]) {
    const url = compareUrl(new URL(currentUrl.href), entries);
    if (version) url.searchParams.set("version", version);
    if (url.href !== currentUrl.href) pushState(url, page.state);
  }

  // Only the compared species files load (shared, cached loader); forms reuse their species.
  type Loaded = { data: PokemonData } | { failure: unknown };
  let loaded = $state.raw<ReadonlyMap<number, Loaded>>(new Map());
  let attempt = $state(0);
  const speciesIds = $derived([...new Set(selection.entries.map((entry) => entry.speciesId))]);
  $effect(() => {
    void attempt;
    for (const speciesId of speciesIds) {
      const current = untrack(() => loaded.get(speciesId));
      if (current && "data" in current) continue;
      loadPokemonData(speciesId).then(
        (result) => {
          loaded = new Map(loaded).set(speciesId, { data: result });
        },
        (failure: unknown) => {
          loaded = new Map(loaded).set(speciesId, { failure });
        },
      );
    }
  });
  function retry() {
    loaded = new Map([...loaded].filter(([, result]) => "data" in result));
    attempt += 1;
  }

  function errorText(cause: unknown, entry: ComparedPokemon): string {
    if (!(cause instanceof DataError)) return pokemonText(lang, "state.error.unknown");
    if (cause.kind === "network") return pokemonText(lang, "state.error.network");
    if (cause.kind === "not-found") return t(lang, "notFound");
    return entry.form
      ? t(lang, "invalidForm", { form: entry.form })
      : pokemonText(lang, "state.error.invalid");
  }

  // PokemonContext records where the game came from; resolution itself reads language, version and form.
  const versionSource = $derived(
    version !== null && currentUrl.searchParams.get("version") === version
      ? ("url" as const)
      : version === DEFAULT_VERSION && readPreference("version") !== DEFAULT_VERSION
        ? ("default" as const)
        : ("preference" as const),
  );

  type Column = { key: string; entry: ComparedPokemon } & (
    | { state: "loading" }
    | { state: "error"; message: string }
    | { state: "ready"; view: PokemonView; pokemon: ResolvedPokemon }
  );
  const columns = $derived(
    selection.entries.map((entry): Column => {
      const key = compareKey(entry);
      const result = loaded.get(entry.speciesId);
      if (result && "failure" in result)
        return { key, entry, state: "error", message: errorText(result.failure, entry) };
      if (!result || version === null) return { key, entry, state: "loading" };
      try {
        const view = resolvePokemonView(result.data, {
          language: lang,
          version,
          versionSource,
          form: entry.form,
          rejectedVersion: null,
        });
        return { key, entry, state: "ready", view, pokemon: view.pokemon };
      } catch (cause) {
        return { key, entry, state: "error", message: errorText(cause, entry) };
      }
    }),
  );
  const ready = $derived(columns.flatMap((column) => (column.state === "ready" ? [column] : [])));
  const hasFailures = $derived(columns.some((column) => column.state === "error"));

  /** The Pokémon's resolved data for this game, or null while loading, failed or not in it. */
  function available(column: Column): ResolvedPokemon | null {
    return column.state === "ready" && column.pokemon.status === "available" ? column.pokemon : null;
  }

  const stats = $derived(
    compareStats(
      columns.map((column) => {
        const pokemon = available(column);
        return pokemon && pokemon.stats.status === "available" ? pokemon.stats.value : null;
      }),
    ),
  );
  // Stat 9 is the single Generation I "Special".
  const SPECIAL_STAT_ID = 9;
  const hasSpecial = $derived(stats.rows.some((row) => row.stat.id === SPECIAL_STAT_ID));

  function matchups(pokemon: ResolvedPokemon) {
    if (pokemon.types.status !== "available") return null;
    const rows = defensiveMatchups(
      pokemon.types.value.map((type) => type.id),
      pokemon.context.generationId,
    );
    return rows ? splitDefensiveMatchups(rows) : null;
  }
  const columnMatchups = $derived(
    columns.map((column) => {
      const pokemon = available(column);
      return pokemon ? matchups(pokemon) : null;
    }),
  );
  const MATCHUP_ROWS = ["weaknesses", "resistances", "immunities"] as const;
  const MEASURES = ["height", "weight"] as const;

  function typeName(view: PokemonView, typeId: number): LocalizedText {
    const type = view.references.types.find((row) => row.id === typeId);
    return localize(type?.names ?? [], lang, type?.identifier ?? String(typeId));
  }

  // Source units: height in decimetres, weight in hectograms.
  const metres = $derived(
    new Intl.NumberFormat(lang, { style: "unit", unit: "meter", maximumFractionDigits: 1 }),
  );
  const kilograms = $derived(
    new Intl.NumberFormat(lang, { style: "unit", unit: "kilogram", maximumFractionDigits: 1 }),
  );

  function href(path: string) {
    return resolve(path.slice(1) as PathnameWithSearchOrHash);
  }
  function abilityHref(abilityId: number) {
    const query = version ? `?${new URLSearchParams({ version })}` : "";
    return resolve(`${lang}/ability/${abilityId}/${query}` as PathnameWithSearchOrHash);
  }

  function columnName(column: Column): string {
    if (column.state === "ready") return column.pokemon.name.text;
    const number = pokemonText(lang, "identity.numberValue", { number: column.entry.speciesId });
    return column.entry.form ? `${number} (${column.entry.form})` : number;
  }

  let failedImages = $state<string[]>([]);

  const availabilityReason = $derived(
    ready.find((column) => column.pokemon.status === "available")?.pokemon.availability.reason ??
      null,
  );
  const unverifiedMechanics = $derived(
    ready.some((column) => column.pokemon.mechanics.gameSpecificRules === "unverified"),
  );
</script>

<svelte:head>
  <title>{t(lang, "heading")} | Pokémouille</title>
</svelte:head>

<h1>{t(lang, "heading")}</h1>
<p>{t(lang, "intro", { max: MAX_COMPARED })}</p>

{#snippet blocked(column: Column)}
  {#if column.state === "loading"}
    {t(lang, "loadingColumn")}
  {:else if column.state === "error"}
    <span aria-hidden="true">—</span><span class="visually-hidden">{t(lang, "loadError")}</span>
  {:else if column.pokemon.status === "not-introduced"}
    {t(lang, "notIntroduced")}
  {:else}
    {t(lang, "unknown")}
  {/if}
{/snippet}

{#snippet matchupList(view: PokemonView, rows: MatchupRow[])}
  {#if rows.length}
    <ul class="matchups">
      {#each rows as row (row.typeId)}
        <li><TypeBadge typeId={row.typeId} name={typeName(view, row.typeId)} /><span>×{row.multiplier}</span></li>
      {/each}
    </ul>
  {:else}
    {typeText(lang, "none")}
  {/if}
{/snippet}

{#if !mounted}
  <p role="status">{t(lang, "loading")}</p>
  <noscript><p>{t(lang, "javascript")}</p></noscript>
{:else}
  <ComparePicker
    {lang}
    {games}
    {version}
    selected={selectedKeys}
    onadd={(entry) => update(addCompared(selection.entries, entry))}
  />

  {#if selection.invalid}
    <p class="note" role="status">{t(lang, "invalid")}</p>
  {/if}
  {#if selection.truncated}
    <p class="note" role="status">{t(lang, "truncated", { max: MAX_COMPARED })}</p>
  {/if}

  {#if gamesFailed}
    <p role="alert">{t(lang, "gamesError")}</p>
    <p><button type="button" onclick={loadGames}>{t(lang, "retry")}</button></p>
  {:else if selection.entries.length === 0}
    <p role="status">{t(lang, "empty")}</p>
  {:else if version === null || !game}
    <p role="status">{t(lang, "loadingGames")}</p>
  {:else}
    <div class="compare-actions">
      {#if selection.entries.length === 1}
        <p role="status">{t(lang, "single")}</p>
      {/if}
      {#if hasFailures}
        <button type="button" onclick={retry}>{t(lang, "retry")}</button>
      {/if}
      <button type="button" onclick={() => update([])}>{t(lang, "clear")}</button>
    </div>

    <div class="table-scroll" role="region" aria-labelledby="{id}-caption" tabindex="0">
      <table class="compare-table">
        <caption id="{id}-caption">{t(lang, "caption", { game: gameName })}</caption>
        <thead>
          <tr>
            <th scope="col"><span class="visually-hidden">{t(lang, "attribute")}</span></th>
            {#each columns as column (column.key)}
              <th scope="col" class="pokemon-heading">
                {#if column.state === "ready"}
                  {@const artwork = column.pokemon.media.artwork}
                  {#if artwork && !failedImages.includes(artwork)}
                    <img
                      src={artwork}
                      alt={t(lang, "artwork", { name: column.pokemon.name.text })}
                      width="96"
                      height="96"
                      loading="lazy"
                      onerror={() => { failedImages = [...failedImages, artwork]; }}
                    />
                  {:else}
                    <PokemonIcon speciesId={column.entry.speciesId} />
                  {/if}
                  <span class="species-number">{pokemonText(lang, "identity.numberValue", { number: column.entry.speciesId })}</span>
                  <a href={href(pokemonHref(lang, column.entry.speciesId, { version: column.pokemon.context.version, form: column.entry.form }))}
                    ><Localized text={column.pokemon.name} /></a
                  >
                  {#if column.pokemon.speciesName.text !== column.pokemon.name.text}
                    <span class="species-name">(<Localized text={column.pokemon.speciesName} />)</span>
                  {/if}
                  {#if column.pokemon.status !== "available"}
                    <span class="note status">
                      {pokemonText(
                        lang,
                        column.pokemon.status === "not-introduced" ? "status.notIntroduced" : "status.unknown",
                        { name: column.pokemon.name.text, game: gameName },
                      )}
                    </span>
                  {/if}
                {:else}
                  <PokemonIcon speciesId={column.entry.speciesId} />
                  <span>{columnName(column)}</span>
                  {#if column.state === "error"}
                    <span class="note status" role="alert">{column.message}</span>
                  {:else}
                    <span class="note status">{t(lang, "loadingColumn")}</span>
                  {/if}
                {/if}
                <button
                  type="button"
                  class="remove"
                  onclick={() => update(removeCompared(selection.entries, column.key))}
                >{t(lang, "remove", { name: columnName(column) })}</button>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{t(lang, "types")}</th>
            {#each columns as column (column.key)}
              {@const pokemon = available(column)}
              <td>
                {#if !pokemon}
                  {@render blocked(column)}
                {:else if pokemon.types.status === "available"}
                  {@const defendingTypes = pokemon.types.value.map((type) => type.id)}
                  <span class="types">
                    {#each pokemon.types.value as type (type.slot)}
                      <TypeBadge typeId={type.id} name={type.name} {defendingTypes} />
                    {/each}
                  </span>
                {:else}
                  {reasonText(lang, pokemon.types.reason)}
                {/if}
              </td>
            {/each}
          </tr>
        </tbody>

        <tbody>
          {#if stats.rows.length}
            <tr>
              <th scope="rowgroup" colspan={columns.length + 1}>{t(lang, "stats")}</th>
            </tr>
            {#each stats.rows as row (row.stat.id)}
              <tr>
                <th scope="row">
                  {#if row.stat.id === SPECIAL_STAT_ID && row.stat.name.sourceLanguageId === null}
                    <!-- PokéAPI has no localized name for Generation I Special; this is our UI label. -->
                    {pokemonText(lang, "stat.special")}
                  {:else}
                    <Localized text={row.stat.name} />
                  {/if}
                </th>
                {#each columns as column, index (column.key)}
                  {@const value = row.values[index]}
                  {@const pokemon = available(column)}
                  <td class="stat">
                    {#if value !== null && value !== undefined}
                      <span class="value" class:highest={row.highest[index]}>{value}</span>{#if row.highest[index]}<span class="visually-hidden"> ({t(lang, "highest")})</span>{/if}
                      <Meter.Root min={0} max={255} {value} aria-hidden="true"><span class="meter-fill" style="width: {(Math.min(255, value) / 255) * 100}%"></span></Meter.Root>
                    {:else if !pokemon}
                      {@render blocked(column)}
                    {:else if pokemon.stats.status !== "available"}
                      {reasonText(lang, pokemon.stats.reason)}
                    {:else}
                      <span aria-hidden="true">—</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
            <tr class="total">
              <th scope="row">{pokemonText(lang, "stats.total")}</th>
              {#each columns as column, index (column.key)}
                {@const value = stats.total.values[index]}
                {@const pokemon = available(column)}
                <td>
                  {#if value !== null && value !== undefined}
                    <span class="value" class:highest={stats.total.highest[index]}>{value}</span>{#if stats.total.highest[index]}<span class="visually-hidden"> ({t(lang, "highest")})</span>{/if}
                  {:else if !pokemon}
                    {@render blocked(column)}
                  {:else if pokemon.stats.status !== "available"}
                    {reasonText(lang, pokemon.stats.reason)}
                  {/if}
                </td>
              {/each}
            </tr>
          {:else}
            <tr>
              <th scope="row">{t(lang, "stats")}</th>
              {#each columns as column (column.key)}
                {@const pokemon = available(column)}
                <td>
                  {#if !pokemon}
                    {@render blocked(column)}
                  {:else if pokemon.stats.status !== "available"}
                    {reasonText(lang, pokemon.stats.reason)}
                  {/if}
                </td>
              {/each}
            </tr>
          {/if}
        </tbody>

        <tbody>
          <tr>
            <th scope="row">{t(lang, "abilities")}</th>
            {#each columns as column (column.key)}
              {@const pokemon = available(column)}
              <td>
                {#if !pokemon}
                  {@render blocked(column)}
                {:else if pokemon.abilities.status === "available"}
                  <ul class="abilities">
                    {#each pokemon.abilities.value as ability (ability.slot)}
                      <li>
                        <a href={abilityHref(ability.id)}><Localized text={ability.name} /></a>
                        {#if ability.isHidden}<small>({pokemonText(lang, "abilities.hidden")})</small>{/if}
                      </li>
                    {/each}
                  </ul>
                {:else}
                  {reasonText(lang, pokemon.abilities.reason)}
                {/if}
              </td>
            {/each}
          </tr>
        </tbody>

        <tbody>
          {#each MATCHUP_ROWS as matchupRow (matchupRow)}
            <tr>
              <th scope="row">{typeText(lang, matchupRow)}</th>
              {#each columns as column, index (column.key)}
                {@const pokemon = available(column)}
                {@const groups = columnMatchups[index]}
                <td>
                  {#if !pokemon || column.state !== "ready"}
                    {@render blocked(column)}
                  {:else if pokemon.types.status !== "available"}
                    {reasonText(lang, pokemon.types.reason)}
                  {:else if !groups}
                    {t(lang, "matchupsUnavailable")}
                  {:else}
                    {@render matchupList(column.view, groups[matchupRow])}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>

        <tbody>
          {#each MEASURES as measure (measure)}
            <tr>
              <th scope="row">{t(lang, measure)} <small>({t(lang, "current")})</small></th>
              {#each columns as column (column.key)}
                {@const pokemon = available(column)}
                <td class="numeric">
                  {#if !pokemon}
                    {@render blocked(column)}
                  {:else if pokemon.physical.status === "available"}
                    {measure === "height"
                      ? metres.format(pokemon.physical.value.height / 10)
                      : kilograms.format(pokemon.physical.value.weight / 10)}
                  {:else}
                    {reasonText(lang, pokemon.physical.reason)}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="note compare-notes">
      {#if stats.total.highest.some(Boolean) || stats.rows.some((row) => row.highest.some(Boolean))}
        <p>{t(lang, "highestNote")}</p>
      {/if}
      {#if hasSpecial}
        <p>{pokemonText(lang, "stats.special")}</p>
      {/if}
      <p>{t(lang, "matchupScope", { generation: game.group.generationId })}</p>
      <p>{t(lang, "currentScope")}</p>
      {#if availabilityReason}
        <p>{reasonText(lang, availabilityReason)}</p>
      {/if}
      {#if unverifiedMechanics}
        <p>{pokemonText(lang, "context.mechanics")}</p>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .compare-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    margin-block: 1rem;
  }

  .compare-actions p {
    margin: 0;
  }

  .compare-actions button,
  .remove {
    min-height: 2.75rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 0.35rem;
    background: Canvas;
    color: CanvasText;
    font: inherit;
  }

  .compare-table {
    min-width: 100%;
  }

  .compare-table th[scope="row"] {
    white-space: nowrap;
  }

  .compare-table td {
    min-width: 11rem;
  }

  .pokemon-heading {
    vertical-align: bottom;
  }

  .pokemon-heading > * {
    display: block;
    margin-block-end: 0.25rem;
  }

  .pokemon-heading img {
    width: 6rem;
    height: 6rem;
    object-fit: contain;
  }

  .pokemon-heading a {
    font-size: 1.0625rem;
  }

  .pokemon-heading .status {
    max-width: 14rem;
    font-weight: normal;
    white-space: normal;
  }

  .species-name {
    font-weight: normal;
  }

  .remove {
    min-height: 2.25rem;
    margin-block-start: 0.5rem;
    font-size: 0.8125rem;
    font-weight: normal;
  }

  tbody + tbody > tr:first-child > * {
    border-block-start: 2px solid var(--border);
  }

  th[scope="rowgroup"] {
    padding-block-start: 0.75rem;
  }

  .stat {
    white-space: nowrap;
  }

  /* Fixed-width, right-aligned values keep every meter starting at the same x. */
  .value {
    display: inline-block;
    min-width: 3ch;
    margin-inline-end: 0.5rem;
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  .value.highest {
    font-weight: bold;
  }

  .stat :global([data-meter-root]) {
    width: 6rem;
  }

  .total > * {
    font-weight: bold;
  }

  .total .value:not(.highest) {
    font-weight: normal;
  }

  .types,
  .matchups {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem 0.5rem;
  }

  .matchups,
  .abilities {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .matchups li {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .abilities li + li {
    margin-block-start: 0.25rem;
  }

  .compare-notes {
    margin-block: 1rem;
  }

  .compare-notes p {
    margin-block: 0.25rem;
  }
</style>
