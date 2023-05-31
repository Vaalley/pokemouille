<script>
	export let data;
	import { capitalize, hyphenRemover, getIdFromUrl } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let abilityInfo = data?.abilityInfo;
	let searchData = data?.searchData;
	const pokemonSpritesBaseUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

	// Get the English flavor text
	const englishFlavorText = abilityInfo?.flavor_text_entries.find(
		(entry) => entry.language.name === 'en'
	);
	abilityInfo.flavor_text_entries = englishFlavorText ? [englishFlavorText] : [];

	// Get the English effect description
	const englishEffect = abilityInfo?.effect_entries.find((entry) => entry.language.name === 'en');
	abilityInfo.effect_entries = englishEffect ? [englishEffect] : [];

	console.log(abilityInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(abilityInfo?.name))}</title>
</svelte:head>

{#if abilityInfo}
	<div class="bg-gray-100 min-h-screen">
		<div class="container mx-auto py-8">
			<h1 class="text-4xl font-semibold mb-8 text-gray-800">
				{capitalize(hyphenRemover(abilityInfo.name))} -
				<span class="text-gray-700 text-2xl">
					Introduced in {hyphenRemover(abilityInfo.generation.name)}
				</span>
			</h1>
			<div class="my-8">
				<h2 class="text-2xl font-semibold mb-2 text-gray-800">Flavor Text</h2>
				{#if abilityInfo.flavor_text_entries.length}
					<p class="text-gray-700">{abilityInfo.flavor_text_entries[0].flavor_text}</p>
				{:else}
					<p class="text-gray-700">Data not available yet</p>
				{/if}
			</div>
			<div class="my-8">
				<h2 class="text-2xl font-semibold mb-2 text-gray-800">Effect Description</h2>
				{#if abilityInfo.effect_entries.length}
					<p class="text-gray-700">{abilityInfo.effect_entries[0].effect}</p>
				{:else}
					<p class="text-gray-700">Data not available yet</p>
				{/if}
			</div>
			<div class="my-8">
				<h2 class="text-2xl font-semibold mb-2 text-gray-800">
					List of Pokémon that can learn that ability:
				</h2>
				<ul class="grid grid-cols-3 gap-4">
					{#each abilityInfo.pokemon as pokemon}
						<li class="flex flex-col items-center justify-center text-center">
							<a href="/pokemon/{pokemon.pokemon.name}">
								<img
									src={`${pokemonSpritesBaseUrl}/${getIdFromUrl(pokemon.pokemon.url)}.png`}
									alt={pokemon.pokemon.name}
									class="mb-2 w-20 h-20"
									onerror="this.onerror=null; this.src='https://i.pinimg.com/736x/3f/53/20/3f5320bda51f29d0e6ef7a61d030c234--cricut.jpg'"
								/>
								<p class="text-gray-700 text-lg font-medium">
									{capitalize(pokemon.pokemon.name)}
									{#if pokemon.is_hidden}
										<span class="text-red-500">(hidden)</span>
									{/if}
								</p>
							</a>
						</li>
					{/each}
				</ul>
			</div>
			<SearchBar data={searchData} />
		</div>
	</div>
{:else}
	<p class="text-gray-700">Data not available yet</p>
{/if}
