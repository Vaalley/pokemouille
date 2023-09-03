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
	<title>Pokémouille | {capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}</title>
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<SearchBar data={searchData} />

<div class="min-h-screen">
	<!-- Ability name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<h1 class="h1 flex items-center gap-3 font-bold">
			{capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}
			<span class="h4 text-tertiary-800"
				>- Introduced in {hyphenRemover(
					abilityInfo.pokemon_v2_ability[0].pokemon_v2_generation.name
				)}</span
			>
		</h1>
	</div>
	<div class="container mx-auto grid grid-cols-2 items-baseline">
		<!-- Ability flavor text -->
		<div class="mt-20">
			<h2 class="h2 mb-6 font-semibold">Flavor Text:</h2>
			<p class="text-xl font-medium">
				{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityflavortexts[0].flavor_text}
			</p>
		</div>
		<!-- Ability effect -->
		<div class="mt-12">
			<h2 class="h2 mb-6 font-semibold">Effect Description:</h2>
			<p class="text-xl font-medium">
				{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityeffecttexts[0].effect}
			</p>
		</div>
	</div>
	<!-- Ability Pokémon list -->
	<div class="container mx-auto py-12">
		<h2 class="h2 mb-6 font-semibold">
			List of Pokémon that can learn {capitalize(
				hyphenRemover(abilityInfo.pokemon_v2_ability[0].name)
			)}:
		</h2>
		<div class="grid grid-cols-8 gap-3">
			{#each abilityInfo.pokemon_v2_ability[0].pokemon_v2_pokemonabilities as pokemon}
				<a
					class="h5 mx-auto flex w-fit flex-col items-center justify-center rounded-none p-6 font-medium transition-all hover:variant-ringed-primary hover:text-primary-500"
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
</div>
