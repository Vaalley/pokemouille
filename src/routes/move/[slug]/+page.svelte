<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let moveInfo = data.moveInfo;
	let searchData = data.searchData;

	// Get the English flavor text
	const englishFlavorText = moveInfo.flavor_text_entries.find(
		(entry) => entry.language.name === 'en'
	);
	moveInfo.flavor_text_entries = [englishFlavorText];

	// Get the English effect entry
	const englishEffect = moveInfo.effect_entries.find((entry) => entry.language.name === 'en');
	moveInfo.effect_entries = [englishEffect];
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(moveInfo.name))}</title>
</svelte:head>

<div class="flex flex-col items-center">
	<h1>Move: {capitalize(hyphenRemover(moveInfo.name))}</h1>
	<p>Effect entry: {moveInfo.effect_entries[0].effect}</p>
	<p>Flavor text entry: {moveInfo.flavor_text_entries[0].flavor_text}</p>
	<SearchBar data={searchData} />
</div>
