<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { Language, PokemonReferences, ResolvedPokemon, SpeciesRecord, VersionGroup } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import { scrollable } from "#lib/actions/scrollable.ts";
  import { breedingMechanic, ordinaryBreeder, parentCandidates, type BreedingMember, type BreedingProjection } from "#lib/data/breeding.ts";
  import { pokemonHref } from "#lib/data/context.ts";
  import { t } from "#lib/i18n/breeding.ts";

  let { lang, record, pokemon, references, group, version }: { lang: Language; record: SpeciesRecord; pokemon: ResolvedPokemon; references: PokemonReferences; group: VersionGroup; version: string } = $props();
  let open = $state(false);
  let projection = $state.raw<BreedingProjection | null>(null);
  let failed = $state(false);
  let attempt = $state(0);
  const mechanic = $derived(breedingMechanic(group));
  const eggMethod = $derived(references.learnMethods.find((method) => method.identifier === "egg")?.id);
  const moves = $derived([...new Set(record.varieties.find((variety) => variety.id === pokemon.pokemonId)?.learnsets.filter((row) => row.versionGroupId === group.id && row.learnMethodId === eggMethod).map((row) => row.moveId) ?? [])]);
  const target = $derived(projection?.members.find((member) => member.pokemonId === pokemon.pokemonId));
  const rows = $derived.by(() => {
    const currentProjection = projection;
    const currentTarget = target;
    if (!currentTarget || !currentProjection) return [];
    return moves.map((id) => ({ id, name: localize(references.moves.find((move) => move.id === id)?.names ?? [], lang, references.moves.find((move) => move.id === id)?.identifier ?? String(id)), candidates: parentCandidates(currentProjection, currentTarget, id, group) }));
  });
  function href(path: string) { return resolve(path.slice(1) as PathnameWithSearchOrHash); }
  $effect(() => {
    const speciesId = record.id;
    void attempt;
    projection = null;
    failed = false;
    if (!open || mechanic === "none" || !moves.length || pokemon.status !== "available") return;
    const revision = import.meta.env.DATASET_REVISION;
    if (!revision) {
      failed = true;
      return;
    }
    let active = true;
    const controller = new AbortController();
    fetch(resolve("/breeding/[revision]/[id].json", { revision, id: String(speciesId) }), { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Missing breeding projection");
      const loaded = await response.json() as BreedingProjection;
      if (loaded.speciesId !== speciesId || !Array.isArray(loaded.members) || !Array.isArray(loaded.moves)) throw new Error("Invalid breeding projection");
      if (active) projection = loaded;
    }).catch(() => { if (active) failed = true; });
    return () => { active = false; controller.abort(); };
  });
</script>

