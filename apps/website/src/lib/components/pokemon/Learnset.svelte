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
    referenceMoves: ReadonlyArray<Pick<ReferenceData["moves"][number], "id" | "typeId">>;
  } = $props();

  const moveTypes = $derived.by(() => {
    const types = new Map<number, number | null>();
    for (const move of referenceMoves) types.set(move.id, move.typeId);
    return types;
  });

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
    {#if groups.length > 0}
      <Tabs.Root value={activeTab} onValueChange={(v) => (selectedTab = v)}>
        <Tabs.List>
          {#each groups as group (group.methodId)}
            <Tabs.Trigger value={String(group.methodId)}>
              <Localized text={group.method} />
            </Tabs.Trigger>
          {/each}
        </Tabs.List>
        {#each groups as group (group.methodId)}
          <Tabs.Content value={String(group.methodId)}>
            <table>
              <caption class="visually-hidden"><Localized text={group.method} /></caption>
              <thead>
                <tr>
                  {#if group.levelUp}<th scope="col" class="numeric">{t(lang, "moves.level")}</th>{/if}
                  <th scope="col">{t(lang, "moves.move")}</th>
                  {#if group.hasMastery}<th scope="col" class="numeric">{t(lang, "moves.mastery")}</th>{/if}
                </tr>
              </thead>
              <tbody>
                {#each group.moves as move, index (index)}
                  <tr>
                    {#if group.levelUp}<td class="numeric">{move.level}</td>{/if}
                    <th scope="row">
                      <a
                        href={`${resolve(`${lang}/move/${move.moveId}/`)}${page.url.searchParams.has("version") ? `?version=${encodeURIComponent(page.url.searchParams.get("version")!)}` : ""}`}
                      ><MoveIcon typeId={moveTypes.get(move.moveId)} /><Localized text={move.name} /></a>
                    </th>
                    {#if group.hasMastery}<td class="numeric">{move.mastery ?? ""}</td>{/if}
                  </tr>
                {/each}
              </tbody>
            </table>
          </Tabs.Content>
        {/each}
      </Tabs.Root>
    {/if}
  {:else}
    <p>{reasonText(lang, learnset.reason)}</p>
  {/if}
</section>

<style>
  table { width: min(100%, 32rem); }
  th, td { vertical-align: middle; }
  th[scope="row"] { width: 100%; font-weight: normal; }
  th a { display: inline-flex; align-items: center; gap: 0.375rem; }
</style>
