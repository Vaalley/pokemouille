<script>
	// Import statements
	import {
		capitalize,
		hyphenRemover,
		getStatColor,
		getExtremeValue,
		pokemonTypes as types
	} from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import Type from '../../../components/Type.svelte';
	import EvolutionChain from '../../../components/EvolutionChain.svelte';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { popup } from '@skeletonlabs/skeleton';

	// Variable declarations
	export let data;
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
	let pokemonAbilities = pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonabilities;
	let pokemonTypes = pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemontypes;
	let pokemonStats = pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonstats;
	let pokemonEggGroups =
		pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy.pokemon_v2_pokemonegggroups;

	const popupHover = {
		event: 'hover',
		target: 'popupHover',
		placement: 'top'
	};

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

	function getTypeInfo(typeName) {
		return types.find((type) => type.name === typeName);
	}

	function combineEffectiveness(type1, type2) {
		const type1Info = getTypeInfo(type1);
		const type2Info = getTypeInfo(type2);

		const combined = {
			weak: [...type1Info.defending.weak, ...type2Info.defending.weak],
			resist: [...type1Info.defending.resist, ...type2Info.defending.resist],
			immune: [...type1Info.defending.immune, ...type2Info.defending.immune]
		};

		return combined;
	}

	// console.log(pokemonInfo);
</script>

<svelte:head>
	<title>Pokémouille | {capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}</title>
</svelte:head>

<LightSwitch class="absolute right-10 top-10 scale-125" />
<SearchBar data={searchData} />

<!-- Pokemon Name -->
<div class="mt-6 flex items-center justify-center gap-6 text-center">
	<img
		loading="lazy"
		src={pokemonShowdownUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.gif'}
		alt={pokemonInfo.pokemon_v2_pokemon[0].name}
	/>

	<h1
		class="h1 font-bold"
		style="color: {pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy.is_legendary
			? 'gold'
			: pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy.is_mythical
			? 'SlateBlue'
			: ''}"
	>
		{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}
		<span class="h4 text-tertiary-800">
			- Introduced in gen {pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy
				.pokemon_v2_generation.id}
		</span>
	</h1>
</div>
<!-- Evolution Chain -->
<div>
	<EvolutionChain
		{evolutionChainData}
		currentPokemonName={pokemonInfo.pokemon_v2_pokemon[0].name}
	/>
