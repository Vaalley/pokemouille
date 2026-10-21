<script lang="ts">
  import { Tabs } from "bits-ui";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type {
    LocalizedText,
    ResolvedPokemon,
    ReferenceData,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";
  import MoveIcon from "../MoveIcon.svelte";
  import DamageClassIcon from "../DamageClassIcon.svelte";

  type Move = Extract<ResolvedPokemon["learnset"], { status: "available" }>["value"][number];

  let {
    lang,
    learnset,
    games,
    referenceMoves,
  }: {
    lang: Language;
    learnset: ResolvedPokemon["learnset"];
    /** Localized names of the selected version group's games. */
    games: string;
    referenceMoves: ReadonlyArray<Pick<ReferenceData["moves"][number],
      "id" | "typeId" | "damageClassId" | "power" | "accuracy" | "pp" | "priority">>;
  } = $props();

  const moveMetadata = $derived(new Map(referenceMoves.map((move) => [move.id, move])));

  function categoryName(category: number | undefined) {
    return category === 1 ? t(lang, "moves.status") :
      category === 2 ? t(lang, "moves.physical") :
      category === 3 ? t(lang, "moves.special") : t(lang, "value.notRecorded");
  }

  // Learn method 1 is "level-up": the only method whose rows are ordered by level.
  const LEVEL_UP = 1;

  const groups = $derived.by(() => {
    if (learnset.status !== "available") return [];
    const byMethod: Record<number, { method: LocalizedText; moves: Move[] }> = {};
    for (const move of learnset.value) {
      byMethod[move.methodId] ??= { method: move.method, moves: [] };
      byMethod[move.methodId]!.moves.push(move);
    }
    const collator = new Intl.Collator(lang);
    return Object.entries(byMethod)
      .map(([methodId, group]) => {
        const levelUp = Number(methodId) === LEVEL_UP;
        return {
          methodId: Number(methodId),
          method: group.method,
          levelUp,
          hasMastery: group.moves.some((move) => move.mastery !== null),
          hasPriority: group.moves.some((move) => (moveMetadata.get(move.moveId)?.priority ?? 0) !== 0),
          moves: group.moves.toSorted((a, b) =>
            levelUp
              ? a.level - b.level ||
                (a.order ?? 0) - (b.order ?? 0) ||
                collator.compare(a.name.text, b.name.text)
              : collator.compare(a.name.text, b.name.text),
          ),
        };
      })
      .sort((a, b) => Number(b.levelUp) - Number(a.levelUp) || a.methodId - b.methodId);
  });

  const defaultTab = $derived(groups[0] ? String(groups[0].methodId) : "");
  let selectedTab = $state<string>("");
  const activeTab = $derived(
    groups.some((g) => String(g.methodId) === selectedTab) ? selectedTab : defaultTab,
  );
</script>

<section aria-labelledby="moves-heading">
  <h2 id="moves-heading">{t(lang, "moves.heading")}</h2>
  {#if learnset.status === "available"}
    <p class="note">{t(lang, "moves.context", { games })}</p>
    <p class="note">{t(lang, "moves.currentValues")}</p>
    {#if groups.length > 0}
      <div class="learnset-tabs">
      <Tabs.Root value={activeTab} onValueChange={(v) => (selectedTab = v)}>
        <Tabs.List>
          {#each groups as group (group.methodId)}
            <Tabs.Trigger class="method-tab" value={String(group.methodId)}>
              <span class="method-name"><Localized text={group.method} /></span>
              <span class="method-count">
                <span aria-hidden="true">{group.moves.length}</span>
                <span class="visually-hidden">{t(lang, "moves.rowCount", { count: group.moves.length })}</span>
              </span>
            </Tabs.Trigger>
          {/each}
        </Tabs.List>
        {#each groups as group (group.methodId)}
          <Tabs.Content value={String(group.methodId)}>
            <p class="visually-hidden" id={`moves-guide-${group.methodId}`}>
              <strong>{t(lang, "moves.allRows", { count: group.moves.length })}</strong>
              <span>{t(lang, "moves.scrollHint")}</span>
            </p>
            <div class="table-scroll" role="region" aria-label={t(lang, "moves.table", { method: group.method.text })} aria-describedby={`moves-guide-${group.methodId}`} tabindex="0">
            <table>
              <caption class="visually-hidden"><Localized text={group.method} /></caption>
              <thead>
                <tr>
                  {#if group.levelUp}<th scope="col" class="numeric">{t(lang, "moves.level")}</th>{/if}
                  <th scope="col">{t(lang, "moves.move")}</th>
                  <th scope="col">{t(lang, "moves.category")}</th>
                  <th scope="col" class="numeric">{t(lang, "moves.power")}</th>
                  <th scope="col" class="numeric">{t(lang, "moves.accuracy")}</th>
                  <th scope="col" class="numeric">{t(lang, "moves.pp")}</th>
                  {#if group.hasPriority}<th scope="col" class="numeric">{t(lang, "moves.priority")}</th>{/if}
                  {#if group.hasMastery}<th scope="col" class="numeric">{t(lang, "moves.mastery")}</th>{/if}
                </tr>
              </thead>
              <tbody>
                {#each group.moves as move, index (index)}
                  {@const metadata = moveMetadata.get(move.moveId)}
                  <tr>
                    {#if group.levelUp}<td class="numeric">{move.level}</td>{/if}
                    <th scope="row">
                      <a
                        href={`${resolve(`${lang}/move/${move.moveId}/`)}${page.url.searchParams.has("version") ? `?version=${encodeURIComponent(page.url.searchParams.get("version")!)}` : ""}`}
                      ><MoveIcon typeId={metadata?.typeId} /><Localized text={move.name} /></a>
                    </th>
                    <td>
                      <span class="damage-class" title={categoryName(metadata?.damageClassId)}>
                        <DamageClassIcon damageClassId={metadata?.damageClassId} />
                        <span class="visually-hidden">{categoryName(metadata?.damageClassId)}</span>
                        {#if !metadata || ![1, 2, 3].includes(metadata.damageClassId)}—{/if}
                      </span>
                    </td>
                    <td class="numeric">{metadata?.power ? metadata.power : "—"}</td>
                    <td class="numeric">{metadata?.accuracy == null ? "—" : `${metadata.accuracy}%`}</td>
                    <td class="numeric">{metadata?.pp ?? "—"}</td>
                    {#if group.hasPriority}<td class="numeric">{metadata?.priority == null ? "—" : metadata.priority > 0 ? `+${metadata.priority}` : metadata.priority}</td>{/if}
                    {#if group.hasMastery}<td class="numeric">{move.mastery ?? ""}</td>{/if}
                  </tr>
                {/each}
              </tbody>
            </table>
            </div>
          </Tabs.Content>
        {/each}
      </Tabs.Root>
      </div>
    {:else}
      <p>{t(lang, "moves.empty")}</p>
    {/if}
  {:else}
    <p>{reasonText(lang, learnset.reason)}</p>
  {/if}
</section>

<style>
  section, .learnset-tabs { min-width: 0; }
  .learnset-tabs :global(.method-tab) {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 100%;
    padding: 0.5rem 0.75rem;
    border: var(--border-width) solid var(--border-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--page-text);
    text-align: start;
  }
  .learnset-tabs :global(.method-tab[data-state="active"]) {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
    text-decoration: none;
  }
  .method-name { min-width: 0; overflow-wrap: anywhere; }
  .method-count {
    flex: 0 0 auto;
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-control);
    background: var(--surface-muted);
    color: var(--page-text);
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
  }
  .table-scroll {
    max-width: 100%;
    max-height: min(30rem, 65dvh);
    overflow: auto;
    scrollbar-gutter: stable;
    border: var(--border-width) solid var(--border);
    border-radius: var(--radius-control);
    background: var(--surface);
  }
  .table-scroll:focus-visible {
    outline: var(--border-width) solid var(--focus-ring);
    outline-offset: 3px;
  }
  table { width: 100%; border-collapse: separate; border-spacing: 0; }
  th, td { padding: 0.5rem 0.75rem; vertical-align: middle; }
  thead th {
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    background: var(--surface-muted);
    color: var(--page-text);
  }
  th[scope="row"] { min-width: 10rem; font-weight: normal; }
  th a { display: inline-flex; align-items: center; gap: 0.375rem; }
  .numeric { white-space: nowrap; }
  .damage-class { display: inline-flex; align-items: center; }
</style>
