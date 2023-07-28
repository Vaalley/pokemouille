<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import { LightSwitch } from '@skeletonlabs/skeleton';

	let abilityInfo = data.abilityInfo;
	let searchData = data.searchData;
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

	// console.log(abilityInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}</title>
</svelte:head>

<LightSwitch class="absolute top-10 right-10 scale-125" />
<div class="min-h-screen">
	<!-- Ability name -->
	<div class="flex gap-6 items-center justify-center h-32">
		<h1 class="h1 font-bold flex items-center gap-3">
			{capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}
			<span class="h4 text-tertiary-800"
				>- Introduced in {hyphenRemover(
					abilityInfo.pokemon_v2_ability[0].pokemon_v2_generation.name
				)}</span
			>
		</h1>
	</div>
	<div class="grid grid-cols-2 items-baseline container mx-auto">
		<!-- Ability flavor text -->
		<div class="mt-20">
			<h2 class="h2 font-semibold mb-6">Flavor Text:</h2>
			<p class="text-xl font-medium">
				{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityflavortexts[0].flavor_text}
			</p>
		</div>
		<!-- Ability effect -->
		<div class="mt-12">
			<h2 class="h2 font-semibold mb-6">Effect Description:</h2>
			<p class="text-xl font-medium">
				{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityeffecttexts[0].effect}
			</p>
		</div>
	</div>
	<!-- Ability Pokémon list -->
	<div class="container mx-auto py-12">
		<h2 class="h2 font-semibold mb-6">
			List of Pokémon that can learn {capitalize(
				hyphenRemover(abilityInfo.pokemon_v2_ability[0].name)
			)}:
		</h2>
		<div class="grid grid-cols-8 gap-3">
			{#each abilityInfo.pokemon_v2_ability[0].pokemon_v2_pokemonabilities as pokemon}
				<a
					class="hover:variant-ringed-primary rounded-none hover:text-primary-500 p-6 transition-all w-fit flex flex-col justify-center items-center mx-auto h5 font-medium"
					href={`/pokemon/${pokemon.pokemon_v2_pokemon.name}`}
				>
					<img
						loading="lazy"
						src={pokemonMainSpriteUrl + pokemon.pokemon_v2_pokemon.id + '.png'}
						alt={pokemon.pokemon_v2_pokemon.name}
					/>
					<p>
						{capitalize(pokemon.pokemon_v2_pokemon.name)}
						{#if pokemon.is_hidden}
							<span class="text-primary-500">(hidden)</span>
						{/if}
					</p>
				</a>
			{/each}
		</div>
	</div>
	<SearchBar data={searchData} />
</div>
