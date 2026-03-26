<script lang="ts">
	import { getSavedGeneration } from '$lib/generation';
	import { onMount, tick } from 'svelte';
	import { getSavedLanguage } from '$lib/language';
	import TypeBadge from '$lib/components/TypeBadge.svelte';
	import {
		closePokemonSearch,
		openPokemonSearch,
		searchState,
		setPokemonSearchQuery,
		syncPokemonListToSavedLanguage,
	} from '$lib/pokemon-search.svelte';

	const filteredPokemon = $derived.by(() => {
		const query = searchState.query.trim().toLowerCase();
		if (!query) return searchState.pokemonList.slice(0, 60);
		return searchState.pokemonList
			.filter((item) => String(item.id).includes(query) || item.name.toLowerCase().includes(query))
			.slice(0, 60);
	});

	const filteredAbilities = $derived.by(() => {
		const query = searchState.query.trim().toLowerCase();
		if (!query) return [];
		return searchState.abilityList.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 20);
	});

	const filteredMoves = $derived.by(() => {
		const query = searchState.query.trim().toLowerCase();
		if (!query) return [];
		return searchState.moveList.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 20);
	});

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

	function pokemonHref(id: number) {
		return `/pokemon/${getSavedLanguage()}/${getSavedGeneration()}/${id}`;
	}

	function abilityHref(id: number) {
		return `/ability/${getSavedLanguage()}/${getSavedGeneration()}/${id}`;
	}

	function moveHref(id: number) {
		return `/move/${getSavedLanguage()}/${getSavedGeneration()}/${id}`;
	}

	$effect(() => {
		if (searchState.isOpen) {
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

			if (event.key === 'Escape' && searchState.isOpen) {
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

{#if searchState.isOpen}
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
			value={searchState.query}
		/>

		<div class="mt-4 max-h-96 overflow-y-auto space-y-4">
			{#if searchState.isLoading}
				<p>Loading...</p>
			{:else if searchState.errorMessage}
				<p>{searchState.errorMessage}</p>
			{:else}
				{#if filteredPokemon.length > 0}
					<div>
						<p class="mb-1 text-xs font-semibold uppercase text-gray-400">Pokémon</p>
						<div class="grid grid-cols-3 gap-2">
							{#each filteredPokemon as item}
								<a
									class="flex cursor-pointer items-center gap-2 border hover:bg-gray-100"
									data-sveltekit-preload-data="hover"
									href={pokemonHref(item.id)}
									onclick={closePokemonSearch}
								>
									{#if item.sprite}
										<img alt={item.name} class="h-12 w-12" src={item.sprite} />
									{/if}
									<div class="flex flex-col items-start gap-1">
										<span>{item.name}</span>
										<div class="flex gap-1">
											{#each item.types as t}
												<TypeBadge slug={t} name={t} />
											{/each}
										</div>
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				{#if filteredAbilities.length > 0}
					<div>
						<p class="mb-1 text-xs font-semibold uppercase text-gray-400">Abilities</p>
						<div class="grid grid-cols-2 gap-2">
							{#each filteredAbilities as item}
								<a
									class="flex cursor-pointer flex-col items-start border px-3 py-2 text-sm hover:bg-gray-100"
									data-sveltekit-preload-data="hover"
									href={abilityHref(item.id)}
									onclick={closePokemonSearch}
								>
									<span class="font-medium">{item.name}</span>
									{#if item.shortEffect}
										<span class="text-xs text-gray-400 line-clamp-1">{item.shortEffect}</span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/if}

				{#if filteredMoves.length > 0}
					<div>
						<p class="mb-1 text-xs font-semibold uppercase text-gray-400">Moves</p>
						<div class="grid grid-cols-2 gap-2">
							{#each filteredMoves as item}
								<a
									class="flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:bg-gray-100"
									data-sveltekit-preload-data="hover"
									href={moveHref(item.id)}
									onclick={closePokemonSearch}
								>
									{#if item.typeSlug}
										<TypeBadge slug={item.typeSlug} name={item.typeSlug} />
									{/if}
									<span>{item.name}</span>
									{#if item.damageClass}
										<span class="ml-auto text-xs text-gray-400">{item.damageClass}</span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/if}

				{#if filteredPokemon.length === 0 && filteredAbilities.length === 0 && filteredMoves.length === 0 && searchState.query.trim() !== ''}
					<p class="text-sm text-gray-500">No results found.</p>
				{/if}
			{/if}
		</div>
	</div>
{/if}
