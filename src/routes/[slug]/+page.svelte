<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../components/SearchBar.svelte';

	let pokemonInfo = data.pokemonInfo;

	// console.log(pokemonInfo);
</script>

<svelte:head>
	<title>{capitalize(pokemonInfo.name)}</title>
</svelte:head>

<div class="flex flex-col items-center">
	<h1 class="text-7xl text-center mt-8 mb-16 underline font-medium">
		{capitalize(pokemonInfo.name)}
	</h1>
	<ul>
		<img
			class=" h-60"
			src={pokemonInfo.sprites.other['official-artwork'].front_default}
			alt={pokemonInfo.name}
		/>
	</ul>

	<div class="flex text-2xl font-medium">
		<ul>
			<li class="underline">Height and Weight:</li>
			<li>Height: {pokemonInfo.height / 10} m</li>
			<li>Weight: {pokemonInfo.weight / 10} kg</li>
		</ul>

		<ul>
			<li class="underline">Type(s):</li>
			{#each pokemonInfo.types as type}
				<li>{capitalize(type.type.name)}</li>
			{/each}
		</ul>

		<ul>
			<li class="underline">Ability(ies):</li>
			{#each pokemonInfo.abilities as ability}
				<li>{hyphenRemover(capitalize(ability.ability.name))}</li>
			{/each}
		</ul>

		<ul>
			<li class="underline">Stats:</li>
			{#each pokemonInfo.stats as stat}
				<li>{hyphenRemover(capitalize(stat.stat.name))}: {stat.base_stat}</li>
			{/each}
		</ul>
	</div>
	<!-- TODO: Add the search bar and make it work just like in the homepage (using sveltekit stores?) -->
</div>

<style>
	ul {
		margin: 2rem;
	}

	li {
		padding-bottom: 0.5rem;
	}
</style>
