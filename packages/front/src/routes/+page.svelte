<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSavedGeneration } from '$lib/generation';
	import { getSavedLanguage } from '$lib/language';

	async function openStarterPokemon() {
		await goto(`/pokemon/${getSavedLanguage()}/${getSavedGeneration()}/1`);
	}
</script>

<svelte:head>
	<title>Pokemouille</title>
</svelte:head>

<section class="p-4">
	<p>Type any letter to open Pokémon search.</p>
	<button class="border p-2" type="button" onclick={openStarterPokemon}>
		Open Bulbasaur
	</button>
</section>
