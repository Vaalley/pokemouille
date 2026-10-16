<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import AbilityIcon from "../AbilityIcon.svelte";
  import Localized from "./Localized.svelte";

  let {
    lang,
    abilities,
    games,
  }: {
    lang: Language;
    abilities: ResolvedPokemon["abilities"];
    /** Localized names of the selected version group's games. */
    games: string;
  } = $props();

  const versionQuery = $derived.by(() => {
    const version = page.url.searchParams.get("version");
    return version === null ? "" : `?${new URLSearchParams({ version })}`;
  });
</script>

<section aria-labelledby="abilities-heading">
  <h2 id="abilities-heading">{t(lang, "abilities.heading")}</h2>
  {#if abilities.status === "available"}
    <ul class="ability-list">
      {#each abilities.value as ability (ability.slot)}
        <li>
          <h3>
            <a
              class="ability-link"
              href={resolve(
                `${lang}/ability/${ability.id}/${versionQuery}` as PathnameWithSearchOrHash,
              )}><AbilityIcon /><Localized text={ability.name} /></a
            >
            {#if ability.isHidden}<small>({t(lang, "abilities.hidden")})</small>{/if}
          </h3>
          <dl class="definitions">
            <dt>{t(lang, "abilities.gameText", { games })}</dt>
            <dd>
              {#if ability.flavorText.status === "available"}
                <Localized text={ability.flavorText.value} />
              {:else}
                {reasonText(lang, ability.flavorText.reason)}
              {/if}
            </dd>
            <dt>
              {t(lang, "abilities.effect")}
              <small>({t(lang, "scope.current")})</small>
            </dt>
            <dd class="effect-text">
              {#if ability.currentEffect.status === "available"}
                <Localized text={ability.currentEffect.value} />
              {:else}
                {reasonText(lang, ability.currentEffect.reason)}
              {/if}
            </dd>
          </dl>
        </li>
      {/each}
    </ul>
  {:else}
    <p>{reasonText(lang, abilities.reason)}</p>
  {/if}
</section>

<style>
  .ability-list { margin: 0; padding: 0; list-style: none; }
  .ability-list > li + li { margin-block-start: 1.5rem; }
  h3 { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; margin-block: 0 0.5rem; font-size: 1.125rem; }
  .ability-link { display: inline-flex; align-items: center; gap: 0.375rem; }
  h3 small { font-weight: normal; }
  dt small { font-weight: normal; }
  .effect-text { white-space: pre-line; }
</style>
