<script>
	export let data;
	import { capitalize, hyphenRemover, getIdFromUrl } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';
	import ThemeSwitch from '../../../components/ThemeSwitch.svelte';

	let pokemonInfo = data.pokemonInfo;
	let searchData = data.searchData;
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(pokemonInfo.name))}</title>
</svelte:head>

<ThemeSwitch />
<div class="container mx-auto py-8">
	<h1 class="text-4xl font-semibold">{capitalize(hyphenRemover(pokemonInfo.name))}</h1>
	<div class="my-8 flex flex-col lg:flex-row justify-center items-center">
		<div class="my-4">
			<img
				class="w-full"
				src={pokemonInfo.sprites.other['official-artwork'].front_default}
				alt={pokemonInfo.name}
			/>
		</div>
		<div class="my-4">
			<img class="w-full" src={pokemonInfo.sprites.front_default} alt={pokemonInfo.name} />
		</div>
		<div class="my-4">
			<img
				class="w-full"
				src={pokemonInfo.sprites.other['official-artwork'].front_shiny}
				alt={pokemonInfo.name}
			/>
		</div>
	</div>
	<div class="my-8 flex flex-col lg:flex-row justify-between">
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
	<div class="my-8 flex flex-col lg:flex-row justify-between">
		<div class="lg:w-1/3">
			<h2 class="text-2xl font-semibold">Type(s)</h2>
			{#each pokemonInfo.types as type}
				<p>{capitalize(type.type.name)}</p>
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
