<script lang="ts">
  import { Tabs } from "bits-ui";
  import type {
    LocalizedText,
    ResolvedPokemon,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { reasonText, t } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  type Move = Extract<ResolvedPokemon["learnset"], { status: "available" }>["value"][number];

  let {
    lang,
    learnset,
    games,
  }: {
    lang: Language;
    learnset: ResolvedPokemon["learnset"];
    /** Localized names of the selected version group's games. */
    games: string;
  } = $props();

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
    <p>{t(lang, "moves.context", { games })}</p>
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
              <caption><Localized text={group.method} /></caption>
              <thead>
                <tr>
                  {#if group.levelUp}<th scope="col">{t(lang, "moves.level")}</th>{/if}
                  <th scope="col">{t(lang, "moves.move")}</th>
                  {#if group.hasMastery}<th scope="col">{t(lang, "moves.mastery")}</th>{/if}
                </tr>
              </thead>
              <tbody>
                {#each group.moves as move, index (index)}
                  <tr>
                    {#if group.levelUp}<td>{move.level}</td>{/if}
                    <th scope="row"><Localized text={move.name} /></th>
                    {#if group.hasMastery}<td>{move.mastery ?? ""}</td>{/if}
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
