<script lang="ts">
  import { onMount } from "svelte";
  import { Button, Dialog } from "bits-ui";
  import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
  import type SearchDialogContent from "#lib/components/SearchDialogContent.svelte";
  import type { Language } from "#lib/i18n/core.ts";
  import { t } from "#lib/i18n/messages.ts";

  interface Props {
    lang: Language;
    /** Main-series games, `null` until loaded (or when loading failed). */
    games: GameOption[] | null;
    /** The header's resolved game, `null` until games and context are known. */
    version: string | null;
  }

  let { lang, games, version }: Props = $props();

  const id = $props.id();

  let isOpen = $state(false);
  let input = $state<HTMLInputElement | null>(null);
  let query = $state("");
  let shortcut = $state<{ label: string; keys: string } | null>(null);
  let Content = $state.raw<typeof SearchDialogContent | null>(null);
  let contentFailed = $state(false);
  let contentPending = false;
  // Element focused before opening; focus goes back there on close.
  let previousFocus: HTMLElement | null = null;

  function loadContent() {
    if (Content || contentPending) return;
    contentPending = true;
    contentFailed = false;
    // Deliberate static-import exception: search and ItemIcon's identifier map load only on demand.
    import("#lib/components/SearchDialogContent.svelte").then(
      (module) => {
        contentPending = false;
        Content = module.default;
      },
      () => {
        contentPending = false;
        contentFailed = true;
      },
    );
  }

  $effect(() => {
    if (isOpen && !Content && !contentFailed) loadContent();
  });

  function restoreFocus(event: Event) {
    if (previousFocus && previousFocus.isConnected) {
      event.preventDefault();
      previousFocus.focus();
    }
    previousFocus = null;
  }

  function isEditable(target: EventTarget | null): boolean {
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    ) {
      return true;
    }
    if (target instanceof HTMLElement && target.isContentEditable) return true;
    if (!(target instanceof Element)) return false;
    return (
      target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="listbox"], [role="option"], [data-select-trigger], [data-select-content], [data-dialog-content]',
      ) !== null
    );
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
    if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();
      if (isOpen) {
        input?.focus();
        input?.select();
      } else {
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        isOpen = true;
      }
      return;
    }
    if (isOpen || event.ctrlKey || event.metaKey || event.altKey) return;
    // One printable, non-space character typed outside any editable field starts a search.
    if ([...event.key].length !== 1 || !/\S/u.test(event.key)) return;
    if (isEditable(event.target)) return;
    event.preventDefault();
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    query = event.key;
    isOpen = true;
  }
  onMount(() => {
    // Keyboard hint only where a keyboard is likely; touch devices just tap the button.
    if (matchMedia("(any-pointer: fine)").matches) {
      shortcut = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
        ? { label: "⌘K", keys: "Meta+K" }
        : { label: "Ctrl+K", keys: "Control+K" };
    }
    window.addEventListener("keydown", handleWindowKeydown);
    return () => window.removeEventListener("keydown", handleWindowKeydown);
  });
</script>

<Dialog.Root
  bind:open={isOpen}
  onOpenChange={(next) => {
    if (!next) query = "";
  }}
>
  <Dialog.Trigger class="search-trigger" aria-keyshortcuts={shortcut?.keys}>
    {t(lang, "search.label")}
    {#if shortcut}<kbd aria-hidden="true">{shortcut.label}</kbd>{/if}
  </Dialog.Trigger>
  {#if Content}
    <Content
      {id}
      {lang}
      {games}
      {version}
      bind:isOpen
      bind:query
      bind:input
      onCloseAutoFocus={restoreFocus}
    />
  {:else}
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          input?.focus();
          input?.setSelectionRange(query.length, query.length);
        }}
        class="search-dialog"
        onCloseAutoFocus={(event) => {
          // Replacing the loading shell is not a close: the loaded content takes focus.
          if (Content && isOpen) event.preventDefault();
          else restoreFocus(event);
        }}
      >
        <div class="search-dialog-body">
          <div class="search-dialog-header">
            <Dialog.Title id="{id}-title">{t(lang, "search.label")}</Dialog.Title>
            <Dialog.Close>{t(lang, "search.close")}</Dialog.Close>
          </div>
          <div class="search-field">
            <label for="{id}-input">{t(lang, "search.input")}</label>
            <input
              id="{id}-input"
              bind:this={input}
              bind:value={query}
              aria-describedby="{id}-status"
            />
          </div>
          <p id="{id}-status" class="search-status" role="status" aria-live="polite">
            {t(lang, contentFailed ? "search.error" : "search.loading")}
          </p>
          {#if contentFailed}
            <p>
              <!-- A failed module import is cached by the browser; a fresh document can retry it. -->
              <Button.Root type="button" onclick={() => window.location.reload()}>{t(lang, "search.reload")}</Button.Root>
            </p>
          {/if}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  {/if}
</Dialog.Root>
