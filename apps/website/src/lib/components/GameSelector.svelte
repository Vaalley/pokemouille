<script lang="ts" module>
  import { createContext } from "svelte";

  /**
   * The game the header selector currently shows, provided by `[lang]/+layout.svelte`.
   * `null` until the browser has loaded the games and resolved URL/preference context.
   */
  export const [getSelectedVersion, setSelectedVersion] = createContext<() => string | null>();
</script>

<script lang="ts">
  import { Label, Select } from "bits-ui";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import { localizeVersion } from "../i18n/pokemon.ts";
  import type { Language } from "../i18n/core.ts";
  import { t } from "../i18n/messages.ts";

  interface Props {
    lang: Language;
    games: GameOption[] | null;
    value: string | null;
    onchange: (version: string) => void;
    /** Games failed to load: the disabled select says so instead of "loading". */
    error?: boolean;
  }

  let { lang, games, value, onchange, error = false }: Props = $props();

  const id = $props.id();

  // `games` is ordered by version-group release order; generations keep first-appearance order.
  const generations = $derived.by(() => {
    const groups: { generationId: number; games: GameOption[] }[] = [];
    const byGeneration: Record<number, GameOption[]> = {};
    for (const game of games ?? []) {
      const generationId = game.group.generationId;
      let members = byGeneration[generationId];
      if (!members) {
        members = byGeneration[generationId] = [];
        groups.push({ generationId, games: members });
      }
      members.push(game);
    }
    return groups;
  });

  const items = $derived(
    (games ?? []).map((game) => ({
      value: game.version.identifier,
      label: localizeVersion(lang, game.version).text,
    })),
  );
  const selectedName = $derived.by(() => {
    if (!games || !value) return null;
    const game = games.find((entry) => entry.version.identifier === value);
    return game ? localizeVersion(lang, game.version) : null;
  });
</script>

<div class="game-selector">
  <Label.Root for="{id}-game">{t(lang, "game.label")}</Label.Root>
  <Select.Root
    type="single"
    allowDeselect={false}
    value={value ?? ""}
    onValueChange={(next) => {
      if (next && next !== value) onchange(next);
    }}
    disabled={!games || !value}
    {items}
  >
    <Select.Trigger id="{id}-game" aria-describedby={error ? `${id}-error` : undefined}>
      {#if selectedName}
        <span lang={selectedName.fallback && selectedName.sourceLanguageId === 9 ? "en" : undefined}>
          {selectedName.text}
        </span>
      {:else}
        {error ? "—" : t(lang, "game.loading")}
      {/if}
    </Select.Trigger>
    {#if games && value}
      <Select.Portal>
        <Select.Content>
          <Select.Viewport>
            {#each generations as generation (generation.generationId)}
              <Select.Group>
                <Select.GroupHeading>
                  {t(lang, "game.generation", { number: generation.generationId })}
                </Select.GroupHeading>
                {#each generation.games as game (game.version.identifier)}
                  {@const name = localizeVersion(lang, game.version)}
                  <!-- Names missing in the UI language fall back to English; mark them for assistive tech. -->
                  <Select.Item
                    value={game.version.identifier}
                    label={name.text}
                    lang={name.fallback && name.sourceLanguageId === 9 ? "en" : undefined}
                  >
                    {name.text}
                  </Select.Item>
                {/each}
              </Select.Group>
            {/each}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    {/if}
  </Select.Root>
  {#if error}
    <p id="{id}-error" role="alert">{t(lang, "game.error")}</p>
  {/if}
</div>

<style>
  .game-selector { display: grid; align-content: start; gap: 0.375rem; min-width: 0; padding: var(--data-padding); border-inline-start: var(--data-rule) solid var(--accent); background: var(--surface-muted); }
  .game-selector :global(label) { font-size: var(--data-label-size); font-weight: 600; }
  .game-selector :global([data-select-trigger]) { width: 100%; min-width: 0; min-height: 2.75rem; text-align: start; font-weight: 600; background: var(--surface); }
  .game-selector p { margin: 0; font-size: var(--data-label-size); overflow-wrap: anywhere; }
</style>
