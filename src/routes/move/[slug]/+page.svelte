<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import Type from '../../../components/Type.svelte';

	let moveInfo = data.moveInfo;
	let searchData = data.searchData;
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
	const moveEffect =
		moveInfo.pokemon_v2_move[0].pokemon_v2_moveeffect.pokemon_v2_moveeffecteffecttexts[0].effect;
	const moveEffectChance = moveInfo.pokemon_v2_move[0].move_effect_chance;

	const formattedEffect = moveEffect.replace(/\$effect_chance/g, moveEffectChance);

	// console.log(moveInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(moveInfo.pokemon_v2_move[0].name))}</title>
</svelte:head>

<div class="bg-gray-100 min-h-screen">
	<!-- Move name -->
	<div class="flex gap-6 items-center justify-center h-32">
		<Type type={moveInfo.pokemon_v2_move[0].pokemon_v2_type.name} textSize="20" />
		<h1 class="text-5xl font-semibold">
			{capitalize(hyphenRemover(moveInfo.pokemon_v2_move[0].name))}
			<span class="text-xl text-gray-500"
				>- Introduced in {hyphenRemover(
					moveInfo.pokemon_v2_move[0].pokemon_v2_generation.name
				)}</span
			>
		</h1>
	</div>
	<!-- Move Info -->
	<h2 class="text-4xl font-semibold mb-6 underline mx-[10%]">General Info:</h2>
	<div class="flex justify-between mx-[10%] flex-wrap mt-6">
		<!-- Category -->
		<div>
			<h2 class="text-3xl font-semibold mb-6 underline">Category:</h2>
			{#if moveInfo.pokemon_v2_move[0].move_damage_class_id == 1}
				<p class="text-xl font-medium">Status</p>
			{:else if moveInfo.pokemon_v2_move[0].move_damage_class_id == 2}
				<p class="text-xl font-medium">Physical</p>
			{:else if moveInfo.pokemon_v2_move[0].move_damage_class_id == 3}
				<p class="text-xl font-medium">Special</p>
			{/if}
		</div>
		<!-- Power -->
		<div>
			<h2 class="text-3xl font-semibold mb-6 underline">Power:</h2>
			{#if moveInfo.pokemon_v2_move[0].power}
				<p class="text-xl font-medium">
					{moveInfo.pokemon_v2_move[0].power}
				</p>
			{:else}
				<p class="text-xl font-medium">N/A</p>
			{/if}
		</div>
		<!-- Accuracy -->
		<div>
			<h2 class="text-3xl font-semibold mb-6 underline">Accuracy:</h2>
			{#if moveInfo.pokemon_v2_move[0].accuracy}
				<p class="text-xl font-medium">
					{moveInfo.pokemon_v2_move[0].accuracy}
				</p>
			{:else}
				<p class="text-xl font-medium">N/A</p>
			{/if}
		</div>
		<!-- Priority -->
		<div>
			<h2 class="text-3xl font-semibold mb-6 underline">Priority:</h2>
			{#if moveInfo.pokemon_v2_move[0].priority}
				<p class="text-xl font-medium">
					{moveInfo.pokemon_v2_move[0].priority}
				</p>
			{:else}
				<p class="text-xl font-medium">N/A</p>
			{/if}
		</div>
		<!-- PP -->
		<div>
			<h2 class="text-3xl font-semibold mb-6 underline">PP:</h2>
			{#if moveInfo.pokemon_v2_move[0].pp}
				<p class="text-xl font-medium">
					{moveInfo.pokemon_v2_move[0].pp}
				</p>
			{:else}
				<p class="text-xl font-medium">N/A</p>
			{/if}
		</div>
	</div>
	<div class="grid grid-cols-2 items-baseline mx-[10%] my-20">
		<!-- Move flavor text -->
		<div>
			<h2 class="text-4xl font-semibold mb-6 underline">Flavor Text:</h2>
			<p class="text-lg font-medium">
				{moveInfo.pokemon_v2_move[0].pokemon_v2_moveflavortexts[0].flavor_text}
			</p>
		</div>
		<!-- Move effect -->
		<div>
			<h2 class="text-4xl font-semibold mb-6 underline">Effect Description:</h2>
			<p class="text-lg font-medium">{formattedEffect}</p>
		</div>
	</div>
	<!-- Move Pokémon list -->
	<div class="mx-[10%]">
		<h2 class="text-4xl font-semibold mb-6 underline">
			List of Pokémon that can learn that ability:
		</h2>
		<div class="grid grid-cols-8">
			{#each moveInfo.pokemon_v2_move[0].pokemon_v2_pokemonmoves as pokemon}
				<a
					class="hover:bg-slate-200 rounded-xl p-5 w-fit flex flex-col justify-center items-center mx-auto"
					href={`/pokemon/${pokemon.pokemon_v2_pokemon.name}`}
				>
					<img
						src={pokemonMainSpriteUrl + pokemon.pokemon_v2_pokemon.id + '.png'}
						alt={pokemon.pokemon_v2_pokemon.name}
					/>
					<p>
						{pokemon.pokemon_v2_pokemon.name}
					</p>
				</a>
			{/each}
		</div>
	</div>
	<SearchBar data={searchData} />
</div>
