<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../components/SearchBar.svelte';

	let pokemon = data.pokemon;
	console.log(pokemon);
</script>

<svelte:head>
	<title>{capitalize(pokemon.name)}</title>
</svelte:head>

<ul>
	<h1>{capitalize(pokemon.name)}</h1>
	<img
		class="h-48"
		src={pokemon.sprites.other['official-artwork'].front_default}
		alt={pokemon.name}
	/>
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
		<li>{hyphenRemover(capitalize(ability.ability.name))}</li>
	{/each}
</ul>

<ul>
	{#each pokemon.stats as stat}
		<li>{hyphenRemover(capitalize(stat.stat.name))}: {stat.base_stat}</li>
	{/each}
</ul>
<SearchBar {data} />

<style>
	ul {
		margin: 2rem;
	}
</style>
