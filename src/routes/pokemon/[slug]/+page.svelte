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
	import { onMount } from 'svelte';

	let pokemonInfo = data.pokemonInfo;
	let pokemonEvolutionChain = data.pokemonInfo.evolutionChain;
	let searchData = data.searchData;
	let moveDataList = [];

	onMount(async () => {
		const movePromises = pokemonInfo.moves.map((move) =>
			fetch(move.move.url).then((response) => response.json())
		);
		moveDataList = await Promise.all(movePromises);
	});

	console.log(pokemonInfo.abilities);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.name))}</title>
</svelte:head>

<div class="bg-gray-100 text-gray-800 min-h-screen">
	<div class="container mx-auto py-8">
		<div class="my-8 flex items-center justify-center">
			<h1 class="text-4xl font-semibold">
				{capitalize(hyphenRemover(pokemonInfo.name))}
			</h1>
			<img src={pokemonInfo.sprites.front_default} alt={pokemonInfo.name} class="w-24 ml-4" />
		</div>

		<PokemonEvolutionChain {pokemonEvolutionChain} />

		<div class="my-8 flex justify-center items-center">
			<div class="flex justify-center items-center gap-32">
				<div class="flex items-center">
					<img
						src={pokemonInfo.sprites.other['official-artwork'].front_default}
						alt={pokemonInfo.name}
						class="w-64"
					/>
					<img src={pokemonInfo.sprites.back_default} alt={pokemonInfo.name} />
				</div>
				<div class="flex items-center">
					<img
						src={pokemonInfo.sprites.other['official-artwork'].front_shiny}
						alt={pokemonInfo.name}
						class="w-64"
					/>
					<img src={pokemonInfo.sprites.back_shiny} alt={pokemonInfo.name} />
				</div>
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
									class="py-1 px-2 rounded-md w-fit hover:scale-105 transition-transform duration-300"
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
						<a
							href={`/ability/${getIdFromUrl(ability.ability.url)}`}
							class="text-lg text-blue-500 hover:text-blue-800 hover:bg-blue-200 bg-blue-100 w-fit p-2 transition-colors duration-300"
							>{capitalize(hyphenRemover(ability.ability.name))}
							{#if ability.is_hidden}
								<span class="text-gray-500">(hidden ability)</span>
							{/if}
						</a>
					{/each}
				</div>
			</div>

			<div>
				<h2 class="text-2xl font-semibold">Stats</h2>
				<div class="flex flex-col gap-2">
					{#each pokemonInfo.stats as stat}
						<div class="flex items-center gap-2">
							<div class="w-24 bg-gray-200 rounded-lg h-4 relative overflow-hidden">
								<div
									class="h-full bg-green-400"
									style="width: {Math.min((stat.base_stat / 160) * 100, 100)}%"
								/>
							</div>
							<p style="color: {getStatColor(stat.base_stat)};">
								{capitalize(hyphenRemover(stat.stat.name))}: {stat.base_stat}
							</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="my-8">
			<h2 class="text-2xl font-semibold mb-6">Moves</h2>
			<ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{#each pokemonInfo.moves as move, i}
					{#if moveDataList[i]}
						<li
							class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 transform hover:scale-105 transition-transform duration-300"
						>
							<a href={`/move/${getIdFromUrl(move.move.url)}`} class="block text-center">
								<p class="text-lg font-semibold">{capitalize(hyphenRemover(move.move.name))}</p>
								{#if moveDataList[i].type}
									<p class="text-sm text-gray-500">Type: {capitalize(moveDataList[i].type.name)}</p>
								{/if}
								{#if moveDataList[i].power}
									<p class="text-sm text-gray-500">Power: {moveDataList[i].power}</p>
								{/if}
								{#if moveDataList[i].accuracy}
									<p class="text-sm text-gray-500">Accuracy: {moveDataList[i].accuracy}%</p>
								{/if}
								{#if moveDataList[i].damage_class}
									<p class="text-sm text-gray-500">
										{capitalize(moveDataList[i].damage_class.name)} Move
									</p>
								{/if}
							</a>
						</li>
					{/if}
				{/each}
			</ul>
		</div>

		<SearchBar data={searchData} />
	</div>
</div>
