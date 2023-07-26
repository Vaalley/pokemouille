<script>
	export let data;
	import { capitalize, hyphenRemover, getStatColor, getExtremeValue } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import Type from '../../../components/Type.svelte';
	import EvolutionChain from '../../../components/EvolutionChain.svelte';

	let pokemonInfo = data.pokemonInfo;
	let evolutionChainData = data.pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy;
	let totalStats = pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats.reduce(
		(sum, stat) => sum + stat.base_stat,
		0
	);
	const searchData = data.searchData;
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
	const pokemonOfficialArtworkUrl = pokemonMainSpriteUrl + '/other/official-artwork/';
	const pokemonShowdownUrl = pokemonMainSpriteUrl + '/other/showdown/';

	console.log(pokemonInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}</title>
</svelte:head>
<!-- TODO: Fix statistics below 30 and above 160 showing not showing properly (instead take min stat of pokemon and max stat of pokemon to determine the boundaries) -->
<!-- TODO: Being able to sort moves by power, accuracy or alphabetically -->
<!-- Pokemon Name -->
<div class="flex gap-6 items-center justify-center text-center mt-6">
	<h1 class="h1 font-bold">
		{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}
	</h1>
	<img
		loading="lazy"
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
<h2 class="container mx-auto h2 font-semibold mt-16">General Info:</h2>
<div class="container mx-auto flex items-center justify-around h-80 mt-6">
	<img
		src={pokemonOfficialArtworkUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
		alt={pokemonInfo.pokemon_v2_pokemon[0].name}
		class="h-80"
		loading="lazy"
	/>
	<div class="max-h-80">
		<div>
			<h3 class="h4 font-semibold">
				ID: <span class="font-medium">{pokemonInfo.pokemon_v2_pokemon[0].id}</span>
			</h3>
		</div>
		<div>
			<h2 class="h4 font-semibold mt-4">
				Height / Weight: <span class="font-medium"
					>{pokemonInfo.pokemon_v2_pokemon[0].height / 10} m / {pokemonInfo.pokemon_v2_pokemon[0]
						.weight / 10} kg</span
				>
			</h2>
		</div>
		<div>
			<h2 class="h4 font-semibold mt-4">Type(s):</h2>
			<div class="flex gap-3 mt-2">
				{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemontypes as type}
					<Type type={type.pokemon_v2_type.name} />
				{/each}
			</div>
		</div>
		<div>
			<h2 class="h4 font-semibold mt-4">Ability(ies):</h2>
			<div class="flex flex-col gap-2">
				{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonabilities as ability}
					<a
						class="hover:text-primary-500 transition-all"
						href="/ability/{ability.pokemon_v2_ability.name}"
					>
						<p class="h5 font-medium">
							-{capitalize(hyphenRemover(ability.pokemon_v2_ability.name))}
							{#if ability.is_hidden}
								<span class="text-primary-500">(hidden)</span>
							{/if}
						</p>
					</a>
				{/each}
			</div>
		</div>
	</div>
	<div>
		<h2 class="h4 font-semibold">Statistics:</h2>
		<p class="h5 font-medium mb-3">
			Total stats: <span class="text-primary-500">{totalStats}</span>
		</p>
		{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats as stat}
			<div class="flex items-center justify-end gap-2 mt-1 h5 font-medium">
				<p
					style="color: {getStatColor(
						stat.base_stat,
						getExtremeValue(pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats, 'lowest'),
						getExtremeValue(pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats, 'highest')
					)};"
				>
					{capitalize(hyphenRemover(stat.pokemon_v2_stat.name))}
				</p>
				<p
					style="color: {getStatColor(
						stat.base_stat,
						getExtremeValue(pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats, 'lowest'),
						getExtremeValue(pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats, 'highest')
					)};"
				>
					{stat.base_stat}
				</p>
				<div class="w-24 bg-tertiary-50 rounded h-4 relative overflow-hidden">
					<div
						class="h-full"
						style="width: {Math.min(
							(stat.base_stat / 160) * 100,
							100
						)}%; background-color: {getStatColor(
							stat.base_stat,
							getExtremeValue(pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats, 'lowest'),
							getExtremeValue(pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats, 'highest')
						)};"
					/>
				</div>
			</div>
		{/each}
	</div>
</div>
<!-- Pokemon Sprites Gallery -->
<div class="container mx-auto mt-28">
	<h2 class="h2 font-semibold">Pokemon Sprites Gallery:</h2>
	<div class="grid grid-cols-2 mt-12">
		<div class="mx-auto">
			<h3 class="h3 text-center font-semibold">Official Shiny Artwork:</h3>
			<img
				src={pokemonOfficialArtworkUrl + '/shiny/' + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
				alt={pokemonInfo.pokemon_v2_pokemon[0].name}
				class="w-64"
				loading="lazy"
			/>
		</div>
		<div class="mx-auto">
			<h3 class="h3 text-center font-semibold">Main Sprites:</h3>
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
<div class="container mx-auto">
	<h2 class="h2 font-semibold">Moves:</h2>
	<p class="h5 font-medium">
		Total moves: <span class="text-primary-500"
			>{pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonmoves.length}</span
		>
	</p>
	<div class="grid grid-cols-5 gap-4 mt-12">
		{#each pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonmoves as move}
			<a
				class="hover:bg-surface-100 hover:text-primary-500 p-6 transition-all"
				href="/move/{move.pokemon_v2_move.name}"
			>
				<div class="flex flex-col items-center text-center">
					<div class="flex gap-4">
						<Type textSize="14" type={move.pokemon_v2_move.pokemon_v2_type.name} />
						<p class="h4 font-semibold">
							{capitalize(hyphenRemover(move.pokemon_v2_move.name))}
						</p>
					</div>
					<div class="mt-4 h5 font-medium">
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
