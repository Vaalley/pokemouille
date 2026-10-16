<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import PokemonIcon from "#lib/components/PokemonIcon.svelte";
  import Localized from "#lib/components/pokemon/Localized.svelte";
  import type { RelatedPokemon, RelatedPokemonData } from "#lib/data/catalogue.ts";
  import { pokemonHref } from "#lib/data/context.ts";
  import { getGames } from "#lib/data/loader.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { localizeVersion } from "#lib/i18n/pokemon.ts";
  import { t } from "#lib/i18n/related.ts";

  let { lang, kind, data }: {
    lang: Language;
    kind: "move" | "ability";
    data: RelatedPokemonData;
  } = $props();

  const id = $props.id();
  const selectedVersion = getSelectedVersion();
  let games = $state<GameOption[] | null>(null);
  let failed = $state(false);

  // Neither server rendering nor hydration guesses Scarlet before the header has
  // resolved the URL and saved preference. The loader shares the header's cache.
  onMount(() => {
    getGames().then(
      (loaded) => { games = loaded; },
      () => { failed = true; },
    );
  });

  const version = $derived(selectedVersion());
  const game = $derived(games?.find((entry) => entry.version.identifier === version) ?? null);
  const gameName = $derived(game ? localizeVersion(lang, game.version) : null);
  const introductionOrder = $derived.by(() => {
    const order = new Map<number, number>();
    for (const entry of games ?? []) {
      order.set(entry.group.id, entry.group.order);
      for (const expansion of entry.expansions) {
        if (expansion.group) order.set(expansion.group.id, expansion.group.order);
      }
    }
    return order;
  });
  const methods = $derived(new Map(data.learnMethods.map((method) => [method.id, method.name])));

  interface Match {
    pokemon: RelatedPokemon;
    learnsets: RelatedPokemon["learnsets"];
    ordinary: boolean;
    hidden: boolean;
  }

  const matches = $derived.by(() => {
    const rows: Match[] = [];
    let missingIntroduction = 0;
    if (!game || (kind === "ability" && game.group.generationId < 3)) {
      return { rows, missingIntroduction };
    }
    for (const pokemon of data.pokemon) {
      if (pokemon.generationId > game.group.generationId) continue;
      const ordinary = pokemon.abilityGenerations.includes(game.group.generationId);
      const hidden = game.group.generationId >= 5 &&
        pokemon.hiddenAbilityGenerations.includes(game.group.generationId);
      const learnsets = kind === "move"
        ? pokemon.learnsets.filter((row) => row.versionGroupId === game.group.id)
        : [];
      if (kind === "move" ? learnsets.length === 0 : !ordinary && !hidden) continue;

      const introduced = pokemon.introducedVersionGroupId === null
        ? undefined
        : introductionOrder.get(pokemon.introducedVersionGroupId);
      if (introduced === undefined) {
        missingIntroduction += 1;
        continue;
      }
      // IDs are identifiers, not release chronology (Japanese Red/Green is ID 28).
      if (introduced > game.group.order) continue;

      const seen = new Set<string>();
      const uniqueLearnsets = learnsets.filter((row) => {
        const key = `${row.learnMethodId}:${row.level}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => a.learnMethodId - b.learnMethodId || a.level - b.level);
      rows.push({ pokemon, learnsets: uniqueLearnsets, ordinary, hidden });
    }
    rows.sort((a, b) => a.pokemon.speciesId - b.pokemon.speciesId ||
      a.pokemon.pokemonId - b.pokemon.pokemonId);
    return { rows, missingIntroduction };
  });

  function href(pokemon: RelatedPokemon, selected: string) {
    return resolve(pokemonHref(lang, pokemon.speciesId, {
      version: selected,
      form: pokemon.form,
    }).slice(1) as PathnameWithSearchOrHash);
  }
</script>

<section class="related" aria-labelledby={`${id}-heading`} aria-describedby={`${id}-scope`}>
  <h2 id={`${id}-heading`}>{t(lang, kind === "move" ? "move.heading" : "ability.heading")}</h2>
  <p class="note" id={`${id}-scope`}>{t(lang, kind === "move" ? "move.scope" : "ability.scope")}</p>

  <div role="status" aria-live="polite" aria-atomic="true">
    {#if failed || (games && version && !game)}
      <p>{t(lang, "error")}</p>
    {:else if !game || !gameName}
      <p>{t(lang, "loading")}</p>
    {:else}
      <p class="result-count">
        {t(lang, "count", { count: matches.rows.length })}
        <span aria-hidden="true">·</span>
        {t(lang, "game")} <strong><Localized text={gameName} /></strong>
      </p>
    {/if}
  </div>

  {#if !failed && game && version}
    {#if kind === "ability" && game.group.generationId < 3}
      <p>{t(lang, "beforeAbilities")}</p>
    {:else if data.pokemon.length === 0}
      <p>{t(lang, "noSource")}</p>
    {:else if matches.rows.length === 0}
      <p>{t(lang, kind === "move" ? "move.empty" : "ability.empty")}</p>
    {/if}
    {#if matches.missingIntroduction > 0}
      <p class="source-gap">{t(lang, "sourceGap", { count: matches.missingIntroduction })}</p>
    {/if}
    {#if matches.rows.length > 0}
      <ul class="pokemon-list">
        {#each matches.rows as match (match.pokemon.pokemonId)}
          <li class="pokemon-card">
            <h3>
              <a href={href(match.pokemon, version)}>
                <PokemonIcon speciesId={match.pokemon.speciesId} />
                <span><Localized text={match.pokemon.name} /></span>
              </a>
            </h3>
            <p class="detail">
              {t(lang, "number", { id: match.pokemon.speciesId })}
              {#if match.pokemon.form}
                <br />{t(lang, "form")} <code>{match.pokemon.form}</code>
              {/if}
            </p>
            {#if kind === "move"}
              <ul class="methods">
                {#each match.learnsets as learnset (`${learnset.learnMethodId}:${learnset.level}`)}
                  {@const method = methods.get(learnset.learnMethodId)}
                  <li>
                    {#if method}
                      <Localized text={method} />
                    {:else if learnset.learnMethodId === 1}
                      {t(lang, "levelUp")}
                    {:else}
                      {t(lang, "missingMethod", { id: learnset.learnMethodId })}
                    {/if}
                    {#if learnset.learnMethodId === 1 || learnset.level > 0}
                      ({t(lang, "level", { level: learnset.level })})
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else}
              <ul class="assignments">
                {#if match.ordinary}<li>{t(lang, "ordinary")}</li>{/if}
                {#if match.hidden}<li>{t(lang, "hidden")}</li>{/if}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style>
  .pokemon-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
    gap: 0.5rem;
    padding: 0;
    list-style: none;
  }
  .pokemon-card {
    min-width: 0;
    padding: 0.25rem 0.75rem 0.625rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    overflow-wrap: anywhere;
  }
  h3 { margin: 0; font-size: 1rem; }
  h3 a { display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem; }
  h3 a > span { min-width: 0; }
  /* Details line up under the name, past the 40px icon and its gap. */
  .detail, .methods, .assignments { margin: 0; padding-inline-start: 3rem; font-size: 0.875rem; }
  .detail code { white-space: normal; }
  .methods, .assignments { display: flex; flex-wrap: wrap; gap: 0 0.75rem; margin-block-start: 0.25rem; list-style: none; }
  .source-gap { border-inline-start: 0.2rem solid currentColor; padding-inline-start: 0.75rem; }
</style>
