<script>
	import SearchBar from '../../../components/SearchBar.svelte';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';

	let itemInfo = data.itemInfo;
	let searchData = data.searchData;
</script>

<LightSwitch class="absolute right-10 top-10 scale-125" />
<SearchBar data={searchData} />

<svelte:head>
	<title>Pokémouille | {capitalize(hyphenRemover(itemInfo.pokemon_v2_item[0].name))}</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<h1>item page here</h1>
<h2>{capitalize(hyphenRemover(itemInfo.pokemon_v2_item[0].name))}</h2>
