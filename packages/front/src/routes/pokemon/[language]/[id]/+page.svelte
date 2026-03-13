<script lang="ts">
	import { browser } from '$app/environment';
	import { setLanguage, type Language } from '$lib/language';

	let { data } = $props<{
		data: {
			id: string;
			language: string;
			pokemon: {
				id: string;
				language: string;
				name: string;
				flavorText: string;
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

		const language = data.language as Language;
		setLanguage(language);
	});
</script>

<svelte:head>
	<title>{data.pokemon.name ? `${data.pokemon.name} | Pokemouille` : 'Pokemouille'}</title>
</svelte:head>

<section>
	<p>Pokemon id: {data.id}</p>
	<p>Selected language: {data.language}</p>

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
