<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSavedGeneration } from '$lib/generation';
	import { searchState } from '$lib/pokemon-search.svelte';

	const { pokemonList, abilityList, moveList } = $derived(searchState);

	function pickRandom<T>(list: T[]): T | null {
		if (list.length === 0) return null;
		return list[Math.floor(Math.random() * list.length)];
	}

	function lang() {
		return searchState.listLanguage || "en";
	}

	async function goRandomPokemon() {
		const pick = pickRandom(pokemonList);
		if (!pick) return;
		await goto(`/pokemon/${lang()}/${getSavedGeneration()}/${pick.id}`);
	}

	async function goRandomAbility() {
		const pick = pickRandom(abilityList);
		if (!pick) return;
		await goto(`/ability/${lang()}/${getSavedGeneration()}/${pick.id}`);
	}

	async function goRandomMove() {
		const pick = pickRandom(moveList);
		if (!pick) return;
		await goto(`/move/${lang()}/${getSavedGeneration()}/${pick.id}`);
	}
</script>

<svelte:head>
	<title>Pokemouille</title>
</svelte:head>

<section class="mx-auto max-w-xl space-y-10 px-4 py-12">
	<div class="text-center space-y-2">
		<h1 class="text-4xl font-bold">Pokemouille</h1>
		<p class="text-sm text-gray-500">Type any letter to search. Click a stat for a random entry.</p>
	</div>

	<div class="grid grid-cols-3 gap-4 text-center">
		<button
			type="button"
			class="flex flex-col items-center gap-1 border-2 p-6 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-default"
			onclick={goRandomPokemon}
			disabled={pokemonList.length === 0}
		>
			<span class="text-4xl font-bold">{pokemonList.length || '—'}</span>
			<span class="text-sm text-gray-500">Pokémon</span>
		</button>

		<button
			type="button"
			class="flex flex-col items-center gap-1 border-2 p-6 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-default"
			onclick={goRandomAbility}
			disabled={abilityList.length === 0}
		>
			<span class="text-4xl font-bold">{abilityList.length || '—'}</span>
			<span class="text-sm text-gray-500">Abilities</span>
		</button>

		<button
			type="button"
			class="flex flex-col items-center gap-1 border-2 p-6 hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-default"
			onclick={goRandomMove}
			disabled={moveList.length === 0}
		>
			<span class="text-4xl font-bold">{moveList.length || '—'}</span>
			<span class="text-sm text-gray-500">Moves</span>
		</button>
	</div>
</section>
