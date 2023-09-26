<script>
	import SearchBar from '../components/SearchBar.svelte';
	export let data;

	let searchData = data.searchData;
</script>

<!-- TODO: Use of SkeletonUI Tree Views to completely overhaul the Evolution Chain component -->
<!-- TODO: Add multi languages support -->
<!-- TODO: Add battle simulator (similar to Pokemon Showdown) -->

<svelte:head>
	<title>Pokémouille</title>
	<link rel="icon" href="/favicon.ico" />
	<meta
		name="description"
		content="Pokémouille is a Pokémon encyclopedia. Find out all about your favorite Pokémon in our Pokémon Encyclopedia. Learn about their moves, abilities, stats, and more!"
	/>
</svelte:head>

<SearchBar data={searchData} />

<main class="container mx-auto flex min-h-screen flex-col justify-end">
	<h1 class="h1 mt-10 text-center font-bold">Welcome to Pokémouille</h1>
	<h2 class="h2 mt-20 font-semibold">About</h2>
	<p class="mt-5 font-medium">
		Pokémouille is a website that provides information about the world of Pokémon. You can search
		for your favorite Pokémon and learn more about their stats, moves, abilities, and more. Whether
		you're a seasoned trainer or just getting started, Pokémouille has everything you need to become
		a Pokémon master!
	</p>
	<p class="mt-2 font-medium">
		All credits can be found here: <a class="anchor" href="/credits">Credits</a>
	</p>
	<h2 class="variant-ghost-primary h2 mx-auto mb-auto mt-20 w-fit p-3 font-semibold">
		Start typing anywhere to search for anything
	</h2>
	<p class="mb-2 text-sm font-medium italic text-surface-400">
		Pokémouille is an open-source project under MIT license, which means anyone can contribute to
		it. If you're interested in helping out, check out our <a
			href="https://github.com/Vaalley/pokemouille"
			target="_blank"
			rel="noopener noreferrer"
			class="anchor">GitHub repository</a
		>. We're always looking for contributors to make Pokémouille even better!
	</p>
</main>
