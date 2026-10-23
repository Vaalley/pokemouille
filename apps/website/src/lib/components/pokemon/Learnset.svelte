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
    <div class="learnset-context">
      <p class="game-context">{t(lang, "moves.context", { games })}</p>
      <details class="value-provenance">
        <summary>{t(lang, "scope.current")}</summary>
        <p>{t(lang, "moves.currentValues")}</p>
      </details>
    </div>
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
            <div class="method-heading">
              <h3><Localized text={group.method} /></h3>
              <span class="row-count">{t(lang, "moves.allRows", { count: group.moves.length })}</span>
            </div>
            <p class="scroll-hint" id={`moves-guide-${group.methodId}`}>
              {t(lang, "moves.scrollHint")}
            </p>
            <div class="table-scroll" role="region" aria-label={t(lang, "moves.table", { method: group.method.text })} aria-describedby={`moves-guide-${group.methodId}`} tabindex="0">
            <table>
              <caption class="visually-hidden"><Localized text={group.method} /></caption>
              <thead>
                <tr>
                  <th scope="col" class="move-identity">{t(lang, "moves.move")}</th>
                  {#if group.levelUp}<th scope="col" class="numeric level">{t(lang, "moves.level")}</th>{/if}
                  <th scope="col" class="category">{t(lang, "moves.category")}</th>
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
                    <th scope="row" class="move-identity">
                      <a
                        href={`${resolve(`${lang}/move/${move.moveId}/`)}${page.url.searchParams.has("version") ? `?version=${encodeURIComponent(page.url.searchParams.get("version")!)}` : ""}`}
                      ><MoveIcon typeId={metadata?.typeId} /><Localized text={move.name} /></a>
                    </th>
                    {#if group.levelUp}<td class="numeric level"><span class="level-value">{move.level}</span></td>{/if}
                    <td class="category">
                      <span class="damage-class" title={categoryName(metadata?.damageClassId)}>
                        <DamageClassIcon damageClassId={metadata?.damageClassId} />
                        <span class="visually-hidden">{categoryName(metadata?.damageClassId)}</span>
                        {#if !metadata || ![1, 2, 3].includes(metadata.damageClassId)}—{/if}
                      </span>
                    </td>
                    <td class="numeric" class:missing={!metadata?.power}>{metadata?.power ? metadata.power : "—"}</td>
                    <td class="numeric" class:missing={metadata?.accuracy == null}>{metadata?.accuracy == null ? "—" : `${metadata.accuracy}%`}</td>
                    <td class="numeric" class:missing={metadata?.pp == null}>{metadata?.pp ?? "—"}</td>
                    {#if group.hasPriority}<td class="numeric" class:missing={metadata?.priority == null}>{metadata?.priority == null ? "—" : metadata.priority > 0 ? `+${metadata.priority}` : metadata.priority}</td>{/if}
                    {#if group.hasMastery}<td class="numeric" class:missing={move.mastery == null}>{move.mastery ?? "—"}</td>{/if}
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
  section, .learnset-tabs { position: relative; min-width: 0; }
  .learnset-context {
    margin-block-end: 1rem;
    padding-inline-start: 0.75rem;
    border-inline-start: var(--border-width) solid var(--accent);
  }
  .game-context { margin-block: 0 0.25rem; font-weight: 700; overflow-wrap: anywhere; }
  .value-provenance { color: var(--muted); font-size: 0.875rem; }
  .value-provenance summary {
    width: fit-content;
    max-width: 100%;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .value-provenance p { max-width: var(--measure); margin-block: 0.5rem 0; }
  .learnset-tabs :global([data-tabs-list]) { gap: 0.375rem; }
  .learnset-tabs :global(.method-tab) {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    max-width: 100%;
    padding: 0.375rem 0.625rem;
    border: var(--border-width) solid var(--border-strong);
    border-radius: var(--radius-control);
    background: var(--surface);
    color: var(--page-text);
    text-align: start;
    line-height: 1.25;
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
    border-radius: var(--radius-pill);
    background: var(--surface-muted);
    color: var(--page-text);
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
  }
  .method-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.25rem 0.75rem; }
  .method-heading h3 { margin: 0; font-size: 1.125rem; overflow-wrap: anywhere; }
  .row-count { color: var(--muted); font-size: 0.8125rem; font-variant-numeric: tabular-nums; }
  .scroll-hint { margin-block: 0.375rem 0.625rem; color: var(--muted); font-size: 0.8125rem; }
  .table-scroll {
    position: relative;
    isolation: isolate;
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
  table { width: 100%; min-width: 34rem; border-collapse: separate; border-spacing: 0; }
  th, td { padding: 0.5rem 0.625rem; vertical-align: middle; }
  thead th {
    position: sticky;
    inset-block-start: 0;
    z-index: 2;
    background: var(--surface-muted);
    color: var(--muted);
    line-height: 1.25;
  }
  .move-identity {
    position: sticky;
    inset-inline-start: 0;
    width: 11rem;
    min-width: 11rem;
    max-width: 11rem;
    border-inline-end: var(--border-width) solid var(--border);
    overflow-wrap: anywhere;
  }
  thead .move-identity { z-index: 3; color: var(--page-text); }
  tbody .move-identity { z-index: 1; background: var(--surface); font-weight: 700; }
  th a { display: flex; align-items: center; gap: 0.375rem; min-width: 0; }
  th a :global(svg), th a :global(img) { flex-shrink: 0; }
  th a :global(small) { font-weight: 400; }
  tbody tr:hover > :is(th, td), tbody tr:focus-within > :is(th, td) { background: var(--accent-soft); }
  tbody tr:last-child > :is(th, td) { border-block-end: none; }
  .numeric { white-space: nowrap; text-align: end; font-variant-numeric: tabular-nums; }
  td.numeric { font-weight: 600; }
  td.missing { color: var(--muted); font-weight: 400; }
  .level { width: 4.5rem; }
  .level-value {
    display: inline-block;
    min-width: 2.25rem;
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-control);
    background: var(--surface-muted);
    color: var(--page-text);
    text-align: center;
    font-weight: 700;
  }
  .category { text-align: center; }
  .damage-class { position: relative; display: inline-flex; align-items: center; vertical-align: middle; }
  @media (max-width: 30rem) {
    .move-identity { width: 8.5rem; min-width: 8.5rem; max-width: 8.5rem; }
    th, td { padding-inline: 0.5rem; }
    th a { flex-wrap: wrap; gap: 0.25rem; }
  }
</style>
