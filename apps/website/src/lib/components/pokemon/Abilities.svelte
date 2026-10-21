<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { LinkPreview } from "bits-ui";
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
            <LinkPreview.Root openDelay={150} closeDelay={250}>
              <LinkPreview.Trigger>
                {#snippet child({ props })}
                  {@const { role: _role, ...linkProps } = props}
                  <a
                    {...linkProps}
                    class="ability-link"
                    href={resolve(
                      `${lang}/ability/${ability.id}/${versionQuery}` as PathnameWithSearchOrHash,
                    )}><AbilityIcon /><Localized text={ability.name} /></a
                  >
                {/snippet}
              </LinkPreview.Trigger>
              <LinkPreview.Portal>
                <LinkPreview.Content class="ability-preview" side="bottom" align="start" sideOffset={8} collisionPadding={12}>
                  <p class="ability-preview-scope">{t(lang, "abilities.gameText", { games })}</p>
                  <p>
                    {#if ability.flavorText.status === "available"}
                      <Localized text={ability.flavorText.value} />
                    {:else}
                      {reasonText(lang, ability.flavorText.reason)}
                    {/if}
                  </p>
                </LinkPreview.Content>
              </LinkPreview.Portal>
            </LinkPreview.Root>
            {#if ability.isHidden}<small>({t(lang, "abilities.hidden")})</small>{/if}
          </h3>
        </li>
      {/each}
    </ul>
  {:else}
    <p>{reasonText(lang, abilities.reason)}</p>
  {/if}
</section>

<style>
  .ability-list { margin: 0; padding: 0; list-style: none; }
  .ability-list > li + li { margin-block-start: 0.75rem; }
  h3 { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.5rem; margin: 0; font-size: 1.125rem; }
  .ability-link { display: inline-flex; align-items: center; gap: 0.375rem; }
  h3 small { font-weight: normal; }
  :global(.ability-preview) {
    z-index: 60;
    width: min(22rem, calc(100vw - 1.5rem));
    max-height: var(--bits-floating-available-height, calc(100dvh - 1.5rem));
    overflow-y: auto;
    padding: 1rem;
    border: var(--border-width) solid var(--border-strong);
    border-radius: var(--radius-panel);
    background: var(--surface);
    color: var(--page-text);
    box-shadow: var(--popover-shadow);
    font-size: 1rem;
    font-weight: normal;
  }
  :global(.ability-preview p) { margin: 0; white-space: pre-line; }
  :global(.ability-preview .ability-preview-scope) { margin-block-end: 0.5rem; font-size: 0.875rem; }
</style>
