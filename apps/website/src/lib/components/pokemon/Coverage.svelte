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
  h3 { margin-block: 1rem 0.625rem; font-size: 1rem; }
  ul { display: grid; gap: 0.375rem; margin: 0.75rem 0; padding: 0; list-style: none; }
  li { min-width: 0; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); font-size: 0.875rem; line-height: 1.5; overflow-wrap: anywhere; }
</style>
