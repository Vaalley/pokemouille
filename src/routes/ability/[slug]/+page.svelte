<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let abilityInfo = data?.abilityInfo;
	let searchData = data?.searchData;

	// Get the English flavor text
	const englishFlavorText = abilityInfo?.flavor_text_entries.find(
		(entry) => entry.language.name === 'en'
	);
	abilityInfo.flavor_text_entries = englishFlavorText ? [englishFlavorText] : [];

	// Get the English effect description
	const englishEffect = abilityInfo?.effect_entries.find((entry) => entry.language.name === 'en');
	abilityInfo.effect_entries = englishEffect ? [englishEffect] : [];
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(abilityInfo?.name))}</title>
</svelte:head>

{#if abilityInfo}
	<div class="container mx-auto py-8">
		<h1 class="text-4xl font-semibold">Ability: {capitalize(hyphenRemover(abilityInfo.name))}</h1>
		<div class="my-8">
			<h2 class="text-2xl font-semibold">Flavor Text</h2>
			{#if abilityInfo.flavor_text_entries.length}
				<p>{abilityInfo.flavor_text_entries[0].flavor_text}</p>
			{:else}
				<p>Data not available yet</p>
			{/if}
		</div>
		<div class="my-8">
			<h2 class="text-2xl font-semibold">Effect Description</h2>
			{#if abilityInfo.effect_entries.length}
				<p>{abilityInfo.effect_entries[0].effect}</p>
			{:else}
				<p>Data not available yet</p>
			{/if}
		</div>
		<SearchBar data={searchData} />
	</div>
{:else}
	<p>Data not available yet</p>
{/if}
