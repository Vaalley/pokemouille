<script>
	export let data;
	import { capitalize, hyphenRemover, pokemonTypes, getTextColor, getIdFromUrl } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let moveInfo = data.moveInfo;
	let searchData = data.searchData;
	const pokemonSpritesBaseUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

	// Get the English flavor text
	const englishFlavorText = moveInfo.flavor_text_entries.find(
		(entry) => entry.language.name === 'en'
	);
	moveInfo.flavor_text_entries = englishFlavorText ? [englishFlavorText] : [];

	// Get the English effect entry
	const englishEffect = moveInfo.effect_entries.find((entry) => entry.language.name === 'en');
	moveInfo.effect_entries = englishEffect ? [englishEffect] : [];

	// console.log(moveInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(moveInfo?.name))}</title>
</svelte:head>

{#if moveInfo}
	<div class="bg-gray-100 min-h-screen">
		<div class="container mx-auto py-8">
			<div class="flex items-center mb-8">
				<h1 class="text-4xl font-semibold text-gray-800">
					{capitalize(hyphenRemover(moveInfo.name))}
				</h1>
			</div>
			<div class="my-8 flex flex-col lg:flex-row justify-between">
				<div class="lg:w-1/3">
					<h2 class="text-2xl font-semibold mb-2 text-gray-800">Type</h2>
					{#each pokemonTypes as pokemonType}
						{#if pokemonType.name === moveInfo.type.name}
							<p
								style="background-color: {pokemonType.color}; color: {getTextColor(
									pokemonType.color
								)};"
								class="py-1 px-2 rounded-md w-fit"
							>
								{capitalize(moveInfo.type.name)}
							</p>
						{/if}
					{/each}
				</div>
				<div class="my-4 lg:my-0 lg:w-1/3">
					<h2 class="text-2xl font-semibold mb-2 text-gray-800">Power</h2>
					<p class="text-gray-700">{moveInfo.power || 'N/A'}</p>
				</div>
				<div class="lg:w-1/3">
					<h2 class="text-2xl font-semibold mb-2 text-gray-800">Accuracy</h2>
					<p class="text-gray-700">{moveInfo.accuracy || 'N/A'}</p>
				</div>
			</div>
			<div class="my-8">
				<h2 class="text-2xl font-semibold mb-2 text-gray-800">Effect Entry</h2>
				{#if moveInfo.effect_entries.length}
					<p class="text-gray-700">{moveInfo.effect_entries[0].effect}</p>
				{:else}
					<p class="text-gray-700">Data not available yet</p>
				{/if}
			</div>
			<div class="my-8">
				<h2 class="text-2xl font-semibold mb-2 text-gray-800">Flavor Text Entry</h2>
				{#if moveInfo.flavor_text_entries.length}
					<p class="text-gray-700">{moveInfo.flavor_text_entries[0].flavor_text}</p>
				{:else}
					<p class="text-gray-700">Data not available yet</p>
				{/if}
			</div>
			<div class="my-8">
				<h2 class="text-2xl font-semibold mb-2 text-gray-800">
					List of Pokémon that can learn that move:
				</h2>
				<ul class="grid grid-cols-3 gap-4">
					{#each moveInfo.learned_by_pokemon as pokemon}
						<li class="flex flex-col items-center justify-center text-center">
							<img
								src={`${pokemonSpritesBaseUrl}/${getIdFromUrl(pokemon.url)}.png`}
								alt={pokemon.name}
								class="mb-2 w-20 h-20"
								onerror="this.onerror=null; this.src='https://i.pinimg.com/736x/3f/53/20/3f5320bda51f29d0e6ef7a61d030c234--cricut.jpg'"
							/>
							<p class="text-gray-700">{pokemon.name}</p>
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
