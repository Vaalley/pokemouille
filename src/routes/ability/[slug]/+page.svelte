<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let abilityInfo = data.abilityInfo;
	let searchData = data.searchData;
	const pokemonMainSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

	console.log(abilityInfo);
</script>

<svelte:head>
	<title>Pokémouille | {capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}</title>
	<link rel="icon" href="/favicon.ico" />
	<meta
		name="description"
		content="In a ability page you can expect to find information about the ability's effect, flavor text, and more!"
	/>
</svelte:head>

<SearchBar data={searchData} />

<main class="min-h-screen">
	<!-- Ability name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<h1 class="h1 p-2 font-bold">
			{capitalize(hyphenRemover(abilityInfo.pokemon_v2_ability[0].name))}
			<br class="hidden -sm:block" />
			<span class="text-base font-medium text-surface-400"
				>- Introduced in gen {abilityInfo.pokemon_v2_ability[0].pokemon_v2_generation.id}</span
			>
		</h1>
	</div>
	<!-- Ability descriptions -->
	<div class="container mx-auto mt-10 grid grid-cols-2 items-baseline -lg:grid-cols-1">
		<!-- Ability flavor text -->
		<div>
			<h2 class="h2 font-semibold">Flavor Text:</h2>
			{#if abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityflavortexts.length > 0}
				<p class="mt-3 font-medium">
					{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityflavortexts[0].flavor_text}
				</p>
			{:else}
				<p class="mt-3 font-medium">No flavor text available.</p>
			{/if}
		</div>
		<!-- Ability effect -->
		<div class="-lg:mt-10">
			<h2 class="h2 font-semibold">Effect Description:</h2>
			{#if abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityeffecttexts.length > 0}
				<p class="mt-3 font-medium">
					{abilityInfo.pokemon_v2_ability[0].pokemon_v2_abilityeffecttexts[0].effect}
				</p>
			{:else}
				<p class="mt-3 font-medium">No effect description available.</p>
			{/if}
		</div>
	</div>
	<!-- Ability Pokémon list -->
	<div class="container mx-auto my-16">
		<h2 class="h2 font-semibold">
			List of Pokémon that can learn {capitalize(
				hyphenRemover(abilityInfo.pokemon_v2_ability[0].name)
			)}:
			<span class="text-primary-500"
				>{abilityInfo.pokemon_v2_ability[0].pokemon_v2_pokemonabilities.length}</span
			>
		</h2>
		<div class="mt-5 grid grid-cols-10 gap-3">
			{#each abilityInfo.pokemon_v2_ability[0].pokemon_v2_pokemonabilities as pokemon}
				<a
					class="mx-auto flex flex-col items-center justify-center p-3 transition-all hover:card hover:text-primary-500"
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
</main>
