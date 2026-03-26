<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		generations,
		getSavedGeneration,
		setGeneration,
		type Generation,
	} from '$lib/generation';
	import { languages } from '$lib/language';

	let generation = $state<Generation>(1);
	let minimumGeneration = $derived(
		((page.data.pokemon?.introducedGeneration ??
			page.data.move?.generationId ??
			page.data.ability?.generationId) as Generation) ?? 1,
	);
	let availableGenerations = $derived(
		generations.filter((item) => item.value >= minimumGeneration),
	);

	async function handleChange() {
		setGeneration(generation);

		const parts = window.location.pathname.split('/').filter(Boolean);

		if (parts[0] === 'pokemon' && parts.length === 4) {
			const [, currentLanguage, currentGeneration, pokemonId] = parts;
			if (Number(currentGeneration) !== generation) {
				await goto(`/pokemon/${currentLanguage}/${generation}/${pokemonId}`);
			}
			return;
		}

		if (parts[0] === 'move' && parts.length === 4) {
			const [, currentLanguage, currentGeneration, moveId] = parts;
			if (Number(currentGeneration) !== generation) {
				await goto(`/move/${currentLanguage}/${generation}/${moveId}`);
			}
			return;
		}

		if (parts[0] === 'ability' && parts.length === 4) {
			const [, currentLanguage, currentGeneration, abilityId] = parts;
			if (Number(currentGeneration) !== generation) {
				await goto(`/ability/${currentLanguage}/${generation}/${abilityId}`);
			}
			return;
		}
	}

	onMount(() => {
		generation = getSavedGeneration();

		function syncGeneration() {
			generation = getSavedGeneration();
		}

		function handleStorage(event: StorageEvent) {
			if (event.key !== 'generation') {
				return;
			}

			syncGeneration();
		}

		window.addEventListener('generationchange', syncGeneration);
		window.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('generationchange', syncGeneration);
			window.removeEventListener('storage', handleStorage);
		};
	});
</script>

<form class="border-2 p-2">
	<label for="generations">Choose a generation:</label>
	<select id="generations" name="generations" bind:value={generation} onchange={handleChange}>
		{#each availableGenerations as item}
			<option value={item.value}>{item.label}</option>
		{/each}
	</select>
</form>
