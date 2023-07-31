<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import Type from '../../../components/Type.svelte';
	import { LightSwitch } from '@skeletonlabs/skeleton';

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

<LightSwitch class="absolute right-10 top-10 scale-125" />
<SearchBar data={searchData} />

<div class="min-h-screen">
	<!-- Move name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<Type type={moveInfo.pokemon_v2_move[0].pokemon_v2_type.name} textSize="18" />
		<h1 class="h1 font-bold">
			{capitalize(hyphenRemover(moveInfo.pokemon_v2_move[0].name))}
			<span class="h4 text-tertiary-800"
				>- Introduced in {hyphenRemover(
					moveInfo.pokemon_v2_move[0].pokemon_v2_generation.name
				)}</span
			>
		</h1>
	</div>
	<!-- Move Info -->
	<h2 class="container h2 mx-auto mb-6 font-semibold">General Info:</h2>
	<div class="container mx-auto mt-6 flex flex-wrap justify-between">
		<!-- Category -->
		<div>
			<h2 class="h3 mb-6 font-semibold">Category:</h2>
			{#if moveInfo.pokemon_v2_move[0].move_damage_class_id == 1}
				<div class="flex gap-3">
					<p class="h4 font-medium">Status</p>
					<img
						class="object-contain"
						loading="lazy"
						src="https://archives.bulbagarden.net/media/upload/7/71/StatusIC_BW.png"
						alt="physical"
					/>
				</div>
			{:else if moveInfo.pokemon_v2_move[0].move_damage_class_id == 2}
				<div class="flex gap-3">
					<p class="h4 font-medium">Physical</p>
					<img
						class="object-contain"
						loading="lazy"
						src="https://archives.bulbagarden.net/media/upload/e/ed/PhysicalIC_BW.png"
						alt="physical"
					/>
				</div>
			{:else if moveInfo.pokemon_v2_move[0].move_damage_class_id == 3}
				<div class="flex gap-3">
					<p class="h4 font-medium">Special</p>
					<img
						class="object-contain"
						loading="lazy"
						src="https://archives.bulbagarden.net/media/upload/8/8c/SpecialIC_BW.png"
						alt="physical"
					/>
				</div>
			{/if}
		</div>
		<!-- Power -->
		<div>
			<h2 class="h3 mb-6 font-semibold">Power:</h2>
			{#if moveInfo.pokemon_v2_move[0].power}
				<p class="h4 font-medium">
					{moveInfo.pokemon_v2_move[0].power}
				</p>
			{:else}
				<p class="h4 font-medium">N/A</p>
			{/if}
		</div>
		<!-- Accuracy -->
		<div>
			<h2 class="h3 mb-6 font-semibold">Accuracy:</h2>
			{#if moveInfo.pokemon_v2_move[0].accuracy}
				<p class="h4 font-medium">
					{moveInfo.pokemon_v2_move[0].accuracy}
				</p>
			{:else}
				<p class="h4 font-medium">N/A</p>
			{/if}
		</div>
		<!-- Priority -->
		<div>
			<h2 class="h3 mb-6 font-semibold">Priority:</h2>
			{#if moveInfo.pokemon_v2_move[0].priority}
				<p class="h4 font-medium">
					{moveInfo.pokemon_v2_move[0].priority}
				</p>
			{:else}
				<p class="h4 font-medium">N/A</p>
			{/if}
		</div>
		<!-- PP -->
		<div>
			<h2 class="h3 mb-6 font-semibold">PP:</h2>
			{#if moveInfo.pokemon_v2_move[0].pp}
				<p class="h4 font-medium">
					{moveInfo.pokemon_v2_move[0].pp}
				</p>
			{:else}
				<p class="h4 font-medium">N/A</p>
			{/if}
		</div>
	</div>
	<div class="container mx-auto my-20 grid grid-cols-2 items-baseline">
		<!-- Move flavor text -->
		<div>
			<h2 class="h2 mb-6 font-semibold">Flavor Text:</h2>
			<p class="text-lg font-medium">
				{moveInfo.pokemon_v2_move[0].pokemon_v2_moveflavortexts[0].flavor_text}
			</p>
		</div>
		<!-- Move effect -->
		<div>
			<h2 class="h2 mb-6 font-semibold">Effect Description:</h2>
			<p class="text-lg font-medium">{formattedEffect}</p>
		</div>
	</div>
	<!-- Move Pokémon list -->
	<div class="container mx-auto">
		<h2 class="h2 mb-6 font-semibold">List of Pokémon that can learn that ability:</h2>
		<div class="grid grid-cols-8">
			{#each moveInfo.pokemon_v2_move[0].pokemon_v2_pokemonmoves as pokemon}
				<a
					class="h5 mx-auto flex w-fit flex-col items-center justify-center rounded-none p-6 font-medium transition-all hover:variant-ringed-primary hover:text-primary-500"
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
</div>