{#snippet candidates(members: BreedingMember[])}
  {#if members.length}
    <ul class="candidate-list">
      {#each members as member (member.pokemonId)}
        <li><a href={href(pokemonHref(lang, member.speciesId, { version, form: member.form }))}>{member.names[lang].text}</a></li>
      {/each}
    </ul>
  {:else}<p class="note">{t(lang, "empty")}</p>{/if}
{/snippet}

<section class="breeding" aria-labelledby="breeding-heading">
  <h2 id="breeding-heading">{t(lang, "heading")}</h2>
  <div class="membership">
    <h3>{t(lang, "membership")}</h3>
    {#if pokemon.eggGroups.status === "available"}
      <ul class="group-list">
        {#each pokemon.eggGroups.value.groups as eggGroup (eggGroup.id)}
          <li><a href={href(`/${lang}/egg-group/${eggGroup.id}/?${new URLSearchParams({ version })}`)}>{eggGroup.name.text}</a></li>
        {/each}
      </ul>
    {:else}<p>{t(lang, "missingGroups")}</p>{/if}
    <a class="directory-link" href={href(`/${lang}/egg-group/?${new URLSearchParams({ version })}`)}>{t(lang, "groupsLink")}</a>
  </div>
  <aside class="source-notes" aria-label={t(lang, "sourceNotes")}>
    <p class="note">{t(lang, "current")}</p>
    <p class="note">{t(lang, "formScope")}</p>
  </aside>
  {#if mechanic === "none"}<p>{t(lang, "none")}</p>
  {:else if pokemon.status !== "available"}<p>{t(lang, "selectedUnknown")}</p>
  {:else}
    <p class="note">{t(lang, group.generationId < 6 ? "rulesOld" : "rulesNew")}</p>
    {#if record.isBaby}<p>{t(lang, "baby")}</p>
    {:else if !record.eggGroupIds.length}<p>{t(lang, "missingGroups")}</p>
    {:else if !ordinaryBreeder({ genderRate: record.genderRate, eggGroupIds: record.eggGroupIds, isBaby: record.isBaby })}<p>{t(lang, "blocked")}</p>{/if}
    {#if mechanic === "mirror-herb"}<p class="note">{t(lang, "mirror")}</p>{/if}
    {#if !moves.length}<p>{t(lang, "noMoves")}</p>
    {:else}
      <details class="candidate-panel" bind:open>
        <summary>{t(lang, "open")} <span class="count">{moves.length}</span></summary>
        <p class="note candidate-scope">{t(lang, "scope")}</p>
        {#if failed}<p role="alert">{t(lang, "error")} <button type="button" onclick={() => attempt++}>{t(lang, "retry")}</button></p>
        {:else if !projection}<p role="status">{t(lang, "loading")}</p>
        {:else}
          <div class="breeding-rows" role="region" aria-label={t(lang, "open")} use:scrollable>
          {#each rows as row (row.id)}
            <section class="egg-move" aria-labelledby={`egg-move-${row.id}`}>
              <h3 id={`egg-move-${row.id}`}><a href={href(`/${lang}/move/${row.id}/?${new URLSearchParams({ version })}`)}>{row.name.text}</a></h3>
              {#if target && ordinaryBreeder(target)}
                <section class="candidate-method" aria-labelledby={`parent-candidates-${row.id}`}>
                  <h4 id={`parent-candidates-${row.id}`}>{t(lang, "candidates")}</h4>
                  <div class="candidate-categories">
                    <div class="candidate-category">
                      <h5>{t(lang, "direct")} <span class="count">{row.candidates.direct.length}</span></h5>
                      {@render candidates(row.candidates.direct)}
                    </div>
                    <div class="candidate-category chain">
                      <h5>{t(lang, "chain")} <span class="count">{row.candidates.chain.length}</span></h5>
                      {@render candidates(row.candidates.chain)}
                    </div>
                  </div>
                </section>
              {/if}
              {#if mechanic === "mirror-herb"}
                <section class="candidate-method transfer" aria-labelledby={`transfer-candidates-${row.id}`}>
                  <h4 id={`transfer-candidates-${row.id}`}>{t(lang, "transfer")}</h4>
                  <div class="candidate-categories">
                    <div class="candidate-category">
                      <h5>{t(lang, "transferDirect")} <span class="count">{row.candidates.transfer.length}</span></h5>
                      {@render candidates(row.candidates.transfer)}
                    </div>
                    <div class="candidate-category chain">
                      <h5>{t(lang, "transferChain")} <span class="count">{row.candidates.transferChain.length}</span></h5>
                      {@render candidates(row.candidates.transferChain)}
                    </div>
                  </div>
                </section>
              {/if}
              {#if row.candidates.missingChronology}<p class="note">{t(lang, "gap", { count: row.candidates.missingChronology })}</p>{/if}
            </section>
          {/each}
          </div>
        {/if}
      </details>
    {/if}
  {/if}
</section>

<style>
  .breeding, .breeding :is(section, div, ul, li) { min-width: 0; }
  .breeding { overflow-wrap: anywhere; }
  .membership { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 1rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .membership h3 { margin: 0; font-size: var(--data-label-size); font-weight: 600; }
  .group-list { display: flex; flex-wrap: wrap; gap: 0.375rem; margin: 0; padding: 0; list-style: none; }
  .group-list a { display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0.375rem 0.625rem; border: var(--border-width) solid var(--border); border-radius: var(--radius-control); background: var(--surface); font-weight: 600; }
  .directory-link { display: inline-flex; align-items: center; min-height: 2.75rem; padding-block: 0.375rem; font-size: 0.875rem; }
  .source-notes { margin-block: 0.75rem; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--border-strong); background: var(--surface-muted); }
  .source-notes p { margin-block: 0.375rem; }
  .candidate-panel { border: var(--border-width) solid var(--border); border-radius: var(--radius-panel); background: var(--surface); }
  summary { min-height: 2.75rem; padding: 0.625rem 0.75rem; cursor: pointer; font-weight: 600; overflow-wrap: anywhere; }
  .candidate-panel[open] > summary { border-inline-start: var(--data-rule) solid var(--accent); background: var(--surface-muted); }
  .count { display: inline-block; padding-inline: 0.4rem; border-radius: var(--radius-control); background: var(--surface-muted); color: var(--page-text); font-size: 0.8125rem; font-weight: 600; font-variant-numeric: tabular-nums; vertical-align: baseline; }
  .candidate-scope { margin: 0.5rem 0.75rem 0.75rem; }
  .breeding-rows { max-height: min(40rem, 72dvh); overflow: auto; overscroll-behavior: contain; padding: 0.75rem; border-block-start: var(--border-width) solid var(--border); }
  .candidate-list { display: flex; flex-wrap: wrap; gap: 0.125rem 0.75rem; margin: 0; padding: 0; list-style: none; }
  .candidate-list a { display: inline-flex; align-items: center; min-height: 2.75rem; padding-block: 0.375rem; font-weight: 600; }
  .egg-move + .egg-move { border-block-start: var(--border-width) solid var(--border-strong); margin-block-start: 1rem; padding-block-start: 1rem; }
  .egg-move h3 { margin: 0 0 0.625rem; font-size: 1.125rem; }
  .candidate-method + .candidate-method { margin-block-start: 0.875rem; padding-block-start: 0.75rem; border-block-start: var(--border-width) solid var(--border); }
  h4 { margin: 0 0 0.5rem; font-size: var(--data-label-size); font-weight: 600; }
  .candidate-categories { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
  .candidate-category { border-inline-start: var(--data-rule) solid var(--border-strong); padding: var(--data-padding); background: var(--surface-muted); }
  .candidate-category:has(.candidate-list) { border-inline-start-color: var(--accent); }
  h5 { margin: 0 0 0.25rem; font: 600 var(--data-label-size)/1.5 var(--font-body); }
  .candidate-category p { margin: 0; font-size: 0.875rem; }
  :is(a, summary, button, .breeding-rows):focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 3px; border-radius: var(--radius-control); }
  @media (max-width: 40rem) {
    .candidate-categories { grid-template-columns: minmax(0, 1fr); }
    .breeding-rows { padding: 0.625rem; }
  }
</style>
