<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../components/SearchBar.svelte';

	let pokemon = data.pokemon;

	// console.log(pokemon);
</script>

<svelte:head>
	<title>{capitalize(pokemon.name)}</title>
</svelte:head>

<div class="flex flex-col items-center">
	<h1 class="text-7xl text-center mt-8 mb-16 underline font-medium">{capitalize(pokemon.name)}</h1>
	<ul>
		<img
			class=" h-60"
			src={pokemon.sprites.other['official-artwork'].front_default}
			alt={pokemon.name}
		/>
	</ul>

	<div class="flex text-2xl font-medium">
		<ul>
			<li class="underline">Height and Weight:</li>
			<li>Height: {pokemon.height / 10} m</li>
			<li>Weight: {pokemon.weight / 10} kg</li>
		</ul>

		<ul>
			<li class="underline">Types:</li>
			{#each pokemon.types as type}
				<li>{capitalize(type.type.name)}</li>
			{/each}
		</ul>

		<ul>
			<li class="underline">Abilities:</li>
			{#each pokemon.abilities as ability}
				<li>{hyphenRemover(capitalize(ability.ability.name))}</li>
			{/each}
		</ul>

		<ul>
			<li class="underline">Stats:</li>
			{#each pokemon.stats as stat}
				<li>{hyphenRemover(capitalize(stat.stat.name))}: {stat.base_stat}</li>
			{/each}
		</ul>
	</div>
	<SearchBar {data} />
</div>

<style>
	ul {
		margin: 2rem;
	}

	li {
		padding-bottom: 0.5rem;
	}
</style>
