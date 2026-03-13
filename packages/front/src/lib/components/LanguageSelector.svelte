<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		getSavedLanguage,
		languages,
		setLanguage,
		type Language,
	} from '$lib/language';

	let language = $state<Language>('en');

	async function handleChange() {
		setLanguage(language);

		const [, currentLanguage, currentGeneration, pokemonId] = window.location.pathname
			.split('/')
			.filter(Boolean);

		if (!currentLanguage || !currentGeneration || !pokemonId) {
			return;
		}

		if (window.location.pathname !== `/pokemon/${currentLanguage}/${currentGeneration}/${pokemonId}`) {
			return;
		}

		if (currentLanguage === language) {
			return;
		}

		await goto(`/pokemon/${language}/${currentGeneration}/${pokemonId}`);
	}

	onMount(() => {
		language = getSavedLanguage();

		function syncLanguage() {
			language = getSavedLanguage();
		}

		function handleStorage(event: StorageEvent) {
			if (event.key !== 'language') {
				return;
			}

			syncLanguage();
		}

		window.addEventListener('languagechange', syncLanguage);
		window.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('languagechange', syncLanguage);
			window.removeEventListener('storage', handleStorage);
		};
	});
</script>

<form class="border-2 p-2">
	<label for="languages">Choose a language:</label>
	<select id="languages" name="languages" bind:value={language} onchange={handleChange}>
		{#each languages as item}
			<option value={item.code}>{item.label}</option>
		{/each}
	</select>
</form>
