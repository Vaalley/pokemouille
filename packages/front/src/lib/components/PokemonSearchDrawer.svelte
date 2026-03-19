<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSavedGeneration } from '$lib/generation';
	import { get } from 'svelte/store';
	import { onMount, tick } from 'svelte';
	import { getSavedLanguage } from '$lib/language';
	import {
		closePokemonSearch,
		filteredPokemon,
		isPokemonListLoading,
		isPokemonSearchOpen,
		openPokemonSearch,
		pokemonListErrorMessage,
		pokemonSearchQuery,
		setPokemonSearchQuery,
		syncPokemonListToSavedLanguage,
	} from '$lib/pokemon-search';

	let inputElement = $state<HTMLInputElement | null>(null);

	function isEditableTarget(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) {
			return false;
		}

		if (target.isContentEditable) {
			return true;
		}

		return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
	}

	function isLetterKey(event: KeyboardEvent): boolean {
		return event.key.length === 1 && /[a-z]/i.test(event.key);
	}

	async function focusInput() {
		await tick();
		inputElement?.focus();
		inputElement?.setSelectionRange(inputElement.value.length, inputElement.value.length);
	}

	async function handlePokemonSelect(id: number) {
		const language = getSavedLanguage();
		const generation = getSavedGeneration();
		closePokemonSearch();
		await goto(`/pokemon/${language}/${generation}/${id}`);
	}

	$effect(() => {
		if ($isPokemonSearchOpen) {
			void focusInput();
		}
	});

	onMount(() => {
		async function handleLanguageChange() {
			await syncPokemonListToSavedLanguage();
		}

		async function handleStorage(event: StorageEvent) {
			if (event.key !== 'language') {
				return;
			}

			await handleLanguageChange();
		}

		async function handleKeydown(event: KeyboardEvent) {
			if (event.ctrlKey || event.altKey || event.metaKey) {
				return;
			}

			if (event.key === 'Escape' && get(isPokemonSearchOpen)) {
				closePokemonSearch();
				return;
			}

			if (isEditableTarget(event.target)) {
				return;
			}

			if (!isLetterKey(event)) {
				return;
			}

			event.preventDefault();
			openPokemonSearch(event.key.toLowerCase());
			await focusInput();
		}

		void syncPokemonListToSavedLanguage();
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('languagechange', handleLanguageChange);
		window.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('languagechange', handleLanguageChange);
			window.removeEventListener('storage', handleStorage);
		};
	});
</script>

{#if $isPokemonSearchOpen}
	<button
		aria-label="Close pokemon search"
		class="fixed inset-0 z-40 bg-black/40"
		type="button"
		onclick={closePokemonSearch}
	></button>

	<div
		class="fixed inset-x-4 top-1/2 max-h-[80vh] -translate-y-1/2 overflow-hidden z-50 mx-auto max-w-2xl border bg-white p-4"
	>
		<input
			bind:this={inputElement}
			class="w-full border p-2"
			oninput={(event) => {
				setPokemonSearchQuery(event.currentTarget.value);
			}}
			placeholder="Search pokemon"
			value={$pokemonSearchQuery}
		/>

		<div class="mt-4 max-h-96 overflow-y-auto">
			{#if $isPokemonListLoading}
				<p>Loading Pokémon list...</p>
			{:else if $pokemonListErrorMessage}
				<p>{$pokemonListErrorMessage}</p>
			{:else if $filteredPokemon.length === 0}
				<p>No Pokémon found.</p>
			{:else}
				<div class="grid grid-cols-3 gap-2">
					{#each $filteredPokemon as item}
						<button
							class="flex cursor-pointer items-center gap-2 border hover:bg-gray-100"
							type="button"
							onclick={async () => {
								await handlePokemonSelect(item.id);
							}}
						>
							<img
								alt={item.name}
								class="h-12 w-12"
								src={`https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/pokemon/${item.id}.png`}
							/>
							<span>{item.name}</span>
							<span>#{item.id}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
