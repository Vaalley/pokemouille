<script lang="ts">
	import { browser } from '$app/environment';
	import { setGeneration, type Generation } from '$lib/generation';
	import { setLanguage, type Language } from '$lib/language';

	let { data } = $props<{
		data: {
			generation: number;
			id: string;
			language: string;
			pokemon: {
				effectiveGeneration: number;
				flavorText: string;
				id: string;
				introducedGeneration: number;
				language: string;
				name: string;
				selectedGeneration: number;
			};
		};
	}>();

	function getPokemonImageUrl(selectedPokemonId: string): string {
		return `https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/pokemon/${selectedPokemonId}.png`;
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		setLanguage(data.language as Language);
		setGeneration(data.generation as Generation);
	});
</script>

<svelte:head>
	<title>{data.pokemon.name ? `${data.pokemon.name} | Pokemouille` : 'Pokemouille'}</title>
</svelte:head>

<section>
	<p>Pokemon id: {data.id}</p>
	<p>Selected language: {data.language}</p>
	<p>Selected generation: {data.pokemon.selectedGeneration}</p>
	<p>Effective generation: {data.pokemon.effectiveGeneration}</p>

	<div>
		<img
			alt={data.pokemon.name}
			class="h-32 w-32 [image-rendering:pixelated]"
			src={getPokemonImageUrl(data.id)}
		/>
		<p><strong>Name:</strong> {data.pokemon.name}</p>
		<p><strong>Description:</strong> {data.pokemon.flavorText}</p>
	</div>
</section>
