<script>
	export let data;
	import { capitalize, hyphenRemover, getStatColor } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import Type from '../../../components/Type.svelte';
	import EvolutionChain from '../../../components/EvolutionChain.svelte';

	let pokemonInfo = data.pokemonInfo;
	let evolutionChainData = data.pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy;
	const searchData = data.searchData;
	const pokemonOfficialArtworkUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
	const pokemonShowdownUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/';

	console.log(pokemonInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}</title>
</svelte:head>

<div class="bg-gray-100">
	<!-- Pokemon Name -->
	<div class="flex gap-6 items-center justify-center h-32">
		<h1 class="text-5xl font-semibold">
			{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}
		</h1>
		<img
			src={pokemonShowdownUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.gif'}
			alt={pokemonInfo.pokemon_v2_pokemon[0].name}
		/>
	</div>
	<!-- Evolution Chain -->
	<div>
		<EvolutionChain
			{evolutionChainData}
			currentPokemonName={pokemonInfo.pokemon_v2_pokemon[0].name}
		/>
	</div>
	<!-- General Info -->
	<div class="mx-[10%] flex items-center justify-around h-80">
		<img
			src={pokemonOfficialArtworkUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
			alt={pokemonInfo.pokemon_v2_pokemon[0].name}
			class="h-80"
			loading="lazy"
		/>
		<div class="max-h-80 overflow-auto">
			<div>
				<h3 class="text-xl font-semibold">
					ID: <span class="font-medium">{pokemonInfo.pokemon_v2_pokemon[0].id}</span>
				</h3>
			</div>
			<div>
				<h2 class="text-xl font-semibold mt-4">
					Height / Weight: <span class="font-medium"
						>{pokemonInfo.pokemon_v2_pokemon[0].height / 10} m / {pokemonInfo.pokemon_v2_pokemon[0]
							.weight / 10} kg</span
					>
				</h2>
			</div>
			<div>
				<h2 class="text-xl font-semibold mt-4">Type(s):</h2>
				<div class="flex gap-2 mt-2">
					{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemontypes as type}
						<p class="text-lg"><Type textSize="16" type={type.pokemon_v2_type.name} /></p>
					{/each}
				</div>
			</div>
			<div>
				<h2 class="text-xl font-semibold mt-4">Ability(ies):</h2>
				<div class="flex flex-col gap-2">
					{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonabilities as ability}
						<a href="/ability/{ability.pokemon_v2_ability.name}">
							<p class="text-lg font-medium">
								-{capitalize(hyphenRemover(ability.pokemon_v2_ability.name))}
								{#if ability.is_hidden}
									<span class="text-red-600">(hidden)</span>
								{/if}
							</p>
						</a>
					{/each}
				</div>
			</div>
		</div>
		<div>
			<h2 class="text-xl font-semibold mb-4">Statistics:</h2>
			{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats as stat}
				<div class="flex items-center justify-end gap-2 mt-1">
					<p style="color: {getStatColor(stat.base_stat)};">
						{capitalize(hyphenRemover(stat.pokemon_v2_stat.name))}
					</p>
					<p style="color: {getStatColor(stat.base_stat)};">
						{stat.base_stat}
					</p>
					<div class="w-24 bg-gray-200 rounded h-4 relative overflow-hidden">
						<div
							class="h-full"
							style="width: {Math.min(
								(stat.base_stat / 160) * 100,
								100
							)}%; background-color: {getStatColor(stat.base_stat)};"
						/>
					</div>
				</div>
			{/each}
		</div>
	</div>
	<!-- Pokemon Sprites Gallery -->
	<div class="mx-[10%] mt-24">
		<h2 class="text-4xl font-semibold mb-6 underline">Pokemon Sprites Gallery:</h2>
		<div class="grid grid-cols-2">
			<div class="mx-auto">
				<h3 class="text-xl font-semibold">Official Shiny Artwork:</h3>
				<img
					src={pokemonOfficialArtworkUrl +
						'/shiny/' +
						pokemonInfo.pokemon_v2_pokemon[0].id +
						'.png'}
					alt={pokemonInfo.pokemon_v2_pokemon[0].name}
					class="w-64"
					loading="lazy"
				/>
			</div>
			<div class="mx-auto">
				<h3 class="text-xl font-semibold">Main Sprites:</h3>
				<div class="flex items-center">
					<div>
						<img
							src={pokemonMainSpriteUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
							alt={pokemonInfo.pokemon_v2_pokemon[0].name}
							loading="lazy"
							class="w-max h-max"
						/>
						<img
							src={pokemonMainSpriteUrl + '/back/' + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
							alt={pokemonInfo.pokemon_v2_pokemon[0].name}
							loading="lazy"
							class="w-max h-max"
						/>
					</div>
					<div>
						<img
							src={pokemonMainSpriteUrl + '/shiny/' + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
							alt={pokemonInfo.pokemon_v2_pokemon[0].name}
							loading="lazy"
							class="w-max h-max"
						/>
						<img
							src={pokemonMainSpriteUrl +
								'/back/' +
								'/shiny/' +
								pokemonInfo.pokemon_v2_pokemon[0].id +
								'.png'}
							alt={pokemonInfo.pokemon_v2_pokemon[0].name}
							loading="lazy"
							class="w-max h-max"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- Moves -->
	<div class="mx-[10%] mt-24">
		<h2 class="text-4xl font-semibold mb-6 underline">Moves:</h2>
		<div class="grid grid-cols-4 gap-4">
			{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonmoves as move}
				<a
					class="border-2 border-slate-200 hover:bg-slate-50 p-4"
					href="/move/{move.pokemon_v2_move.name}"
				>
					<div class="flex flex-col items-center text-center">
						<div class="flex gap-4">
							<p class="text-xl font-semibold">
								{capitalize(hyphenRemover(move.pokemon_v2_move.name))}
							</p>
							<Type textSize="14" type={move.pokemon_v2_move.pokemon_v2_type.name} />
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
					</div>
				</a>
			{/each}
		</div>
	</div>
	<SearchBar data={searchData} />
</div>
