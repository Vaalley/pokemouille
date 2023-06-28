<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
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

<div class="bg-gray-100 min-h-screen">
	<!-- Ability name -->
	<div class="flex gap-6 items-center justify-center h-32">
		<h1 class="text-5xl font-semibold">
			{capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}
			<span class="text-xl text-gray-500"
				>- Introduced in {hyphenRemover(
					abilityInfo.pokemon_v2_ability[0].pokemon_v2_generation.name
				)}</span
			>
		</h1>
	</div>
	<div class="grid grid-cols-2 items-baseline mx-[10%]">
		<!-- Ability flavor text -->
		<div class="mt-20">
			<h2 class="text-4xl font-semibold mb-6 underline">Flavor Text:</h2>
			<p class="text-xl font-medium">
				{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityflavortexts[0].flavor_text}
			</p>
		</div>
		<!-- Ability effect -->
		<div class="mt-12">
			<h2 class="text-4xl font-semibold mb-6 underline">Effect Description:</h2>
			<p class="text-xl font-medium">
				{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityeffecttexts[0].effect}
			</p>
		</div>
	</div>
	<!-- Ability Pokémon list -->
	<div class="mx-[10%] py-12">
		<h2 class="text-4xl font-semibold mb-6 underline">
			List of Pokémon that can learn {capitalize(
				hyphenRemover(abilityInfo.pokemon_v2_ability[0].name)
			)}:
		</h2>
		<div class="grid grid-cols-8">
			{#each abilityInfo.pokemon_v2_ability[0].pokemon_v2_pokemonabilities as pokemon}
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
