<script>
	export let data;
	import { capitalize, hyphenRemover, get } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import Type from '../../../components/Type.svelte';

	const getEffect = (moveInfo) =>
		get(
			moveInfo,
			'pokemon_v2_move[0].pokemon_v2_moveeffect.pokemon_v2_moveeffecteffecttexts[0].effect'
		);
	const getEffectChance = (moveInfo) => get(moveInfo, 'pokemon_v2_move[0].move_effect_chance');

	let moveInfo = data.moveInfo;
	let searchData = data.searchData;
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
	const moveEffect = getEffect(moveInfo);
	const moveEffectChance = getEffectChance(moveInfo);

	const formattedEffect = moveEffect
		? moveEffect.replace(/\$effect_chance/g, moveEffectChance)
		: 'No effect information available.';

	// console.log(moveInfo);
</script>

<svelte:head>
	<title>Pokémouille | {capitalize(hyphenRemover(moveInfo.pokemon_v2_move[0].name))}</title>
	<link rel="icon" href="/favicon.ico" />
	<meta
		name="description"
		content="In a move page you can expect to find information about the move's type, power, accuracy, and more!"
	/>
</svelte:head>

<SearchBar data={searchData} />

<main class="min-h-screen">
	<!-- Move name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<Type type={moveInfo.pokemon_v2_move[0].pokemon_v2_type.name} textSize="18" />
		<h1 class="h1 p-2 font-bold">
			{capitalize(hyphenRemover(moveInfo.pokemon_v2_move[0].name))}
			<br class="hidden -sm:block" />
			<span class="text-base font-medium text-surface-400"
				>- Introduced in {hyphenRemover(
					moveInfo.pokemon_v2_move[0].pokemon_v2_generation.name
				)}</span
			>
		</h1>
	</div>
	<!-- Move Info -->
	<h2 class="container h2 mx-auto font-semibold">General Info:</h2>
	<div class="container mx-auto mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
		<!-- Category -->
		<div>
			<h3 class="h3 font-semibold">Category:</h3>
			{#if moveInfo.pokemon_v2_move[0].move_damage_class_id == 1}
				<div class="flex gap-3">
					<p class="font-medium">Status</p>
					<img
						class="object-contain"
						loading="lazy"
						src="https://img.pokemondb.net/images/icons/move-status.png"
						alt="status"
						width="24"
					/>
				</div>
			{:else if moveInfo.pokemon_v2_move[0].move_damage_class_id == 2}
				<div class="flex gap-3">
					<p class="font-medium">Physical</p>
					<img
						class="object-contain"
						loading="lazy"
						src="https://img.pokemondb.net/images/icons/move-physical.png"
						alt="physical"
						width="24"
					/>
				</div>
			{:else if moveInfo.pokemon_v2_move[0].move_damage_class_id == 3}
				<div class="flex gap-3">
					<p class="font-medium">Special</p>
					<img
						class="object-contain"
						loading="lazy"
						src="https://img.pokemondb.net/images/icons/move-special.png"
						alt="special"
						width="24"
					/>
				</div>
			{/if}
		</div>
		<!-- Power -->
		<div>
			<h3 class="h3 font-semibold">Power:</h3>
			{#if moveInfo.pokemon_v2_move[0].power}
				<p class="font-medium">
					{moveInfo.pokemon_v2_move[0].power}
				</p>
			{:else}
				<p class="font-medium">N/A</p>
			{/if}
		</div>
		<!-- Accuracy -->
		<div>
			<h3 class="h3 font-semibold">Accuracy:</h3>
			{#if moveInfo.pokemon_v2_move[0].accuracy}
				<p class="font-medium">
					{moveInfo.pokemon_v2_move[0].accuracy}
				</p>
			{:else}
				<p class="font-medium">N/A</p>
			{/if}
		</div>
		<!-- Priority -->
		<div>
			<h3 class="h3 font-semibold">Priority:</h3>
			{#if moveInfo.pokemon_v2_move[0].priority}
				<p class="font-medium">
					{moveInfo.pokemon_v2_move[0].priority}
				</p>
			{:else}
				<p class="font-medium">N/A</p>
			{/if}
		</div>
		<!-- PP -->
		<div>
			<h3 class="h3 font-semibold">PP:</h3>
			{#if moveInfo.pokemon_v2_move[0].pp}
				<p class="font-medium">
					{moveInfo.pokemon_v2_move[0].pp}
				</p>
			{:else}
				<p class="font-medium">N/A</p>
			{/if}
		</div>
	</div>
	<div class="container mx-auto my-20 grid grid-cols-2 items-baseline -lg:grid-cols-1">
		<!-- Move flavor text -->
		<div>
			<h2 class="h2 font-semibold">Flavor Text:</h2>
			{#if moveInfo.pokemon_v2_move[0].pokemon_v2_moveflavortexts[0]}
				<p class="mt-5 text-lg font-medium">
					{moveInfo.pokemon_v2_move[0].pokemon_v2_moveflavortexts[0].flavor_text}
				</p>
			{:else}
				<p class="mt-5 text-lg font-medium">No flavor text available.</p>
			{/if}
		</div>
		<!-- Move effect -->
		<div class="-lg:mt-10">
			<h2 class="h2 font-semibold">Effect Description:</h2>
			{#if moveEffect}
				<p class="mt-5 text-lg font-medium">{formattedEffect}</p>
			{:else}
				<p class="mt-5 text-lg font-medium">No effect description available.</p>
			{/if}
		</div>
	</div>
	<!-- Move Pokémon list -->
	<div class="container mx-auto my-16">
		<h2 class="h2 font-semibold">
			List of Pokémon that can learn that ability: <span class="text-primary-500"
				>{moveInfo.pokemon_v2_move[0].pokemon_v2_pokemonmoves.length}</span
			>
		</h2>
		<div class="mt-5 flex flex-wrap gap-3">
			{#each moveInfo.pokemon_v2_move[0].pokemon_v2_pokemonmoves as pokemon}
				<a
					class="mx-auto flex flex-col items-center justify-center p-3 transition-all hover:card hover:text-primary-500"
					href={`/pokemon/${pokemon.pokemon_v2_pokemon.name}`}
				>
					<img
						src={pokemonMainSpriteUrl + pokemon.pokemon_v2_pokemon.id + '.png'}
						alt={pokemon.pokemon_v2_pokemon.name}
						loading="lazy"
					/>
					<p>
						{capitalize(pokemon.pokemon_v2_pokemon.name)}
					</p>
				</a>
			{/each}
		</div>
	</div>
</main>
