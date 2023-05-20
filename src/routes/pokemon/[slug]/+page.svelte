<script>
	export let data;
	import { capitalize, hyphenRemover, getIdFromUrl, pokemonTypes } from '$lib/utils';
	import PokemonEvolutionChain from '../../../components/PokemonEvolutionChain.svelte';
	import SearchBar from '../../../components/SearchBar.svelte';

	let pokemonInfo = data.pokemonInfo;
	let pokemonEvolutionChain = data.pokemonInfo.evolutionChain;
	let searchData = data.searchData;

	function getTextColor(backgroundColor) {
		// Convert the background color to RGB values
		const rgb = hexToRgb(backgroundColor);

		// Calculate the relative luminance of the color
		const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);

		// Use the contrast ratio to determine the text color
		if (luminance > 0.5) {
			return '#000000'; // Set text color to black
		} else {
			return '#ffffff'; // Set text color to white
		}
	}

	function hexToRgb(hex) {
		const match = hex.replace('#', '').match(/.{1,2}/g);
		return {
			r: parseInt(match[0], 16),
			g: parseInt(match[1], 16),
			b: parseInt(match[2], 16)
		};
	}

	function calculateLuminance(r, g, b) {
		const rsrgb = r / 255;
		const gsrgb = g / 255;
		const bsrgb = b / 255;

		const rlinear = rsrgb <= 0.03928 ? rsrgb / 12.92 : ((rsrgb + 0.055) / 1.055) ** 2.4;
		const glinear = gsrgb <= 0.03928 ? gsrgb / 12.92 : ((gsrgb + 0.055) / 1.055) ** 2.4;
		const blinear = bsrgb <= 0.03928 ? bsrgb / 12.92 : ((bsrgb + 0.055) / 1.055) ** 2.4;

		return 0.2126 * rlinear + 0.7152 * glinear + 0.0722 * blinear;
	}

	// console.log(pokemonEvolutionChain.chain);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.name))}</title>
</svelte:head>

<div class="container mx-auto py-8">
	<div class="my-8 flex items-center">
		<h1 class="text-4xl font-semibold">{capitalize(hyphenRemover(pokemonInfo.name))}</h1>
		<img src={pokemonInfo.sprites.front_default} alt={pokemonInfo.name} />
	</div>

	<PokemonEvolutionChain {pokemonEvolutionChain} />

	<div class="my-8 flexjustify-center items-center">
		<div class="flex justify-center items-center gap-32">
			<img
				src={pokemonInfo.sprites.other['official-artwork'].front_default}
				alt={pokemonInfo.name}
			/>
			<img src={pokemonInfo.sprites.other['official-artwork'].front_shiny} alt={pokemonInfo.name} />
		</div>
	</div>
	<div class="my-8 flex justify-between">
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">ID</h2>
			<p>{pokemonInfo.id}</p>
		</div>
		<div class="my-4 lg:my-0 lg:w-1/3">
			<h2 class="text-2xl font-semibold">Height</h2>
			<p>{pokemonInfo.height / 10} m</p>
		</div>
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">Weight</h2>
			<p>{pokemonInfo.weight / 10} kg</p>
		</div>
	</div>
	<div class="my-8 flex justify-between">
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">Type(s)</h2>
			{#each pokemonInfo.types as type}
				{#each pokemonTypes as pokemonType}
					{#if pokemonType.name === type.type.name}
						<p
							style="background-color: {pokemonType.color}; color: {getTextColor(
								pokemonType.color
							)};"
							class="py-1 px-2 rounded-md w-fit"
						>
							{capitalize(type.type.name)}
						</p>
					{/if}
				{/each}
			{/each}
		</div>
		<div class="my-4 lg:my-0 lg:w-1/3">
			<h2 class="text-2xl font-semibold">Ability(ies)</h2>
			{#each pokemonInfo.abilities as ability}
				<a href={`/ability/${getIdFromUrl(ability.ability.url)}`}>
					<p>{capitalize(hyphenRemover(ability.ability.name))}</p>
				</a>
			{/each}
		</div>
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">Stats</h2>
			{#each pokemonInfo.stats as stat}
				<p>{capitalize(hyphenRemover(stat.stat.name))}: {stat.base_stat}</p>
			{/each}
		</div>
	</div>
	<div class="my-8">
		<h2 class="text-2xl font-semibold">Moves</h2>
		<ul class="grid grid-cols-3 gap-4">
			{#each pokemonInfo.moves as move}
				<li>
					<a href={`/move/${getIdFromUrl(move.move.url)}`}
						>{capitalize(hyphenRemover(move.move.name))}</a
					>
				</li>
			{/each}
		</ul>
	</div>
	<SearchBar data={searchData} />
</div>
