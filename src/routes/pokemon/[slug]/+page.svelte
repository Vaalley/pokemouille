<script>
	export let data;
	import { capitalize, hyphenRemover, getStatColor, pokemonTypes } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import tippy from 'tippy.js';
	import 'tippy.js/dist/tippy.css';
	import Type from '../../../components/Type.svelte';
	import EvolutionChain from '../../../components/EvolutionChain.svelte';

	let pokemonInfo = data.pokemonInfo;
	let evolutionChainData = data.pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy;
	const searchData = data.searchData;
	const pokemonOfficialArtworkUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
	let movesDisplayed = [];

	// console.log(pokemonInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}</title>
</svelte:head>

<div class="bg-gray-100">
	<!-- Pokemon Name -->
	<div class="flex gap-6 items-center justify-center">
		<h1 class="text-3xl mt-8 mb-16 font-semibold text-gray-800">
			{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}
		</h1>
	</div>
	<!-- Evolution Chain -->
	<div>
		<EvolutionChain {evolutionChainData} />
	</div>
	<!-- Artworks -->
	<div class="my-8 flex justify-center items-center mb-24">
		<div class="flex justify-center items-center gap-32">
			<div class="flex items-center">
				<img
					src={pokemonOfficialArtworkUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
					alt={pokemonInfo.pokemon_v2_pokemon[0].name}
					class="w-64"
					loading="lazy"
				/>
				<img
					src={pokemonMainSpriteUrl + '/back/' + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
					alt={pokemonInfo.pokemon_v2_pokemon[0].name}
					loading="lazy"
				/>
			</div>
			<div class="flex items-center">
				<img
					src={pokemonOfficialArtworkUrl +
						'/shiny/' +
						pokemonInfo.pokemon_v2_pokemon[0].id +
						'.png'}
					alt={pokemonInfo.pokemon_v2_pokemon[0].name}
					class="w-64"
					loading="lazy"
				/>
				<img
					src={pokemonMainSpriteUrl +
						'/back/' +
						'/shiny/' +
						pokemonInfo.pokemon_v2_pokemon[0].id +
						'.png'}
					alt={pokemonInfo.pokemon_v2_pokemon[0].name}
					loading="lazy"
				/>
			</div>
		</div>
	</div>
	<!-- General Info -->
	<div class="mx-[10%] justify-around grid grid-cols-3 gap-x-60 gap-y-24 mb-12">
		<!-- Pokemon ID -->
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-6 underline">ID:</h2>
			<p class="text-lg">{pokemonInfo.pokemon_v2_pokemon[0].id}</p>
		</div>
		<!-- Pokemon Height -->
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-6 underline">Height:</h2>
			<p class="text-lg">{pokemonInfo.pokemon_v2_pokemon[0].height / 10} m</p>
		</div>
		<!-- Pokemon Weight -->
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-6 underline">Weight:</h2>
			<p class="text-lg">{pokemonInfo.pokemon_v2_pokemon[0].weight / 10} kg</p>
		</div>
		<!-- Pokemon Types -->
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-6 underline">Type(s):</h2>
			<div class="flex gap-2">
				{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemontypes as type}
					<p class="text-lg"><Type type={type.pokemon_v2_type.name} /></p>
				{/each}
			</div>
		</div>
		<!-- Pokemon Abilities -->
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-6 underline">Ability(ies):</h2>
			<div class="flex flex-col gap-2">
				{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonabilities as ability}
					<a href="/ability/{ability.pokemon_v2_ability.name}">
						<p class="text-lg">
							{capitalize(hyphenRemover(ability.pokemon_v2_ability.name))}
							{#if ability.is_hidden}
								<span class="text-red-600">(hidden)</span>
							{/if}
						</p>
					</a>
				{/each}
			</div>
		</div>
		<!-- Pokemon Stats -->
		<div>
			<h2 class="text-2xl font-semibold text-gray-800 mb-6 underline">Statistics:</h2>
			{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats as stat}
				<div class="flex items-center gap-2">
					<div class="w-24 bg-gray-200 rounded-lg h-4 relative overflow-hidden">
						<div
							class="h-full bg-green-400"
							style="width: {Math.min((stat.base_stat / 160) * 100, 100)}%"
						/>
					</div>
					<p style="color: {getStatColor(stat.base_stat)};">
						{capitalize(hyphenRemover(stat.pokemon_v2_stat.name))}: {stat.base_stat}
					</p>
				</div>
			{/each}
		</div>
	</div>
	<!-- Moves -->
	<div class="mx-[10%]">
		<h2 class="text-2xl font-semibold text-gray-800 mb-6 underline">Moves:</h2>
		<div class="grid grid-cols-4 gap-4">
			{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonmoves as move}
				{#if !movesDisplayed.includes(move.pokemon_v2_move.name)}
					<a class="border rounded-lg p-4" href="/move/{move.pokemon_v2_move.name}">
						<div class="flex flex-col items-center text-center">
							<div class="flex gap-4">
								<p class="text-xl font-semibold text-gray-800">
									{capitalize(hyphenRemover(move.pokemon_v2_move.name))}
								</p>
								<Type type={move.pokemon_v2_move.pokemon_v2_type.name} />
							</div>
							<div>
								{#if move.pokemon_v2_move.power}
									<p>Power: {move.pokemon_v2_move.power}</p>
								{/if}
								{#if move.pokemon_v2_move.accuracy}
									<p>Accuracy: {move.pokemon_v2_move.accuracy}</p>
								{/if}
								{#if move.pokemon_v2_move.pp}
									<p>PP: {move.pokemon_v2_move.pp}</p>
								{/if}
								{#if move.pokemon_v2_move.priority}
									<p>Priority: {move.pokemon_v2_move.priority}</p>
								{/if}
							</div>
							<span class="hidden">
								{movesDisplayed.push(move.pokemon_v2_move.name)}
							</span>
						</div>
					</a>
				{/if}
			{/each}
		</div>
	</div>
	<SearchBar data={searchData} />
</div>
