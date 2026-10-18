<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import type { Language, PokemonReferences, ResolvedPokemon, SpeciesRecord, VersionGroup } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
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

<section aria-labelledby="breeding-heading">
  <h2 id="breeding-heading">{t(lang, "heading")}</h2>
  {#if pokemon.eggGroups.status === "available"}
    <ul class="inline-list">
      {#each pokemon.eggGroups.value.groups as eggGroup (eggGroup.id)}
        <li><a href={href(`/${lang}/egg-group/${eggGroup.id}/?${new URLSearchParams({ version })}`)}>{eggGroup.name.text}</a></li>
      {/each}
    </ul>
  {:else}<p>{t(lang, "missingGroups")}</p>{/if}
  <p class="note">{t(lang, "current")}</p>
  <p class="note">{t(lang, "formScope")}</p>
  <p><a href={href(`/${lang}/egg-group/?${new URLSearchParams({ version })}`)}>{t(lang, "groupsLink")}</a></p>
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
      <details bind:open>
        <summary>{t(lang, "open")}</summary>
        <p class="note">{t(lang, "scope")}</p>
        {#if failed}<p role="alert">{t(lang, "error")} <button type="button" onclick={() => attempt++}>{t(lang, "retry")}</button></p>
        {:else if !projection}<p role="status">{t(lang, "loading")}</p>
        {:else}
          {#each rows as row (row.id)}
            <section class="egg-move">
              <h3><a href={href(`/${lang}/move/${row.id}/?${new URLSearchParams({ version })}`)}>{row.name.text}</a></h3>
              {#if target && ordinaryBreeder(target)}
                <h4>{t(lang, "direct")}</h4>{@render candidates(row.candidates.direct)}
                <h4>{t(lang, "chain")}</h4>{@render candidates(row.candidates.chain)}
              {/if}
              {#if mechanic === "mirror-herb"}
                <h4>{t(lang, "transfer")}</h4>
                <p>{t(lang, "transferDirect")}</p>{@render candidates(row.candidates.transfer)}
                <p>{t(lang, "transferChain")}</p>{@render candidates(row.candidates.transferChain)}
              {/if}
              {#if row.candidates.missingChronology}<p class="note">{t(lang, "gap", { count: row.candidates.missingChronology })}</p>{/if}
            </section>
          {/each}
        {/if}
      </details>
    {/if}
  {/if}
</section>

<style>
  .candidate-list { display: flex; flex-wrap: wrap; gap: 0.35rem 1.5rem; padding-inline-start: 1.25rem; }
  .egg-move { border-block-start: 1px solid var(--border); margin-block-start: 1rem; padding-block-start: 0.5rem; }
  summary { cursor: pointer; }
</style>
