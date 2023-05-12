<script>
	export let data;
	import { capitalize, hyphenRemover, getIdFromUrl } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let pokemonInfo = data.pokemonInfo;
	let searchData = data.searchData;

	// console.log(pokemon);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.name))}</title>
</svelte:head>

<div class="flex flex-col items-center">
	<h1 class="text-7xl text-center mt-8 mb-16 underline font-medium">
		{capitalize(hyphenRemover(pokemonInfo.name))}
	</h1>
	<ul class="text-center text-xl font-medium">
		<li>ID: {pokemonInfo.id}</li>
		<div class="flex items-center gap-8">
			<img
				class="h-60"
				src={pokemonInfo.sprites.other['official-artwork'].front_default}
				alt={pokemonInfo.name}
			/>
			<img class="h-30" src={pokemonInfo.sprites.front_default} alt={pokemonInfo.name} />
			<img
				class="h-60"
				src={pokemonInfo.sprites.other['official-artwork'].front_shiny}
				alt={pokemonInfo.name}
			/>
		</div>
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
				<a href={`/ability/${getIdFromUrl(ability.ability.url)}`}>
					<li>{capitalize(hyphenRemover(ability.ability.name))}</li>
				</a>
			{/each}
		</ul>

		<ul>
			<li class="underline">Stats:</li>
			{#each pokemonInfo.stats as stat}
				<li>{capitalize(hyphenRemover(stat.stat.name))}: {stat.base_stat}</li>
			{/each}
		</ul>
	</div>
	<ul class="grid grid-cols-3 justify-between w-1/2 text-center text-xl font-medium">
		{#each pokemonInfo.moves as move}
			<a href={`/move/${getIdFromUrl(move.move.url)}`}>
				<li>{capitalize(hyphenRemover(move.move.name))}</li>
			</a>
		{/each}
	</ul>
	<SearchBar data={searchData} />
</div>

<style>
	ul {
		margin: 2rem;
	}

	li {
		padding-bottom: 0.5rem;
	}
</style>
