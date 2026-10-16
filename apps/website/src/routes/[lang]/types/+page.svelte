<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption, ReferenceData } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import TypeBadge from "#lib/components/TypeBadge.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { pokemonHref } from "#lib/data/context.ts";
  import { filterTypeMembers } from "#lib/data/type-membership.ts";
  import { getGames, getReferences } from "#lib/data/loader.ts";
  import { defensiveMatchups, isIntroduced } from "#lib/data/type-matchups.ts";
  import { readTypeSelection, typeSelectionUrl } from "#lib/data/type-selection.ts";
  import { t } from "#lib/i18n/types.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let mounted = $state(false);
  let references = $state<ReferenceData | null>(null);
  let games = $state<GameOption[] | null>(null);
  let failed = $state(false);
  const selectedVersion = getSelectedVersion();
  const id = $props.id();
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  const selection = $derived(readTypeSelection(mounted ? new URL(currentUrl.href).searchParams : new URLSearchParams()));
  const game = $derived(games?.find((entry) => entry.version.identifier === selectedVersion()));
  const generation = $derived(game?.group.generationId);
  const matchups = $derived(generation && !selection.invalid ? defensiveMatchups(selection.ids, generation) : null);
  const types = $derived(references?.types.filter((type) => type.id >= 1 && type.id <= 18) ?? []);
  const membership = $derived(game && !selection.invalid && selection.ids.length
    ? filterTypeMembers(data.typeMembers, selection.ids, game.group)
    : { rows: [], missingIntroduction: 0, missingTypes: 0 });
  const groups = $derived([
    { label: t(data.lang, "weaknesses"), rows: matchups?.filter((row) => row.multiplier > 1) ?? [] },
    { label: t(data.lang, "resistances"), rows: matchups?.filter((row) => row.multiplier > 0 && row.multiplier < 1) ?? [] },
    { label: t(data.lang, "immunities"), rows: matchups?.filter((row) => row.multiplier === 0) ?? [] },
  ]);
  async function load() {
    failed = false;
    try {
      [references, games] = await Promise.all([getReferences(), getGames()]);
    } catch {
      failed = true;
    }
  }
  onMount(() => { mounted = true; void load(); });
  function name(typeId: number) {
    const type = types.find((entry) => entry.id === typeId);
    return localize(type?.names ?? [], data.lang, type?.identifier ?? String(typeId));
  }
  function update(ids: number[]) {
    const url = typeSelectionUrl(new URL(currentUrl.href), ids);
    const version = selectedVersion();
    if (version) url.searchParams.set("version", version);
    if (url.href !== currentUrl.href) pushState(url, page.state);
  }
  function change(slot: number, value: string) {
    const ids = [...selection.ids];
    if (!value) ids.splice(slot, 1);
    else ids[slot] = Number(value);
    update(ids.filter((entry) => entry !== undefined));
  }
</script>

<svelte:head><title>{t(data.lang, "heading")} | Pokémouille</title></svelte:head>
<h1>{t(data.lang, "heading")}</h1>
<p>{t(data.lang, "intro")}</p>
<form onsubmit={(event) => event.preventDefault()} aria-label={t(data.lang, "heading")}>
  {#each [0, 1] as slot}
    <div>
      <label for="{id}-type-{slot}">{t(data.lang, slot === 0 ? "first" : "second")}</label>
      <select id="{id}-type-{slot}" name={slot === 0 ? "type" : "type2"}
        disabled={!mounted || !references || (slot === 1 && !selection.ids.length)}
        value={selection.ids[slot] ?? ""} onchange={(event) => change(slot, event.currentTarget.value)}>
        <option value="">{t(data.lang, "choose")}</option>
        {#each types as type (type.id)}
          {@const localized = name(type.id)}
          <option value={type.id} disabled={!generation || !isIntroduced(type.id, generation) || selection.ids[1 - slot] === type.id} lang={localized.fallback && localized.sourceLanguageId === 9 ? "en" : undefined}>{localized.text}</option>
        {/each}
      </select>
    </div>
  {/each}
  <button type="button" disabled={!mounted || (!selection.ids.length && !selection.invalid)} onclick={() => update([])}>{t(data.lang, "reset")}</button>
</form>

{#if !mounted}
  <p role="status">{t(data.lang, "loading")}</p>
  <noscript><p>{t(data.lang, "javascript")}</p></noscript>
{:else if failed}
  <p role="alert">{t(data.lang, "error")}</p>
  <button type="button" onclick={() => void load()}>{t(data.lang, "retry")}</button>
{:else if !references || !game}
  <p role="status">{t(data.lang, "loading")}</p>
{:else if selection.invalid}
  <p role="status">{t(data.lang, "invalid")}</p>
{:else if !selection.ids.length}
  <p role="status">{t(data.lang, "empty")}</p>
{:else}
  <div class="selected-types">
    {#each selection.ids as typeId (typeId)}<TypeBadge {typeId} name={name(typeId)} />{/each}
  </div>
  {#if matchups}
    <div aria-live="polite">
      {#each groups as group}
        <section aria-label={group.label}>
          <h2>{group.label}</h2>
          {#if group.rows.length}
            <ul>{#each group.rows as row (row.typeId)}
              <li><TypeBadge typeId={row.typeId} name={name(row.typeId)} /><strong>×{row.multiplier}</strong></li>
            {/each}</ul>
          {:else}<p>{t(data.lang, "none")}</p>{/if}
        </section>
      {/each}
    </div>
    <p>{t(data.lang, "scope", { generation: game.group.generationId })}</p>
  {:else}<p role="status">{t(data.lang, "unavailable")}</p>{/if}
  <section aria-labelledby={`${id}-pokemon-heading`} aria-describedby={`${id}-pokemon-scope`}>
    <h2 id={`${id}-pokemon-heading`}>{t(data.lang, "pokemonHeading")}</h2>
    <p id={`${id}-pokemon-scope`}>{t(data.lang, "pokemonScope")}</p>
    <p role="status" aria-live="polite">{t(data.lang, "pokemonCount", { count: membership.rows.length })}</p>
    {#if membership.missingIntroduction}
      <p>{t(data.lang, "introductionGap", { count: membership.missingIntroduction })}</p>
    {/if}
    {#if membership.missingTypes}
      <p>{t(data.lang, "typeGap", { count: membership.missingTypes })}</p>
    {/if}
    {#if membership.rows.length}
      <ul class="pokemon-list">
        {#each membership.rows as pokemon (`${pokemon.pokemonId}:${pokemon.form ?? ""}`)}
          <li>
            <a href={resolve(pokemonHref(data.lang, pokemon.speciesId, {
              version: game.version.identifier, form: pokemon.form,
            }).slice(1) as PathnameWithSearchOrHash)}>
              <PokemonIcon speciesId={pokemon.speciesId} />
              <span><Localized text={pokemon.name} /></span>
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <p>{t(data.lang, "pokemonEmpty")}</p>
    {/if}
  </section>
{/if}

<style>
  form { display: flex; flex-wrap: wrap; align-items: end; gap: 1rem; margin-block: 1.5rem; }
  form > div { display: grid; gap: 0.35rem; }
  select, button { font: inherit; min-height: 2.75rem; padding: 0.5rem; }
  .selected-types, ul { display: flex; flex-wrap: wrap; gap: 0.75rem; }
  ul { list-style: none; padding: 0; }
  li { display: inline-flex; align-items: center; gap: 0.35rem; }
  .pokemon-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
  .pokemon-list li { min-width: 0; }
  .pokemon-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; overflow-wrap: anywhere; }
</style>
