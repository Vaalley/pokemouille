<script>
	import SearchBar from '../../components/SearchBar.svelte';

	export let data;

	let searchData = data.searchData;
</script>

<SearchBar data={searchData} />

<svelte:head>
	<title>Pokémouille | 🎉 Credits</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="min-h-screen">
	<!-- Item name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<h1 class="h1 flex items-center gap-3 font-bold">🎉 Credits</h1>
	</div>
	<div class="container mx-auto grid grid-cols-2 items-baseline">
		<!-- Item flavor text -->
		<div class="mt-20">
			<p>something</p>
		</div>
		<!-- Item effect -->
		<div class="mt-12">
			<p>something</p>
		</div>
	</div>
	<!-- Item category -->
	<div class="container mx-auto mt-20">
		<p>something</p>
	</div>
</div>
