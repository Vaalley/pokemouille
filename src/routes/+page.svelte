<script>
	import ThemeSwitch from '../components/ThemeSwitch.svelte';
	import SearchBar from '../components/SearchBar.svelte';

	export let data;

	let searchData = data.searchData;
</script>

<svelte:head>
	<title>🐸 Pokémouille</title>
	<!-- <link rel="icon" href="" /> -->
</svelte:head>

<ThemeSwitch />
<div class="container mx-auto py-8">
	<h1 class="text-7xl text-center mt-8 mb-16 underline">Welcome to Pokémouille</h1>
	<div class="my-8">
		<h2 class="text-4xl font-semibold mb-4">About</h2>
		<p class="text-lg">
			Pokémouille is a website that provides information about the world of Pokémon. You can search
			for your favorite Pokémon and learn more about their stats, moves, abilities, and more.
			Whether you're a seasoned trainer or just getting started, Pokémouille has everything you need
			to become a Pokémon master!
		</p>
	</div>
	<div class="my-8">
		<h2 class="text-4xl font-semibold mb-4">Start typing to search for anything</h2>
	</div>
	<SearchBar data={searchData} />
</div>
