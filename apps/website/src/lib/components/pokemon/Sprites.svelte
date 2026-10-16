<script lang="ts">
  import { Tabs } from "bits-ui";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/pokemon.ts";

  let { lang, name, sprites }: { lang: Language; name: string; sprites: unknown } = $props();

  function object(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  const VIEWS = [
    "front_default",
    "back_default",
    "front_shiny",
    "back_shiny",
    "front_female",
    "back_female",
    "front_shiny_female",
    "back_shiny_female",
  ] as const;

  const groups = $derived.by(() => {
    const root = object(sprites);
    const other = object(root.other);
    return [
      { id: "pixel" as const, data: root },
      { id: "animated" as const, data: object(other.showdown) },
      { id: "home" as const, data: object(other.home) },
    ].map(({ id, data }) => ({
      id,
      images: VIEWS.flatMap((view) => {
        const url = data[view];
        return typeof url === "string" && url.length > 0 ? [{ view, url }] : [];
      }),
    })).filter((group) => group.images.length > 0);
  });

  let selectedTab = $state("pixel");
  const activeTab = $derived(
    groups.some((group) => group.id === selectedTab) ? selectedTab : (groups[0]?.id ?? "pixel"),
  );
  let failedUrls = $state<string[]>([]);
</script>

<section aria-labelledby="sprites-heading" class="sprite-gallery">
  <h2 id="sprites-heading">{t(lang, "sprites.heading")}</h2>
  <p class="note">{t(lang, "sprites.note")}</p>
  {#if groups.length === 0}
    <p>{t(lang, "sprites.missing")}</p>
  {:else}
    <Tabs.Root value={activeTab} onValueChange={(value) => (selectedTab = value)}>
      <Tabs.List aria-label={t(lang, "sprites.heading")}>
        {#each groups as group (group.id)}
          <Tabs.Trigger value={group.id}>{t(lang, `sprites.${group.id}`)}</Tabs.Trigger>
        {/each}
      </Tabs.List>
      {#each groups as group (group.id)}
        <Tabs.Content value={group.id}>
          {#if activeTab === group.id}
          <div class="sprite-grid">
            {#each group.images as image (image.view)}
              <figure>
                {#if failedUrls.includes(image.url)}
                  <p class="sprite-missing">{t(lang, "sprites.loadError")}</p>
                {:else}
                  <img
                    src={image.url}
                    alt={t(lang, "sprites.alt", { name, view: t(lang, `sprites.${image.view}`) })}
                    width="192"
                    height="192"
                    loading="lazy"
                    class:pixelated={group.id !== "home"}
                    onerror={() => (failedUrls = [...failedUrls, image.url])}
                  />
                {/if}
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
  .sprite-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
    gap: 1rem;
    margin-block: 1rem;
  }

  figure {
    margin: 0;
    text-align: center;
  }

  img {
    max-width: 100%;
    object-fit: contain;
  }

  .pixelated {
    image-rendering: pixelated;
  }

  .sprite-missing {
    display: grid;
    align-items: center;
    min-height: 12rem;
    margin: 0;
  }
</style>
