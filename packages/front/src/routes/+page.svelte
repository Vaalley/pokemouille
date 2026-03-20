<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSavedGeneration } from '$lib/generation';
	import { getSavedLanguage } from '$lib/language';

	async function openPokedex() {
		await goto(`/pokemon/${getSavedLanguage()}/${getSavedGeneration()}`);
	}
</script>

<svelte:head>
	<title>Pokemouille</title>
</svelte:head>

<section class="mx-auto max-w-sm space-y-4 px-4 py-12 text-center">
	<h1 class="text-3xl font-bold">Pokemouille</h1>
	<p class="text-sm text-gray-500">Type any letter to search for a Pokémon.</p>
	<div class="flex justify-center gap-3">
		<button class="rounded border px-4 py-2 text-sm hover:bg-gray-50" type="button" onclick={openPokedex}>
			Browse Pokédex
		</button>
	</div>
</section>
