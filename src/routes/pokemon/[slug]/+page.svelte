<script>
	export let data;
	import { capitalize, hyphenRemover, getStatColor, getExtremeValue } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import Type from '../../../components/Type.svelte';
	import EvolutionChain from '../../../components/EvolutionChain.svelte';
	import { LightSwitch } from '@skeletonlabs/skeleton';

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
	let pokemonMoves = pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonmoves;
	let pokemonStats = pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats;

	// Function to sort moves by power
	function sortByPower() {
		pokemonMoves.sort((a, b) => {
			return (b.pokemon_v2_move.power || 0) - (a.pokemon_v2_move.power || 0);
		});
		pokemonMoves = [...pokemonMoves];
	}

	// Function to sort moves by accuracy
	function sortByAccuracy() {
		pokemonMoves.sort((a, b) => {
			return (b.pokemon_v2_move.accuracy || 0) - (a.pokemon_v2_move.accuracy || 0);
		});
		pokemonMoves = [...pokemonMoves];
	}

	// Function to sort moves alphabetically
	function sortAlphabetically() {
		pokemonMoves.sort((a, b) => {
			const nameA = a.pokemon_v2_move.name.toLowerCase();
			const nameB = b.pokemon_v2_move.name.toLowerCase();
			if (nameA < nameB) return -1;
			if (nameA > nameB) return 1;
			return 0;
		});
		pokemonMoves = [...pokemonMoves];
	}

	// console.log(pokemonMoves);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}</title>
</svelte:head>

<LightSwitch class="absolute top-10 right-10 scale-125" />
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
		{#each pokemonStats as stat}
			<div class="flex items-center justify-end gap-2 mt-1 h5 font-medium">
				<p
					style="color: {getStatColor(
						stat.base_stat,
						getExtremeValue(pokemonStats, 'lowest'),
						getExtremeValue(pokemonStats, 'highest')
					)};"
				>
					{capitalize(hyphenRemover(stat.pokemon_v2_stat.name))}
				</p>
				<p
					style="color: {getStatColor(
						stat.base_stat,
						getExtremeValue(pokemonStats, 'lowest'),
						getExtremeValue(pokemonStats, 'highest')
					)};"
				>
					{stat.base_stat}
				</p>
				<div class="w-24 bg-tertiary-50 h-4 relative overflow-hidden">
					<div
						class="h-full"
						style="width: {Math.min(
							(stat.base_stat / 255) * 100,
							100
						)}%; background-color: {getStatColor(
							stat.base_stat,
							getExtremeValue(pokemonStats, 'lowest'),
							getExtremeValue(pokemonStats, 'highest')
						)};"
					/>
				</div>
				<!-- Add EV yields here -->
				<div class="h5 font-medium">
					<p class="text-base">
						EV yield:
						{stat.effort}
					</p>
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
<!-- TODO: Add moveffecttexts using tippy or similar on hover -->
<!-- Moves -->
<div class="container mx-auto">
	<h2 class="h2 font-semibold">Moves:</h2>
	<p class="h5 font-medium">
		Total moves: <span class="text-primary-500">{pokemonMoves.length}</span>
	</p>
	<div class="mt-6 flex gap-6">
		<button
			class="btn variant-filled rounded-none bg-primary-500 h5 font-semibold"
			on:click={() => sortByPower()}>Sort by Power</button
		>
		<button
			class="btn variant-filled rounded-none bg-primary-500 h5 font-semibold"
			on:click={() => sortByAccuracy()}>Sort by Accuracy</button
		>
		<button
			class="btn variant-filled rounded-none bg-primary-500 h5 font-semibold"
			on:click={() => sortAlphabetically()}>Sort Alphabetically</button
		>
	</div>

	<div class="grid grid-cols-5 gap-4 mt-12">
		{#each pokemonMoves as move}
			<a
				class="btn hover:variant-ringed-primary rounded-none hover:text-primary-500 p-6 transition-all"
				href="/move/{move.pokemon_v2_move.name}"
			>
				<div class="flex flex-col items-center text-center">
					<div class="flex gap-4">
						<Type textSize="14" type={move.pokemon_v2_move.pokemon_v2_type.name} />
						<p class="h4 font-semibold">
							{capitalize(hyphenRemover(move.pokemon_v2_move.name))}
						</p>
						{#if move.pokemon_v2_move.move_damage_class_id == 1}
							<img
								class="object-contain"
								loading="lazy"
								src="https://archives.bulbagarden.net/media/upload/7/71/StatusIC_BW.png"
								alt="physical"
							/>
						{:else if move.pokemon_v2_move.move_damage_class_id == 2}
							<img
								class="object-contain"
								loading="lazy"
								src="https://archives.bulbagarden.net/media/upload/e/ed/PhysicalIC_BW.png"
								alt="physical"
							/>
						{:else if move.pokemon_v2_move.move_damage_class_id == 3}
							<img
								class="object-contain"
								loading="lazy"
								src="https://archives.bulbagarden.net/media/upload/8/8c/SpecialIC_BW.png"
								alt="physical"
							/>
						{/if}
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
