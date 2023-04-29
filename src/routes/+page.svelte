<script>
	export let data;
	import { capitalize } from '$lib/utils';

	let pokemon = data.pokemon;

	// console.log(pokemon);
</script>

<svelte:head>
	<title>A Basic Title</title>
	<!-- <link rel="icon" href="" /> -->
</svelte:head>

<h1>Welcome to Pokemouille</h1>

<div class="grid grid-cols-3 justify-between gap-y-28 text-center">
	{#each pokemon as pokemon, index}
		<div class="w-48">
			<h2>{capitalize(pokemon.name)}</h2>
			<p>{pokemon.pokemon_v2_pokemontypes_aggregate.nodes[0].pokemon_v2_type.name}</p>
			{#if pokemon.pokemon_v2_pokemontypes_aggregate.nodes[1]}
				<p>{pokemon.pokemon_v2_pokemontypes_aggregate.nodes[1].pokemon_v2_type.name}</p>
			{/if}
			<img
				src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${
					index + 1
				}.png`}
				alt={pokemon.name}
			/>
		</div>
	{/each}
</div>
