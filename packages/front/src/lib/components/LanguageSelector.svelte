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

		const parts = window.location.pathname.split('/').filter(Boolean);

		if (parts[0] === 'pokemon' && parts.length === 4) {
			const [, currentLanguage, currentGeneration, pokemonId] = parts;
			if (currentLanguage !== language) {
				await goto(`/pokemon/${language}/${currentGeneration}/${pokemonId}`);
			}
			return;
		}

		if (parts[0] === 'ability' && parts.length === 3) {
			const [, currentLanguage, abilityId] = parts;
			if (currentLanguage !== language) {
				await goto(`/ability/${language}/${abilityId}`);
			}
			return;
		}
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
