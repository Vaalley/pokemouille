<script lang="ts">
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { getSelectedVersion } from "./GameSelector.svelte";
  import { paginationUrl } from "#lib/data/pagination.ts";

  let { current, pages, source, label, previous, next, position }: {
    current: number;
    pages: number;
    source: URL;
    label: string;
    previous: string;
    next: string;
    position: string;
  } = $props();
  const selectedVersion = getSelectedVersion();

  function navigate(event: MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    pushState(new URL((event.currentTarget as HTMLAnchorElement).href), page.state);
  }
</script>

<nav class="pagination" aria-label={label}>
  {#if current > 1}
    {@const url = paginationUrl(source, current - 1, selectedVersion())}
    <a rel="prev" href={`${url.pathname}${url.search}${url.hash}`} onclick={navigate}>{previous}</a>
  {/if}
  <span role="status" aria-live="polite" aria-atomic="true">{position}</span>
  {#if current < pages}
    {@const url = paginationUrl(source, current + 1, selectedVersion())}
    <a rel="next" href={`${url.pathname}${url.search}${url.hash}`} onclick={navigate}>{next}</a>
  {/if}
</nav>

<style>
  .pagination { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; margin-block: 1.5rem; }
  a { display: inline-flex; align-items: center; min-height: 2.75rem; }
</style>
