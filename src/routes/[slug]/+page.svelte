<script>
	export let data;
	import { capitalize } from '$lib/utils';

	let pokemon = data.pokemon;
	// console.log(pokemon);
</script>

<svelte:head>
	<title>{capitalize(pokemon.name)}</title>
</svelte:head>

<ul>
	<h1>{capitalize(pokemon.name)}</h1>
	<img src={pokemon.sprites.front_default} alt={pokemon.name} />
</ul>

<ul>
	<li>Height: {pokemon.height}</li>
	<li>Weight: {pokemon.weight}</li>
</ul>

<ul>
	{#each pokemon.types as type}
		<li>{capitalize(type.type.name)}</li>
	{/each}
</ul>

<ul>
	{#each pokemon.abilities as ability}
		<li>{capitalize(ability.ability.name)}</li>
	{/each}
</ul>

<ul>
	{#each pokemon.stats as stat}
		<li>{capitalize(stat.stat.name)}: {stat.base_stat}</li>
	{/each}
</ul>

<style>
	ul {
		margin: 2rem;
	}
</style>