</div>
<!-- General Info -->
<h2 class="container h2 mx-auto mt-16 font-semibold">General Info:</h2>
<div class="container mx-auto mt-6 flex h-80 items-center justify-around">
	<img
		src={pokemonOfficialArtworkUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
		alt={pokemonInfo.pokemon_v2_pokemon[0].name}
		class="h-80"
		loading="lazy"
	/>
	<div class="max-h-80">
		<!-- ID -->
		<div>
			<h3 class="h4 font-semibold">
				ID: <span class="font-medium">{pokemonInfo.pokemon_v2_pokemon[0].id}</span>
			</h3>
		</div>
		<!-- Height / Weight -->
		<div>
			<h2 class="h4 mt-4 font-semibold">
				Height / Weight: <span class="font-medium"
					>{pokemonInfo.pokemon_v2_pokemon[0].height / 10} m / {pokemonInfo.pokemon_v2_pokemon[0]
						.weight / 10} kg</span
				>
			</h2>
		</div>
		<!-- Types -->
		<div>
			<h2 class="h4 mt-4 font-semibold">Type(s):</h2>
			<div class="mt-2 flex gap-3" use:popup={popupHover}>
				{#each pokemonTypes as type}
					<Type type={type.pokemon_v2_type.name} />
				{/each}
			</div>
			<div class="variant-filled-primary p-3" data-popup="popupHover">
				{#if pokemonTypes.length === 1}
					<p>
						<b>Defending:</b><br />
						{#each getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.immune as immune}
							{capitalize(immune)} (immune) <br />
						{/each}
						{#each getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.weak as weakness}
							{#if !getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.immune.includes(weakness)}
								{capitalize(weakness)} (2x weak) <br />
							{/if}
						{/each}
						{#each getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.resist as resist}
							{capitalize(resist)} (0.5x resistant) <br />
						{/each}
					</p>
				{:else}
					<p>
						<b>Combined Defending:</b><br />
						{#each Array.from(new Set( [...combineEffectiveness(pokemonTypes[0].pokemon_v2_type.name, pokemonTypes[1].pokemon_v2_type.name).weak, ...combineEffectiveness(pokemonTypes[1].pokemon_v2_type.name, pokemonTypes[0].pokemon_v2_type.name).weak] )) as weakness}
							{#if !getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.immune.includes(weakness) && !getTypeInfo(pokemonTypes[1].pokemon_v2_type.name).defending.immune.includes(weakness)}
								{#if getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.weak.includes(weakness) && getTypeInfo(pokemonTypes[1].pokemon_v2_type.name).defending.weak.includes(weakness)}
									{capitalize(weakness)} (4x weak) <br />
								{:else if (getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.weak.includes(weakness) || getTypeInfo(pokemonTypes[1].pokemon_v2_type.name).defending.weak.includes(weakness)) && !(getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.resist.includes(weakness) || getTypeInfo(pokemonTypes[1].pokemon_v2_type.name).defending.resist.includes(weakness))}
									{capitalize(weakness)} (2x weak) <br />
								{/if}
							{/if}
						{/each}
						{#each Array.from(new Set( [...combineEffectiveness(pokemonTypes[0].pokemon_v2_type.name, pokemonTypes[1].pokemon_v2_type.name).resist, ...combineEffectiveness(pokemonTypes[1].pokemon_v2_type.name, pokemonTypes[0].pokemon_v2_type.name).resist] )) as resist}
							{#if !getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.immune.includes(resist) && !getTypeInfo(pokemonTypes[1].pokemon_v2_type.name).defending.immune.includes(resist)}
								{#if getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.resist.includes(resist) && getTypeInfo(pokemonTypes[1].pokemon_v2_type.name).defending.resist.includes(resist)}
									{capitalize(resist)} (0.25x resistant) <br />
								{:else if (getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.resist.includes(resist) || getTypeInfo(pokemonTypes[1].pokemon_v2_type.name).defending.resist.includes(resist)) && !(getTypeInfo(pokemonTypes[0].pokemon_v2_type.name).defending.weak.includes(resist) || getTypeInfo(pokemonTypes[1].pokemon_v2_type.name).defending.weak.includes(resist))}
									{capitalize(resist)} (0.5x resistant) <br />
								{/if}
							{/if}
						{/each}
						{#each combineEffectiveness(pokemonTypes[0].pokemon_v2_type.name, pokemonTypes[1].pokemon_v2_type.name).immune as immune}
							{capitalize(immune)} (immune) <br />
						{/each}
					</p>
				{/if}
			</div>
		</div>
		<!-- Abilities -->
		<div>
			<h2 class="h4 mt-4 font-semibold">Ability(ies):</h2>
			<div class="flex flex-col gap-1">
				{#each pokemonAbilities as ability}
					<a
						class="transition-all hover:text-primary-500"
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
		<!-- Egg group -->
		<div>
			<h2 class="h4 mt-4 font-semibold">Egg group(s):</h2>
			<div class="flex gap-2">
				{#each pokemonEggGroups as egggroup, index}
					<p class="h5 font-medium">
						{capitalize(hyphenRemover(egggroup.pokemon_v2_egggroup.name))}
						{#if index !== pokemonEggGroups.length - 1}
							{' & '}
						{/if}
					</p>
				{/each}
			</div>
		</div>
	</div>
	<div>
		<h2 class="h4 font-semibold">Statistics:</h2>
		<p class="h5 mb-3 font-medium">
			Total stats: <span class="text-primary-500">{totalStats}</span>
		</p>
		{#each pokemonStats as stat}
			<div class="h5 mt-1 flex items-center justify-end gap-2 font-medium">
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
				<div class="relative h-4 w-24 overflow-hidden bg-tertiary-50">
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
				<div class="h5 text-base font-medium">
					<p>
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
	<div class="mt-12 grid grid-cols-2">
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
						class="h-max w-max"
					/>
					<img
						src={pokemonMainSpriteUrl + '/back/' + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
						alt={pokemonInfo.pokemon_v2_pokemon[0].name}
						loading="lazy"
						class="h-max w-max"
					/>
				</div>
				<div>
					<img
						src={pokemonMainSpriteUrl + '/shiny/' + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
						alt={pokemonInfo.pokemon_v2_pokemon[0].name}
						loading="lazy"
						class="h-max w-max"
					/>
					<img
						src={pokemonMainSpriteUrl +
							'/back/' +
							'/shiny/' +
							pokemonInfo.pokemon_v2_pokemon[0].id +
							'.png'}
						alt={pokemonInfo.pokemon_v2_pokemon[0].name}
						loading="lazy"
						class="h-max w-max"
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
		Total moves: <span class="text-primary-500">{pokemonMoves.length}</span>
	</p>
	<div class="mt-6 flex gap-6">
		<button
			class="h5 btn variant-filled rounded-none bg-primary-500 font-semibold"
			on:click={() => sortByPower()}>Sort by Power</button
		>
		<button
			class="h5 btn variant-filled rounded-none bg-primary-500 font-semibold"
			on:click={() => sortByAccuracy()}>Sort by Accuracy</button
		>
		<button
			class="h5 btn variant-filled rounded-none bg-primary-500 font-semibold"
			on:click={() => sortAlphabetically()}>Sort Alphabetically</button
		>
	</div>

	<div class="mt-12 grid grid-cols-4 gap-4">
		{#each pokemonMoves as move}
			<a
				class="btn rounded-none p-6 transition-all hover:variant-ringed-primary hover:text-primary-500"
				href="/move/{move.pokemon_v2_move.name}"
			>
				<div class="flex flex-col items-center text-center">
					<div class="flex items-center gap-4">
						<Type textSize="14" type={move.pokemon_v2_move.pokemon_v2_type.name} />
						<p class="h4 font-semibold">
							{capitalize(hyphenRemover(move.pokemon_v2_move.name))}
						</p>
						{#if move.pokemon_v2_move.move_damage_class_id == 1}
							<img
								class="object-contain"
								loading="lazy"
								src="https://img.pokemondb.net/images/icons/move-status.png"
								alt="status"
								width="24"
							/>
						{:else if move.pokemon_v2_move.move_damage_class_id == 2}
							<img
								class="object-contain"
								loading="lazy"
								src="https://img.pokemondb.net/images/icons/move-physical.png"
								alt="physical"
								width="24"
							/>
						{:else if move.pokemon_v2_move.move_damage_class_id == 3}
							<img
								class="object-contain"
								loading="lazy"
								src="https://img.pokemondb.net/images/icons/move-special.png"
								alt="special"
								width="24"
							/>
						{/if}
					</div>
					<div class="h5 mt-4 font-medium">
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
