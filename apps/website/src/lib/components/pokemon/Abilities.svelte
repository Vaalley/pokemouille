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
    <ul>
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
          <dl>
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
            <dd>
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
  .ability-link { display: inline-flex; align-items: center; gap: 0.375rem; }
</style>
