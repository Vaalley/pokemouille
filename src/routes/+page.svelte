<script>
	import SearchBar from '../components/SearchBar.svelte';
	export let data;

	let searchData = data.searchData;
</script>

<svelte:head>
	<title>Pokémouille 🐸</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="bg-gray-100 min-h-screen">
	<div class="container mx-auto py-8">
		<h1 class="text-4xl sm:text-5xl md:text-6xl text-center mt-8 mb-16 font-bold">
			Welcome to Pokémouille 🐸
		</h1>
		<div class="my-8">
			<h2 class="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">About</h2>
			<p class="text-lg sm:text-xl">
				Pokémouille is a website that provides information about the world of Pokémon. You can
				search for your favorite Pokémon and learn more about their stats, moves, abilities, and
				more. Whether you're a seasoned trainer or just getting started, Pokémouille has everything
				you need to become a Pokémon master!
			</p>
		</div>
		<div class="my-8">
			<h2
				class="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 text-amber-400 bg-amber-100 w-fit p-2 border-2 border-amber-400"
			>
				Start typing anywhere to search for anything
			</h2>
			<p class="text-lg sm:text-xl">
				Pokémouille is an open-source project under MIT license, which means anyone can contribute
				to it. If you're interested in helping out, check out our <a
					href="https://github.com/Vaalley/pokemouille"
					target="_blank"
					rel="noopener noreferrer"
					class="text-red-600 hover:text-red-700 underline">GitHub repository</a
				>. We're always looking for contributors to make Pokémouille even better!
			</p>
		</div>
		<SearchBar data={searchData} />
	</div>
</div>
