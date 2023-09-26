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
	<meta
		name="description"
		content="In a item page you can expect to find information about the item's effect, flavor text, and more!"
	/>
</svelte:head>

<main class="min-h-screen">
	<!-- Item name -->
	<div class="flex h-32 items-center justify-center gap-6">
		<img
			loading="lazy"
			src={'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/' +
				itemInfo.pokemon_v2_item[0].name +
				'.png'}
			alt={itemInfo.pokemon_v2_item[0].name}
		/>
		<h1 class="h1 p-2 font-bold">
			{capitalize(hyphenRemover(itemInfo.pokemon_v2_item[0].name))}
			<br class="hidden -sm:block" />
			{#if itemInfo.pokemon_v2_item[0].cost}
				<span class="text-base font-medium text-surface-400"
					>- Cost: ¥{itemInfo.pokemon_v2_item[0].cost}</span
				>
			{/if}
		</h1>
	</div>
	<div class="container mx-auto mt-10 grid grid-cols-2 items-baseline -lg:grid-cols-1">
		<!-- Item flavor text -->
		<div>
			<h2 class="h2 font-semibold">Flavor Text:</h2>
			<p class="mt-3 font-medium">
				{itemInfo.pokemon_v2_item[0].pokemon_v2_itemflavortexts[0].flavor_text}
			</p>
		</div>
		<!-- Item effect -->
		<div class="-lg:mt-10">
			<h2 class="h2 font-semibold">Effect Description:</h2>
			<p class="mt-3 font-medium">
				{itemInfo.pokemon_v2_item[0].pokemon_v2_itemeffecttexts[0].effect}
			</p>
		</div>
	</div>
	<!-- Item category -->
	<div class="container mx-auto my-16">
		<h2 class="h2 font-semibold">Item Category:</h2>
		<p class="mt-3 font-medium">
			{capitalize(hyphenRemover(itemInfo.pokemon_v2_item[0].pokemon_v2_itemcategory.name))}
		</p>
	</div>
</main>
