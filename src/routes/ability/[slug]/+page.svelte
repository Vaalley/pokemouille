<script>
	export let data;
	import { capitalize, hyphenRemover, getIdFromUrl } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let abilityInfo = data.abilityInfo;
	let searchData = data.searchData;
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

	// console.log(abilityInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}</title>
</svelte:head>

<div class="bg-gray-100">
	<div class="flex mx-[10%]">
		<h1 class="text-3xl font-semibold text-gray-800 my-6">
			{capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}
			<span class="text-xl text-gray-500"
				>- Introduced in {hyphenRemover(
					abilityInfo.pokemon_v2_ability[0].pokemon_v2_generation.name
				)}</span
			>
		</h1>
	</div>
	<div class="mx-[10%]">
		<h2 class="text-2xl font-semibold text-gray-800 underline my-2">Flavor Text:</h2>
		<p class="text-lg text-gray-600">
			{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityflavortexts[0].flavor_text}
		</p>
	</div>
	<div class="mx-[10%]">
		<h2 class="text-2xl font-semibold text-gray-800 underline my-6">Effect Description:</h2>
		<p class="text-lg text-gray-600">
			{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityeffecttexts[0].effect}
		</p>
	</div>
	<div class="mx-[10%]">
		<h2 class="text-2xl font-semibold text-gray-800 underline my-6">
			List of Pokémon that can learn that ability:
		</h2>
		<div class="grid grid-cols-4">
			{#each abilityInfo.pokemon_v2_ability[0].pokemon_v2_pokemonabilities as pokemon}
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
						{#if pokemon.is_hidden}
							<span class="text-red-500">(hidden)</span>
						{/if}
					</p>
				</a>
			{/each}
		</div>
	</div>
	<SearchBar data={searchData} />
</div>
