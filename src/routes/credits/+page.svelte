<script>
	import SearchBar from '../../components/SearchBar.svelte';

	export let data;

	let searchData = data.searchData;
</script>

<SearchBar data={searchData} />

<svelte:head>
	<title>Pokémouille | Credits 🎉</title>
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="min-h-screen">
	<!-- Item name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<h1 class="h1 flex items-center gap-3 font-bold">🎉 Credits</h1>
	</div>
	<div class="container mx-auto mt-20 grid grid-cols-2 items-baseline">
		<!-- Graphical Assets Credits -->
		<div>
			<h1 class="h1 font-bold">Graphical Assets Credits:</h1>
			<div class="mt-5">
				<h2 class="h2 font-semibold">
					<a class="anchor" href="https://github.com/partywhale">Partywhale</a>
				</h2>
				<p class="h5 mt-2">
					Partywhale recreated every Pokemon type icon as a SVG's, which can be found here: <a
						class="anchor"
						href="https://github.com/partywhale/pokemon-type-icons"
						>https://github.com/partywhale/pokemon-type-icons</a
					>
				</p>
			</div>
			<div class="mt-5">
				<h2 class="h2 font-semibold">
					<a class="anchor" href="https://github.com/PokeAPI">PokéAPI</a>
				</h2>
				<p class="h5 mt-2">
					PokéAPI provides every Pokémon sprites in a github repo accessible for all, which can be
					found here: <a class="anchor" href="https://github.com/PokeAPI/sprites"
						>https://github.com/PokeAPI/sprites</a
					>
				</p>
			</div>
		</div>
		<!-- Data Credits -->
		<div>
			<h1 class="h1 font-bold">Data Credits:</h1>
			<div class="mt-5">
				<h2 class="h2 font-semibold">
					<a class="anchor" href="https://github.com/PokeAPI">PokéAPI</a>
				</h2>
				<p class="h5 mt-2">
					PokéAPI provides all the data used in this website (pokemon height/weight, abilities,
					moves, items etc...) which can be found here: <a class="anchor" href="https://pokeapi.co"
						>https://pokeapi.co</a
					>
				</p>
			</div>
		</div>
	</div>
</div>
