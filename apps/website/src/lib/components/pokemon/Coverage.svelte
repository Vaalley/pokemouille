<script lang="ts">
  import type { ResolvedPokemon } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t, versionName } from "#lib/i18n/pokemon.ts";

  let {
    lang,
    coverage,
    games,
  }: {
    lang: Language;
    coverage: ResolvedPokemon["coverage"];
    /** Localized names of the selected version group's games. */
    games: string;
  } = $props();

  const scopes = $derived([
    { key: "base", label: null, games, state: coverage.baseState },
    ...coverage.expansions.map((expansion) => {
      const names = expansion.versions.length
        ? expansion.versions.map((version) => versionName(lang, version)).join(" / ")
        : expansion.identifier;
      return {
        key: expansion.identifier,
        label: t(lang, "coverage.expansion", { games: names }),
        games: names,
        state: expansion.coverageState,
      };
    }),
  ]);
</script>

<section aria-labelledby="coverage-heading">
  <h2 id="coverage-heading">{t(lang, "coverage.heading")}</h2>
  <p class="note">{t(lang, "coverage.context")}</p>
  {#each scopes as scope (scope.key)}
    {#if scope.label}<h3>{scope.label}</h3>{/if}
    <ul>
      <li>
        {t(
          lang,
          scope.state.learnsets === "missing"
            ? "coverage.learnsets.missing"
            : "coverage.learnsets.present",
          { games: scope.games },
        )}
      </li>
      <li>
        {t(
          lang,
          scope.state.speciesFlavorTexts === "missing"
            ? "coverage.text.missing"
            : "coverage.text.present",
          { games: scope.games },
        )}
      </li>
    </ul>
  {/each}
</section>

<style>
  section { min-width: 0; }
  .note { max-width: 75ch; color: var(--muted); font-size: 0.875rem; line-height: 1.6; overflow-wrap: anywhere; }
  h3 { margin-block: 1.25rem 0.5rem; font-size: 1rem; overflow-wrap: anywhere; }
  ul { margin: 0.5rem 0 1rem; padding: 0; list-style: none; }
  li { min-width: 0; padding-block: 0.625rem; border-block-end: var(--border-width) solid var(--border); font-size: 0.875rem; line-height: 1.6; overflow-wrap: anywhere; }
</style>
