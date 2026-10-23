<script lang="ts">
  import { Tabs } from "bits-ui";
  import type { Version, VersionGroup } from "../../../../../../packages/pokemon-data/src/types.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { t, versionGroupName, versionName } from "#lib/i18n/pokemon.ts";

  let { lang, name, sprites, versions, versionGroups }: {
    lang: Language;
    name: string;
    sprites: unknown;
    versions: readonly Version[];
    versionGroups: readonly VersionGroup[];
  } = $props();

  function object(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  const VIEWS = [
    "front_default", "back_default", "front_shiny", "back_shiny",
    "front_female", "back_female", "front_shiny_female", "back_shiny_female",
    "front_gray", "back_gray", "front_gbc", "back_gbc",
    "front_transparent", "back_transparent", "front_transparent_gray", "back_transparent_gray",
    "front_shiny_transparent", "back_shiny_transparent",
  ] as const;
  type Image = { view: typeof VIEWS[number]; url: string };
  type Source = { id: string; label: string; images: Image[]; generation?: string };
  type Group = { id: "pixel" | "animated" | "home" | "games" | "artwork" | "icons"; sources: Source[] };

  function images(value: unknown): Image[] {
    const data = object(value);
    return VIEWS.flatMap((view) => {
      const url = data[view];
      return typeof url === "string" && url.length > 0 ? [{ view, url }] : [];
    });
  }

  function gameLabel(identifier: string): string {
    const version = versions.find((entry) => entry.identifier === identifier);
    if (version) return versionName(lang, version);
    const group = versionGroups.find((entry) => entry.identifier === (identifier === "omegaruby-alphasapphire" ? "omega-ruby-alpha-sapphire" : identifier));
    return (group && versionGroupName(lang, versions, group.id)) || identifier;
  }

  const groups = $derived.by(() => {
    const root = object(sprites);
    const other = object(root.other);
    const historical: Source[] = [];
    const icons: Source[] = [];
    // Source JSON keys are not chronological (generation-ix can precede generation-v).
    const generationOrder = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"];
    for (const [index, roman] of generationOrder.entries()) {
      const generation = t(lang, "identity.generation", { number: index + 1 });
      const games = object(object(root.versions)[`generation-${roman}`]);
      for (const [game, value] of Object.entries(games)) {
        const data = object(value);
        if (game === "icons") {
          icons.push({ id: roman, label: generation, images: images(data) });
          const animated = images(data.animated);
          if (animated.length) icons.push({ id: `${roman}-animated`, label: `${generation} · ${t(lang, "sprites.animated")}`, images: animated });
          continue;
        }
        const label = gameLabel(game);
        historical.push({ id: `${roman}-${game}`, label, generation, images: images(data) });
        const animated = images(data.animated);
        if (animated.length) historical.push({ id: `${roman}-${game}-animated`, label: `${label} · ${t(lang, "sprites.animated")}`, generation, images: animated });
        icons.push({ id: `${roman}-${game}`, label: `${generation} · ${label}`, images: images(data.icons) });
      }
    }
    const result: Group[] = [
      { id: "pixel", sources: [{ id: "pixel", label: "", images: images(root) }] },
      { id: "animated", sources: [{ id: "animated", label: "", images: images(other.showdown) }] },
      { id: "home", sources: [{ id: "home", label: "", images: images(other.home) }] },
      { id: "games", sources: historical },
      { id: "artwork", sources: [
        { id: "official", label: t(lang, "sprites.official"), images: images(other["official-artwork"]) },
        { id: "dream", label: t(lang, "sprites.dream"), images: images(other.dream_world) },
      ] },
      { id: "icons", sources: icons },
    ];
    return result.map((group) => ({ ...group, sources: group.sources.filter((source) => source.images.length > 0) }))
      .filter((group) => group.sources.length > 0);
  });

  let selectedTab = $state("pixel");
  let selections = $state<Record<string, string>>({});
  const activeTab = $derived(groups.some((group) => group.id === selectedTab) ? selectedTab : (groups[0]?.id ?? "pixel"));
  const activeGroup = $derived(groups.find((group) => group.id === activeTab));
  const activeSource = $derived(activeGroup?.sources.find((source) => source.id === selections[activeTab]) ?? activeGroup?.sources[0]);
  let failedUrls = $state<string[]>([]);
</script>

<section aria-labelledby="sprites-heading" class="sprite-gallery">
  <h2 id="sprites-heading">{t(lang, "sprites.heading")}</h2>
  <p class="note">{t(lang, "sprites.note")}</p>
  {#if groups.length === 0}
    <p>{t(lang, "sprites.missing")}</p>
  {:else}
    <Tabs.Root value={activeTab} onValueChange={(value) => (selectedTab = value)}>
      <Tabs.List class="sprite-tabs" aria-label={t(lang, "sprites.heading")}>
        {#each groups as group (group.id)}
          <Tabs.Trigger class="sprite-tab" value={group.id}>{t(lang, `sprites.${group.id}`)}</Tabs.Trigger>
        {/each}
      </Tabs.List>
      {#each groups as group (group.id)}
        <Tabs.Content value={group.id}>
          {#if activeTab === group.id && activeSource}
            <div class="gallery-toolbar">
              <div class="source-context" aria-live="polite" aria-atomic="true">
                <span class="source-label">{t(lang, "sprites.source")}</span>
                <strong>{activeSource.label || t(lang, `sprites.${group.id}`)}</strong>
                {#if activeSource.label}
                  <span class="source-category">{activeSource.generation ? `${activeSource.generation} · ` : ""}{t(lang, `sprites.${group.id}`)}</span>
                {/if}
              </div>
              {#if group.id === "games" || group.id === "artwork" || group.id === "icons"}
                <div class="source-picker">
                  <label for={`sprite-source-${group.id}`}>{t(lang, group.id === "games" ? "sprites.game" : "sprites.source")}</label>
                  <select id={`sprite-source-${group.id}`} value={activeSource.id} onchange={(event) => (selections[group.id] = event.currentTarget.value)}>
                    {#if group.id === "games"}
                      {#each [...new Set(group.sources.map((source) => source.generation))] as generation}
                        <optgroup label={generation}>
                          {#each group.sources.filter((source) => source.generation === generation) as source (source.id)}
                            <option value={source.id}>{source.label}</option>
                          {/each}
                        </optgroup>
                      {/each}
                    {:else}
                      {#each group.sources as source (source.id)}
                        <option value={source.id}>{source.label}</option>
                      {/each}
                    {/if}
                  </select>
                </div>
              {/if}
            </div>
            <div class="sprite-grid" class:menu-icons={group.id === "icons"}>
              {#each activeSource.images as image (`${activeSource.id}-${image.view}-${image.url}`)}
                <figure>
                  <div class="sprite-frame">
                    {#if failedUrls.includes(image.url)}
                      <p class="sprite-missing" role="status">{t(lang, "sprites.loadError")}</p>
                    {:else}
                      <img
                        src={image.url}
                        alt={t(lang, "sprites.alt", { name, view: `${activeSource.label || t(lang, `sprites.${group.id}`)}, ${t(lang, `sprites.${image.view}`)}` })}
                        width={group.id === "icons" ? 64 : 192}
                        height={group.id === "icons" ? 64 : 192}
                        loading="lazy"
                        class:pixelated={group.id === "pixel" || group.id === "animated" || group.id === "icons" || group.id === "games"}
                        onerror={() => (failedUrls = [...failedUrls, image.url])}
                      />
                    {/if}
                  </div>
                  <figcaption>{t(lang, `sprites.${image.view}`)}</figcaption>
                </figure>
              {/each}
            </div>
          {/if}
        </Tabs.Content>
      {/each}
    </Tabs.Root>
  {/if}
</section>

<style>
  .sprite-gallery { min-width: 0; }
  .sprite-gallery :global(.sprite-tabs) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
    gap: 0.375rem;
    margin-block: 1rem 0.75rem;
  }
  .sprite-gallery :global(.sprite-tab) {
    min-width: 0;
    min-height: 2.75rem;
    padding: 0.5rem;
    border: 0;
    border-inline-start: var(--data-rule) solid var(--border-strong);
    border-radius: 0;
    background: var(--surface-muted);
    text-align: start;
    font-size: var(--data-label-size);
    font-weight: 600;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .sprite-gallery :global(.sprite-tab[data-state="active"]) {
    border-inline-start-color: var(--accent);
    box-shadow: none;
    color: var(--page-text);
  }
  .gallery-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem 1rem;
    padding: var(--data-padding);
    border-inline-start: var(--data-rule) solid var(--border-strong);
    background: var(--surface-muted);
  }
  .source-context { display: grid; gap: 0.125rem; min-width: 0; overflow-wrap: anywhere; }
  .source-label { font-size: var(--data-label-size); font-weight: 600; }
  .source-category { color: var(--muted); font-size: var(--data-label-size); }
  .source-picker { display: grid; gap: 0.25rem; flex: 0 1 22rem; min-width: 0; max-width: 100%; }
  .source-picker label { font-size: var(--data-label-size); font-weight: 600; }
  select { width: 100%; min-width: 0; max-width: 100%; min-height: 2.75rem; padding: 0.5rem; font: inherit; }
  .sprite-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 7.5rem), 1fr)); gap: 0.75rem; margin-block: 0.75rem 1rem; }
  figure {
    display: grid;
    align-content: start;
    gap: 0.5rem;
    min-width: 0;
    margin: 0;
    padding: 0.625rem;
    border-inline-start: var(--data-rule) solid var(--border-strong);
    background: var(--surface-muted);
    text-align: center;
  }
  .sprite-frame {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    min-width: 0;
    background: var(--surface);
  }
  img { width: 100%; height: 100%; max-width: 12rem; max-height: 12rem; object-fit: contain; }
  .menu-icons img { width: 4rem; height: 4rem; }
  .pixelated { image-rendering: pixelated; }
  .sprite-missing { margin: 0; padding: 0.5rem; color: var(--muted); font-size: 0.875rem; overflow-wrap: anywhere; }
  figcaption { min-height: 2.6em; font-size: var(--data-label-size); font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
  @media (max-width: 30rem) {
    .gallery-toolbar { align-items: stretch; }
    .source-picker { flex-basis: 100%; }
  }
</style>
