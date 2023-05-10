<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let abilityInfo = data.abilityInfo;
	let searchData = data.searchData;

	// Get the English flavor text
	const englishFlavorText = abilityInfo.flavor_text_entries.find(
		(entry) => entry.language.name === 'en'
	);
	abilityInfo.flavor_text_entries = [englishFlavorText];

	// Get the English effect description
	const englishEffect = abilityInfo.effect_entries.find((entry) => entry.language.name === 'en');
	abilityInfo.effect_entries = [englishEffect];
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(abilityInfo.name))}</title>
</svelte:head>

<div class="flex flex-col items-center">
	<h1>Ability: {capitalize(hyphenRemover(abilityInfo.name))}</h1>
	<p>Flavour text: {abilityInfo.flavor_text_entries[0].flavor_text}</p>
	<p>Effect description: {abilityInfo.effect_entries[0].effect}</p>
	<SearchBar data={searchData} />
</div>
