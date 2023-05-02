<script>
	export let data;
	import { capitalize } from '$lib/utils';
	import SearchBar from '../components/SearchBar.svelte';

	let pokemon = data.pokemon.pokemon_v2_pokemon;

	// console.log(pokemon);
</script>

<svelte:head>
	<title>🐸 Pokémouille</title>
	<!-- <link rel="icon" href="" /> -->
</svelte:head>

<h1 class="text-7xl text-center mt-8 mb-16 underline">Welcome to Pokémouille</h1>

<div class="grid grid-cols-3 justify-between gap-y-28 text-center -md:grid-cols-2">
	{#each pokemon as pokemon, index}
		<div class="w-48 mx-auto">
			<h2>{capitalize(pokemon.name)}</h2>
			<p>{pokemon.pokemon_v2_pokemontypes_aggregate.nodes[0].pokemon_v2_type.name}</p>
			{#if pokemon.pokemon_v2_pokemontypes_aggregate.nodes[1]}
				<p>{pokemon.pokemon_v2_pokemontypes_aggregate.nodes[1].pokemon_v2_type.name}</p>
			{/if}
			<img
				class="mx-auto"
				src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
					index + 1
				}.png`}
				alt={pokemon.name}
			/>
		</div>
	{/each}
</div>
<SearchBar {data} />
