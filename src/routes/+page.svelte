<script>
	import SearchBar from '../components/SearchBar.svelte';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	export let data;

	let searchData = data.searchData;
</script>

<svelte:head>
	<title>Pokémouille 🐸</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<LightSwitch class="absolute top-10 right-10 scale-125" />
<div class="min-h-screen container mx-auto flex flex-col justify-end">
	<h1 class="h1 font-bold text-center mt-12">Welcome to Pokémouille 🐸</h1>
	<h2 class="h2 font-semibold mt-24">About</h2>
	<p class="mt-6 font-medium">
		Pokémouille is a website that provides information about the world of Pokémon. You can search
		for your favorite Pokémon and learn more about their stats, moves, abilities, and more. Whether
		you're a seasoned trainer or just getting started, Pokémouille has everything you need to become
		a Pokémon master!
	</p>
	<h2
		class="mx-auto h2 font-semibold text-primary-400 bg-primary-100 p-3 border-2 border-primary-400 w-fit mt-24 mb-auto"
	>
		Start typing anywhere to search for anything
	</h2>
	<p class="font-medium italic text-sm p-2 text-secondary-500">
		Pokémouille is an open-source project under MIT license, which means anyone can contribute to
		it. If you're interested in helping out, check out our <a
			href="https://github.com/Vaalley/pokemouille"
			target="_blank"
			rel="noopener noreferrer"
			class="text-primary-600 hover:text-primary-700 underline transition-all">GitHub repository</a
		>. We're always looking for contributors to make Pokémouille even better!
	</p>
</div>
<SearchBar data={searchData} />
