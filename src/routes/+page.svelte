<script>
	import SearchBar from '../components/SearchBar.svelte';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	export let data;

	let searchData = data.searchData;
</script>

<!-- TODO: Add moveeffecttexts using tippy or similar on hover -->
<!-- TODO: Add Pokedex pages, for each region -->

<svelte:head>
	<title>Pokémouille 🐸</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<LightSwitch class="absolute right-10 top-10 scale-125" />
<SearchBar data={searchData} />

<div class="container mx-auto flex min-h-screen flex-col justify-end">
	<h1 class="h1 mt-12 text-center font-bold">Welcome to Pokémouille 🐸</h1>
	<h2 class="h2 mt-24 font-semibold">About</h2>
	<p class="mt-6 font-medium">
		Pokémouille is a website that provides information about the world of Pokémon. You can search
		for your favorite Pokémon and learn more about their stats, moves, abilities, and more. Whether
		you're a seasoned trainer or just getting started, Pokémouille has everything you need to become
		a Pokémon master!
	</p>
	<h2
		class="h2 mx-auto mb-auto mt-24 w-fit border-2 border-primary-400 bg-primary-100 p-3 font-semibold text-primary-400"
	>
		Start typing anywhere to search for anything
	</h2>
	<p class="p-2 text-sm font-medium italic text-secondary-500">
		Pokémouille is an open-source project under MIT license, which means anyone can contribute to
		it. If you're interested in helping out, check out our <a
			href="https://github.com/Vaalley/pokemouille"
			target="_blank"
			rel="noopener noreferrer"
			class="text-primary-600 underline transition-all hover:text-primary-700">GitHub repository</a
		>. We're always looking for contributors to make Pokémouille even better!
	</p>
</div>
