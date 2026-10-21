<script module lang="ts">
  const TYPES: Partial<Record<number, { icon: string; color: string }>> = {
    1: { icon: "normal", color: "#828282" },
    2: { icon: "fighting", color: "#b95c50" },
    3: { icon: "flying", color: "#8293c4" },
    4: { icon: "poison", color: "#a467ad" },
    5: { icon: "ground", color: "#b49155" },
    6: { icon: "rock", color: "#a59767" },
    7: { icon: "bug", color: "#8a9b42" },
    8: { icon: "ghost", color: "#7d73a6" },
    9: { icon: "steel", color: "#72969e" },
    10: { icon: "fire", color: "#d87b48" },
    11: { icon: "water", color: "#5b8dc6" },
    12: { icon: "grass", color: "#6d9e54" },
    13: { icon: "electric", color: "#b69c35" },
    14: { icon: "psychic", color: "#cf768e" },
    15: { icon: "ice", color: "#67aaa9" },
    16: { icon: "dragon", color: "#7773bd" },
    17: { icon: "dark", color: "#827166" },
    18: { icon: "fairy", color: "#c58cb2" },
  };
</script>

<script lang="ts">
  import { asset, resolve } from "$app/paths";
  import type { AssetPath, PathnameWithSearchOrHash } from "$app/types";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { page } from "$app/state";
  import { getSelectedVersion } from "#lib/components/GameSelector.svelte";
  import { typesHref } from "#lib/data/type-selection.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
  import Localized from "./pokemon/Localized.svelte";

  // Extra attributes (e.g. LinkPreview trigger props) land only on the link.
  let { typeId, name, defendingTypes, linked = true, ...rest }: Omit<HTMLAnchorAttributes, "href"> & {
    typeId: number;
    name: LocalizedText;
    defendingTypes?: readonly number[];
    linked?: boolean;
  } = $props();
  const type = $derived(TYPES[typeId]);
  const selectedVersion = getSelectedVersion();
  const lang = $derived(page.params.lang as Language);
  const href = $derived(linked
    ? resolve(typesHref(lang, defendingTypes ?? [typeId], selectedVersion()) as PathnameWithSearchOrHash)
    : undefined);

  // Icons: MIT © James Watkins; see static/type-icons/LICENSE.
  // https://github.com/partywhale/pokemon-type-icons/tree/fcbe6978c61c359680bc07636c3f9bdc0f346b43
</script>

{#snippet label()}
  {#if type}
    <img src={asset(`/type-icons/${type.icon}.svg` as AssetPath)} alt="" width="18" height="18" />
  {/if}
  <span class="type-name"><Localized text={name} /></span>
{/snippet}

{#if linked}
  <a {...rest} class="type-badge" data-type={typeId} style:--type-color={type?.color ?? "var(--muted)"} {href}>
    {@render label()}
  </a>
{:else}
  <span class="type-badge" data-type={typeId} style:--type-color={type?.color ?? "var(--muted)"}>
    {@render label()}
  </span>
{/if}

<style>
  .type-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border: var(--border-width) solid color-mix(in srgb, var(--type-color) 38%, var(--border));
    border-radius: var(--radius-pill);
    background: light-dark(
      color-mix(in srgb, var(--type-color) 10%, var(--surface)),
      color-mix(in srgb, var(--type-color) 18%, var(--surface))
    );
    color: var(--page-text);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.4;
    vertical-align: middle;
  }

  a.type-badge:any-link,
  a.type-badge:visited {
    color: var(--page-text);
    text-decoration: none;
  }

  a.type-badge:any-link:hover {
    border-color: color-mix(in srgb, var(--type-color) 70%, var(--border));
    background: light-dark(
      color-mix(in srgb, var(--type-color) 17%, var(--surface)),
      color-mix(in srgb, var(--type-color) 26%, var(--surface))
    );
  }

  a.type-badge:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  img {
    flex: 0 0 18px;
    width: 18px;
    height: 18px;
  }

  .type-name {
    min-width: 0;
  }

  @media (forced-colors: active) {
    .type-badge {
      background: Canvas;
      border-color: CanvasText;
      color: CanvasText;
    }

    a.type-badge:any-link,
    a.type-badge:visited {
      color: LinkText;
      border-color: LinkText;
    }

    a.type-badge:any-link:hover {
      background: Canvas;
      border-color: Highlight;
    }

    a.type-badge:focus-visible {
      outline-color: Highlight;
    }
  }
</style>
