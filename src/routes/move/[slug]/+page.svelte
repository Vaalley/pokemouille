<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let moveInfo = data.moveInfo;
	let searchData = data.searchData;
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

	console.log(moveInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(moveInfo.pokemon_v2_move[0].name))}</title>
</svelte:head>

<div class="bg-gray-100 min-h-screen">
	<!-- Move name -->
	<div class="flex mx-[10%]">
		<h1 class="text-3xl font-semibold text-gray-800 my-6">
			{capitalize(hyphenRemover(moveInfo.pokemon_v2_move[0].name))}
			<span class="text-xl text-gray-500"
				>- Introduced in {hyphenRemover(
					moveInfo.pokemon_v2_move[0].pokemon_v2_generation.name
				)}</span
			>
		</h1>
	</div>
	<!-- Move flavor text -->
	<div class="mx-[10%]">
		<h2 class="text-2xl font-semibold text-gray-800 underline my-2">Flavor Text:</h2>
		<p class="text-lg text-gray-600">
			{moveInfo.pokemon_v2_move[0].pokemon_v2_moveflavortexts[0].flavor_text}
		</p>
	</div>
	<!-- Move effect -->
	<div class="mx-[10%]">
		<h2 class="text-2xl font-semibold text-gray-800 underline my-6">Effect Description:</h2>
		<p class="text-lg text-gray-600">
			{moveInfo.pokemon_v2_move[0].pokemon_v2_moveeffect.pokemon_v2_moveeffecteffecttexts[0].effect}
		</p>
	</div>
	<!-- Move Pokémon list -->
	<div class="mx-[10%]">
		<h2 class="text-2xl font-semibold text-gray-800 underline my-6">
			List of Pokémon that can learn that ability:
		</h2>
		<div class="grid grid-cols-4">
			{#each moveInfo.pokemon_v2_move[0].pokemon_v2_pokemonmoves as pokemon}
				<a
					class="hover:bg-gray-200 w-fit p-6 flex flex-col justify-center items-center mx-auto"
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
