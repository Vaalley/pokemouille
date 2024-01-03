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

	const popupClick = {
		event: 'click',
		target: 'popupClick',
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

	// function to sort moves by level learned if level != 0
	function sortLevel() {
		pokemonMoves.sort((a, b) => {
			return (b.level || 0) - (a.level || 0);
		});
		pokemonMoves = [...pokemonMoves];
	}

	// Function to get type info
	function getTypeInfo(typeName) {
		return types.find((type) => type.name === typeName);
	}

	// Function to combine defending types
	function combineDefendingTypes() {
		const type1Info = getTypeInfo(pokemonTypes[0].pokemon_v2_type.name);
		const type2Info = getTypeInfo(pokemonTypes[1].pokemon_v2_type.name);

		const combined = {
			weaknesses: [...type1Info.defending.weak, ...type2Info.defending.weak],
			resistances: [...type1Info.defending.resist, ...type2Info.defending.resist],
			immunities: [...type1Info.defending.immune, ...type2Info.defending.immune]
		};

		let html = '';

		// Group weaknesses together
		html += `<h4 class="h4 font-bold">Weaknesses:</h4>`;
		for (const weakness of Array.from(new Set(combined.weaknesses))) {
			if (
				!type1Info.defending.immune.includes(weakness) &&
				!type2Info.defending.immune.includes(weakness)
			) {
				if (
					type1Info.defending.weak.includes(weakness) &&
					type2Info.defending.weak.includes(weakness)
				) {
					html += `${capitalize(weakness)} (4x) <br />`;
				} else if (
					(type1Info.defending.weak.includes(weakness) ||
						type2Info.defending.weak.includes(weakness)) &&
					!(
						type1Info.defending.resist.includes(weakness) ||
						type2Info.defending.resist.includes(weakness)
					)
				) {
					html += `${capitalize(weakness)} (2x) <br />`;
				}
			}
		}

		// Group resistances together
		html += `<h4 class="h4 font-bold mt-2">Resistances:</h4>`;
		for (const resistance of Array.from(new Set(combined.resistances))) {
			if (
				!type1Info.defending.immune.includes(resistance) &&
				!type2Info.defending.immune.includes(resistance)
			) {
				if (
					type1Info.defending.resist.includes(resistance) &&
					type2Info.defending.resist.includes(resistance)
				) {
					html += `${capitalize(resistance)} (0.25x) <br />`;
				} else if (
					(type1Info.defending.resist.includes(resistance) ||
						type2Info.defending.resist.includes(resistance)) &&
					!(
						type1Info.defending.weak.includes(resistance) ||
						type2Info.defending.weak.includes(resistance)
					)
				) {
					html += `${capitalize(resistance)} (0.5x) <br />`;
				}
			}
		}

		// Display immunities separately
		html += `<h4 class="h4 font-bold mt-2">Immunities:</h4>`;
		for (const immunity of Array.from(new Set(combined.immunities))) {
			html += `${capitalize(immunity)} (immune) <br />`;
		}

		return html;
	}

	// Function to combine defending types for mono-type Pokémon
	function combineMonoDefendingTypes() {
		const typeInformation = getTypeInfo(pokemonTypes[0].pokemon_v2_type.name);
		const { weak, resist, immune } = typeInformation.defending;

		let html = '';

		function generateHeader(title) {
			html += `<h4 class="h4 font-bold">${title}:</h4>`;
		}

		generateHeader('Weaknesses');
		for (const weakness of weak) {
			html += `${capitalize(weakness)} (2x) <br />`;
		}

		generateHeader('Resistances');
		for (const resistance of resist) {
			html += `${capitalize(resistance)} (0.5x) <br />`;
		}

		generateHeader('Immunities');
		for (const immunity of immune) {
			html += `${capitalize(immunity)} (immune) <br />`;
		}

		return html;
	}

	console.log(pokemonAbilities);
</script>

<svelte:head>
	<title>Pokémouille | {capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}</title>
	<link rel="icon" href="/favicon.ico" />
	<meta
		name="description"
		content="In a Pokemon page you can expect to find information about the Pokemon's moves, abilities, stats, and more!"
	/>
</svelte:head>

<SearchBar data={searchData} />

<main>
	<!-- Pokemon Intro Name -->
	<section class="mt-5 flex items-center justify-center gap-5 -md:flex-col">
		<img
			loading="lazy"
			src={pokemonShowdownUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.gif'}
			alt={pokemonInfo.pokemon_v2_pokemon[0].name}
		/>
		<h1
			class="h1 p-2 font-bold"
			style={`
							${
								pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy.is_legendary
									? 'background-image: linear-gradient(to bottom right, red, yellow);'
									: pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy.is_mythical
									? 'background-image: linear-gradient(to bottom right, violet, purple);'
									: ''
							}
							-webkit-background-clip: text;
							-moz-background-clip: text;
							background-clip: text;
							color: ${
								pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy.is_legendary ||
								pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy.is_mythical
									? 'transparent'
									: ''
							};
							-webkit-box-decoration-break: clone;
							box-decoration-break: clone;
					`}
		>
			{capitalize(hyphenRemover(pokemonInfo.pokemon_v2_pokemon[0].name))}
			<br class="hidden -sm:block" />
			<span class="text-base font-medium text-surface-400">
				- Introduced in gen {pokemonInfo.pokemon_v2_pokemon[0].pokemon_v2_pokemonspecy
					.pokemon_v2_generation.id}
			</span>
		</h1>
	</section>
	<!-- Evolution Chain -->
	<EvolutionChain
		{evolutionChainData}
		currentPokemonName={pokemonInfo.pokemon_v2_pokemon[0].name}
	/>
	<!-- General Info -->
	<section class="container mx-auto mt-16">
		<h2 class="h2 font-semibold">General Info:</h2>
		<div class="mt-5 flex flex-wrap items-center justify-between p-5 -md:mx-5">
			<div class="-md:mx-auto">
				<img
					src={pokemonOfficialArtworkUrl + pokemonInfo.pokemon_v2_pokemon[0].id + '.png'}
					alt={pokemonInfo.pokemon_v2_pokemon[0].name}
					loading="lazy"
					class="max-h-96"
				/>
			</div>
			<div>
				<!-- ID -->
				<div>
					<h3 class="h3 font-semibold">
						ID: <span class="font-medium">{pokemonInfo.pokemon_v2_pokemon[0].id}</span>
					</h3>
				</div>
				<!-- Height / Weight -->
				<div>
					<h3 class="h3 mt-4 font-semibold">
						Height / Weight: <span class="font-medium"
							>{pokemonInfo.pokemon_v2_pokemon[0].height / 10} m / {pokemonInfo
								.pokemon_v2_pokemon[0].weight / 10} kg</span
						>
					</h3>
				</div>
				<!-- Types -->
				<div>
					<h3 class="h3 mt-4 font-semibold">
						{pokemonTypes.length === 1 ? 'Type:' : 'Types:'}
					</h3>
					<button class="variant-filled btn mt-2 font-semibold" use:popup={popupClick}
						>Weaknesses / Resistances</button
					>
					<div class="mt-2 flex w-fit gap-3">
						{#each pokemonTypes as type}
							<Type type={type.pokemon_v2_type.name} />
						{/each}
					</div>
					<div class="card variant-filled-primary p-3" data-popup="popupClick">
						{#if pokemonTypes.length === 1}
							<p>{@html combineMonoDefendingTypes()}</p>
						{:else}
							<p>{@html combineDefendingTypes()}</p>
						{/if}
					</div>
				</div>
				<!-- Abilities -->
				<div>
					<h3 class="h3 mt-4 font-semibold">Ability(ies):</h3>
					<div class="flex flex-col gap-1">
						{#each pokemonAbilities as ability}
							<a
								class="transition-all hover:text-primary-500"
								href="/ability/{ability.pokemon_v2_ability.name}"
							>
								<p class="font-medium">
									-{capitalize(hyphenRemover(ability.pokemon_v2_ability.name))}
									{#if ability.is_hidden}
										<span class="text-primary-500">(hidden)</span>
									{/if}
								</p>
								<p class="max-w-sm text-surface-400">
									{ability.pokemon_v2_ability.pokemon_v2_abilityeffecttexts[0].short_effect}
								</p>
							</a>
						{/each}
					</div>
				</div>
				<!-- Egg group -->
				<div>
					<h3 class="h3 mt-4 font-semibold">Egg group(s):</h3>
					<div class="flex gap-2">
						{#each pokemonEggGroups as egggroup, index}
							<p class="font-medium">
								{capitalize(hyphenRemover(egggroup.pokemon_v2_egggroup.name))}
								{#if index !== pokemonEggGroups.length - 1}
									{' & '}
								{/if}
							</p>
						{/each}
					</div>
				</div>
			</div>
			<!-- Statistics -->
			<div class="-md:mt-5">
				<h3 class="h3 font-semibold">Statistics:</h3>
				<p class="font-medium">
					Total stats: <span class="text-primary-500">{totalStats}</span>
				</p>
				{#each pokemonStats as stat}
					<div class="mt-1 flex items-center justify-start gap-2 font-medium">
						<div class="flex w-48 gap-2 -md:w-32 -md:text-sm">
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
						</div>
						<div class="relative h-4 w-24 overflow-hidden bg-surface-100 -md:w-16">
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
						<div class="font-medium -md:text-sm">
							<p>
								EV:
								{stat.effort}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
	<!-- Pokemon Sprites Gallery -->
	<section class="container mx-auto mt-16">
		<h2 class="h2 font-semibold">Pokemon Sprites Gallery:</h2>
		<div class="mt-12 flex flex-wrap justify-around">
			<div class="">
				<h3 class="h3 text-center font-semibold">Official Shiny Artwork:</h3>
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
			<div class="">
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
	</section>
	<!-- Moves -->
	<section class="container mx-auto mt-16">
		<h2 class="h2 font-semibold">Moves:</h2>
		<p class="font-medium">
			Total moves: <span class="text-primary-500">{pokemonMoves.length}</span>
		</p>
		<div class="mt-5 flex flex-wrap gap-5">
			<button class="variant-filled h5 btn font-semibold" on:click={() => sortByPower()}
				>Sort by Power</button
			>
			<button class="variant-filled h5 btn font-semibold" on:click={() => sortByAccuracy()}
				>Sort by Accuracy</button
			>
			<button class="variant-filled h5 btn font-semibold" on:click={() => sortAlphabetically()}
				>Sort Alphabetically</button
			>
			<button class="variant-filled h5 btn font-semibold" on:click={() => sortLevel()}
				>Sort by Level</button
			>
		</div>

		<div class="mt-12 flex flex-wrap justify-around gap-3">
			{#each pokemonMoves as move}
				<a
					class="p-5 transition-all hover:card hover:text-primary-500"
					href="/move/{move.pokemon_v2_move.name}"
				>
					<div class="flex flex-col items-center text-center">
						<div class="flex items-center gap-4">
							<Type textSize="14" type={move.pokemon_v2_move.pokemon_v2_type.name} />
							<h4 class="h4 font-semibold">
								{capitalize(hyphenRemover(move.pokemon_v2_move.name))}
							</h4>
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
						<div class="mt-4 font-medium">
							{#if move.level != 0}
								<p>Learn at level: {move.level}</p>
							{/if}
							{#if move.pokemon_v2_move.power}
								<p>
									Power: {move.pokemon_v2_move.power}
									{#if pokemonTypes.find((type) => type.pokemon_v2_type.name === move.pokemon_v2_move.pokemon_v2_type.name)}
										({move.pokemon_v2_move.power * 1.5})
									{/if}
								</p>
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
	</section>
</main>
