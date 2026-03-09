<script lang="ts">
	import { onMount } from 'svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import { getSavedLanguage, type Language } from '$lib/language';

	let language = $state<Language>('en');
	let pokemonName = $state('');
	let flavorText = $state('');
	let errorMessage = $state('');
	let isLoading = $state(true);

	function getLocalizedName(data: any, selectedLanguage: Language): string {
		const localizedName = data.names.find(
			(entry: any) => entry.language.name === selectedLanguage,
		);

		return localizedName?.name ?? 'Bulbasaur';
	}

	function getLocalizedFlavorText(data: any, selectedLanguage: Language): string {
		const entry = data.flavor_text_entries.find(
			(item: any) => item.language.name === selectedLanguage,
		);

		return entry?.flavor_text.replaceAll('\f', ' ').replaceAll('\n', ' ') ?? '';
	}

	async function loadPokemon(selectedLanguage: Language) {
		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch('https://pokeapi.co/api/v2/pokemon-species/1');

			if (!response.ok) {
				throw new Error('Failed to load Pokémon data.');
			}

			const data = await response.json();

			pokemonName = getLocalizedName(data, selectedLanguage);
			flavorText = getLocalizedFlavorText(data, selectedLanguage);
		} catch {
			pokemonName = '';
			flavorText = '';
			errorMessage = 'Could not load Pokémon data.';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		async function handleLanguageChange() {
			language = getSavedLanguage();
			await loadPokemon(language);
		}

		async function handleStorage(event: StorageEvent) {
			if (event.key !== 'language') {
				return;
			}

			await handleLanguageChange();
		}

		window.addEventListener('languagechange', handleLanguageChange);
		window.addEventListener('storage', handleStorage);

		void handleLanguageChange();

		return () => {
			window.removeEventListener('languagechange', handleLanguageChange);
			window.removeEventListener('storage', handleStorage);
		};
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<ThemeSelector />
<LanguageSelector />

<section>
	<h2>PokéAPI example</h2>
	<p>Selected language: {language}</p>

	{#if isLoading}
		<p>Loading Pokémon data...</p>
	{:else if errorMessage}
		<p>{errorMessage}</p>
	{:else}
		<div>
			<p><strong>Name:</strong> {pokemonName}</p>
			<p><strong>Description:</strong> {flavorText}</p>
		</div>
	{/if}
</section>
