<script>
	export let data;
	import {
		capitalize,
		hyphenRemover,
		getIdFromUrl,
		pokemonTypes,
		getStatColor,
		getTextColor
	} from '$lib/utils';
	import PokemonEvolutionChain from '../../../components/PokemonEvolutionChain.svelte';
	import SearchBar from '../../../components/SearchBar.svelte';

	let pokemonInfo = data.pokemonInfo;
	let pokemonEvolutionChain = data.pokemonInfo.evolutionChain;
	let searchData = data.searchData;

	// console.log(pokemonInfo.moves);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.name))}</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="my-8 flex items-center">
		<h1 class="text-4xl font-semibold">{capitalize(hyphenRemover(pokemonInfo.name))}</h1>
		<img src={pokemonInfo.sprites.front_default} alt={pokemonInfo.name} class="w-24 ml-4" />
	</div>

	<PokemonEvolutionChain {pokemonEvolutionChain} />

	<div class="my-8 flex justify-center items-center">
		<div class="flex justify-center items-center gap-32">
			<img
				src={pokemonInfo.sprites.other['official-artwork'].front_default}
				alt={pokemonInfo.name}
				class="w-64"
			/>
			<img
				src={pokemonInfo.sprites.other['official-artwork'].front_shiny}
				alt={pokemonInfo.name}
				class="w-64"
			/>
		</div>
	</div>

	<div class="my-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
		<div>
			<h2 class="text-2xl font-semibold">ID</h2>
			<p class="text-lg">{pokemonInfo.id}</p>
		</div>
		<div>
			<h2 class="text-2xl font-semibold">Height</h2>
			<p class="text-lg">{pokemonInfo.height / 10} m</p>
		</div>
		<div>
			<h2 class="text-2xl font-semibold">Weight</h2>
			<p class="text-lg">{pokemonInfo.weight / 10} kg</p>
		</div>

		<div>
			<h2 class="text-2xl font-semibold mb-6">Type(s)</h2>
			<div class="flex flex-wrap gap-2">
				{#each pokemonInfo.types as type}
					{#each pokemonTypes as pokemonType}
						{#if pokemonType.name === type.type.name}
							<p
								style="background-color: {pokemonType.color}; color: {getTextColor(
									pokemonType.color
								)};"
								class="py-1 px-2 rounded-md w-fit"
							>
								{capitalize(type.type.name)}
							</p>
						{/if}
					{/each}
				{/each}
			</div>
		</div>

		<div>
			<h2 class="text-2xl font-semibold">Ability(ies)</h2>
			<div class="flex flex-col gap-2">
				{#each pokemonInfo.abilities as ability}
					<a href={`/ability/${getIdFromUrl(ability.ability.url)}`} class="text-lg"
						>{capitalize(hyphenRemover(ability.ability.name))}</a
					>
				{/each}
			</div>
		</div>

		<div>
			<h2 class="text-2xl font-semibold">Stats</h2>
			<div class="flex flex-col gap-2">
				{#each pokemonInfo.stats as stat}
					<p style="color: {getStatColor(stat.base_stat)};">
						{capitalize(hyphenRemover(stat.stat.name))}: {stat.base_stat}
					</p>
				{/each}
			</div>
		</div>
	</div>

	<div class="my-8">
		<h2 class="text-2xl font-semibold mb-6">Moves</h2>
		<ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each pokemonInfo.moves as move}
				{#await fetch(move.move.url)
					.then((res) => res.json())
					.then( (data) => ({ type: capitalize(data.type.name), power: data.power, category: data.damage_class.name }) )}
					<p class="text-gray-500">Loading...</p>
				{:then moveData}
					<li class="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
						<a href={`/move/${getIdFromUrl(move.move.url)}`} class="block text-center">
							<p class="text-lg font-semibold">{capitalize(hyphenRemover(move.move.name))}</p>
							<p class="text-sm text-gray-500">{moveData.type}</p>
							{#if moveData.power}
								<p class="text-sm text-gray-500">Power: {moveData.power}</p>
							{/if}
							{#if moveData.category}
								<p class="text-sm text-gray-500">{capitalize(moveData.category)} Move</p>
							{/if}
						</a>
					</li>
				{:catch error}
					<p class="text-red-500">Error: {error.message}</p>
				{/await}
			{/each}
		</ul>
	</div>

	<SearchBar data={searchData} />
</div>
