<script lang="ts">
  import { onMount } from "svelte";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import MatchupGroups from "#lib/components/MatchupGroups.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import { pokemonHref } from "#lib/data/context.ts";
  import { filterTypeMembers } from "#lib/data/type-membership.ts";
  import { getGames } from "#lib/data/loader.ts";
  import { defensiveMatchups, isIntroduced, offensiveMatchups } from "#lib/data/type-matchups.ts";
  import { readTypeSelection, typeSelectionUrl } from "#lib/data/type-selection.ts";
  import { typeCoverageHref } from "#lib/data/type-coverage.ts";
  import { t } from "#lib/i18n/types.ts";
  import { t as coverageText } from "#lib/i18n/type-coverage.ts";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let mounted = $state(false);
  let games = $state<GameOption[] | null>(null);
  let failed = $state(false);
  const selectedVersion = getSelectedVersion();
  const id = $props.id();
  const currentUrl = $derived(page.shallow?.url ?? page.url);
  const selection = $derived(readTypeSelection(mounted ? new URL(currentUrl.href).searchParams : new URLSearchParams()));
  const game = $derived(games?.find((entry) => entry.version.identifier === selectedVersion()));
  const generation = $derived(game?.group.generationId);
  const matchups = $derived(generation && !selection.invalid ? defensiveMatchups(selection.ids, generation) : null);
  const types = $derived(data.types.filter((type) => type.id >= 1 && type.id <= 18));
  const membership = $derived(game && !selection.invalid && selection.ids.length
    ? filterTypeMembers(data.typeMembers, selection.ids, game.group)
    : { rows: [], missingIntroduction: 0, missingTypes: 0 });
  const defensive = $derived([
    { label: t(data.lang, "weaknesses"), rows: matchups?.filter((row) => row.multiplier > 1) ?? [] },
    { label: t(data.lang, "resistances"), rows: matchups?.filter((row) => row.multiplier > 0 && row.multiplier < 1) ?? [] },
    { label: t(data.lang, "immunities"), rows: matchups?.filter((row) => row.multiplier === 0) ?? [] },
  ]);
  // Moves have one type, so attacks are listed per selected type rather than combined.
  const offensive = $derived(matchups && generation
    ? selection.ids.map((typeId) => {
        const rows = offensiveMatchups(typeId, generation) ?? [];
        return {
          typeId,
          groups: [
            { label: t(data.lang, "superEffective"), rows: rows.filter((row) => row.multiplier > 1) },
            { label: t(data.lang, "notVeryEffective"), rows: rows.filter((row) => row.multiplier > 0 && row.multiplier < 1) },
            { label: t(data.lang, "noEffect"), rows: rows.filter((row) => row.multiplier === 0) },
          ],
        };
      })
    : []);
  async function load() {
    failed = false;
    try {
      games = await getGames();
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
<p><a href={resolve(typeCoverageHref(data.lang, selection.invalid ? [] : selection.ids, selectedVersion()) as PathnameWithSearchOrHash)}>{coverageText(data.lang, "link")}</a></p>
<form class="selection-panel" onsubmit={(event) => event.preventDefault()} aria-label={t(data.lang, "heading")}>
  <fieldset>
    <legend>{t(data.lang, "selectionHeading")}</legend>
    <div class="filters">
  {#each [0, 1] as slot}
    <div class="filter-field">
      <label for="{id}-type-{slot}">{t(data.lang, slot === 0 ? "first" : "second")}</label>
      <select id="{id}-type-{slot}" name={slot === 0 ? "type" : "type2"}
        disabled={!mounted || !game || (slot === 1 && !selection.ids.length)}
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
    </div>
  </fieldset>
</form>

{#if !mounted}
  <p role="status">{t(data.lang, "loading")}</p>
  <noscript><p>{t(data.lang, "javascript")}</p></noscript>
{:else if failed}
  <p role="alert">{t(data.lang, "error")}</p>
  <button type="button" onclick={() => void load()}>{t(data.lang, "retry")}</button>
{:else if !game}
  <p role="status">{t(data.lang, "loading")}</p>
{:else if selection.invalid}
  <p role="status">{t(data.lang, "invalid")}</p>
{:else if !selection.ids.length}
  <p role="status">{t(data.lang, "empty")}</p>
{:else}
  {#if matchups}
    <section class="result-panel" aria-labelledby={`${id}-defensive`} aria-live="polite">
      <h2 id={`${id}-defensive`}>{t(data.lang, "defensive")}</h2>
      <p class="note">{t(data.lang, "scope", { generation: game.group.generationId })}</p>
      <MatchupGroups groups={defensive} {name} heading="h3" none={t(data.lang, "none")} />
    </section>
    <section class="result-panel" aria-labelledby={`${id}-offensive`} aria-live="polite">
      <h2 id={`${id}-offensive`}>{t(data.lang, "offensive")}</h2>
      <p class="note">{t(data.lang, "offensiveScope", { generation: game.group.generationId })}</p>
      {#each offensive as attack (attack.typeId)}
        <div class="attack-result">
          {#if offensive.length > 1}<h3>{t(data.lang, "attacking", { type: name(attack.typeId).text })}</h3>{/if}
          <MatchupGroups groups={attack.groups} {name} heading={offensive.length > 1 ? "h4" : "h3"} none={t(data.lang, "none")} />
        </div>
      {/each}
    </section>
  {:else}<p role="status">{t(data.lang, "unavailable")}</p>{/if}
  <section class="result-panel" aria-labelledby={`${id}-pokemon-heading`} aria-describedby={`${id}-pokemon-scope`}>
    <h2 id={`${id}-pokemon-heading`}>{t(data.lang, "pokemonHeading")}</h2>
    <p class="note" id={`${id}-pokemon-scope`}>{t(data.lang, "pokemonScope")}</p>
    <p class="result-count" role="status" aria-live="polite">{t(data.lang, "pokemonCount", { count: membership.rows.length })}</p>
    {#if membership.missingIntroduction}
      <p class="note">{t(data.lang, "introductionGap", { count: membership.missingIntroduction })}</p>
    {/if}
    {#if membership.missingTypes}
      <p class="note">{t(data.lang, "typeGap", { count: membership.missingTypes })}</p>
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
  .selection-panel { margin-block: 1.5rem; }
  fieldset { min-width: 0; margin: 0; padding: 1rem; border: var(--border-width) solid var(--border-strong); border-radius: var(--radius-panel); background: var(--surface); }
  legend { max-width: 100%; padding-inline: 0.4rem; font-family: var(--font-heading); font-weight: 700; overflow-wrap: anywhere; }
  .filters { margin: 0; }
  .filter-field { min-width: 0; }
  select, button { max-width: 100%; }
  .result-panel { min-width: 0; margin-block: 1.5rem; padding: clamp(0.75rem, 2vw, 1.25rem); border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
  .result-panel > h2 { margin-block: 0 0.75rem; font-size: 1.4rem; overflow-wrap: anywhere; }
  .result-panel > .note { margin-block: 0 1rem; }
  .attack-result + .attack-result { margin-block-start: 1.25rem; padding-block-start: 1rem; border-block-start: var(--border-width) solid var(--border); }
  .attack-result > h3 { margin-block: 0 0.75rem; font-size: 1.125rem; }
  ul { list-style: none; padding: 0; }
  .pokemon-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr)); gap: 0.25rem 1rem; }
  .pokemon-list li { min-width: 0; }
  .pokemon-list a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; padding: 0.25rem; border-radius: var(--radius-control); overflow-wrap: anywhere; }
  .pokemon-list a:hover { background: var(--accent-soft); }
  .pokemon-list a > span { min-width: 0; }
  @media (max-width: 30rem) {
    .filters button { width: 100%; }
  }
</style>
