<script>
	import SearchBar from '../../../components/SearchBar.svelte';
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';

	let itemInfo = data.itemInfo;
	let searchData = data.searchData;

	// console.log(itemInfo);
</script>

<SearchBar data={searchData} />

<svelte:head>
	<title>Pokémouille | {capitalize(hyphenRemover(itemInfo.pokemon_v2_item[0].name))}</title>
	<link rel="icon" href="/favicon.ico" />
</svelte:head>

<div class="min-h-screen">
	<!-- Item name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<img
			loading="lazy"
			src={'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/' +
				itemInfo.pokemon_v2_item[0].name +
				'.png'}
			alt={itemInfo.pokemon_v2_item[0].name}
		/>
		<h1 class="h1 flex items-center gap-3 font-bold">
			{capitalize(hyphenRemover(itemInfo.pokemon_v2_item[0].name))}
			{#if itemInfo.pokemon_v2_item[0].cost}
				<span class="h4 text-tertiary-800">- Cost: ¥{itemInfo.pokemon_v2_item[0].cost}</span>
			{/if}
		</h1>
	</div>
	<div class="container mx-auto grid grid-cols-2 items-baseline">
		<!-- Item flavor text -->
		<div class="mt-20">
			<h2 class="h2 mb-6 font-semibold">Flavor Text:</h2>
			<p class="text-xl font-medium">
				{itemInfo.pokemon_v2_item[0].pokemon_v2_itemflavortexts[0].flavor_text}
			</p>
		</div>
		<!-- Item effect -->
		<div class="mt-12">
			<h2 class="h2 mb-6 font-semibold">Effect Description:</h2>
			<p class="text-xl font-medium">
				{itemInfo.pokemon_v2_item[0].pokemon_v2_itemeffecttexts[0].effect}
			</p>
		</div>
	</div>
	<!-- Item category -->
	<div class="container mx-auto mt-20">
		<h2 class="h2 mb-6 font-semibold">Item Category:</h2>
		<p class="text-xl font-medium">
			{capitalize(hyphenRemover(itemInfo.pokemon_v2_item[0].pokemon_v2_itemcategory.name))}
		</p>
	</div>
</div>
