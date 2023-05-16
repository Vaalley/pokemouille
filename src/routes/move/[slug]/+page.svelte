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
	moveInfo.flavor_text_entries = englishFlavorText ? [englishFlavorText] : [];

	// Get the English effect entry
	const englishEffect = moveInfo.effect_entries.find((entry) => entry.language.name === 'en');
	moveInfo.effect_entries = englishEffect ? [englishEffect] : [];
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(moveInfo?.name))}</title>
</svelte:head>

{#if moveInfo}
	<div class="container mx-auto py-8">
		<h1 class="text-4xl font-semibold">{capitalize(hyphenRemover(moveInfo.name))}</h1>
		<div class="my-8 flex flex-col lg:flex-row justify-between">
			<div class="lg:w-1/3">
				<h2 class="text-2xl font-semibold">Type</h2>
				<p>{moveInfo.type.name}</p>
			</div>
			<div class="my-4 lg:my-0 lg:w-1/3">
				<h2 class="text-2xl font-semibold">Power</h2>
				<p>{moveInfo.power || 'N/A'}</p>
			</div>
			<div class="lg:w-1/3">
				<h2 class="text-2xl font-semibold">Accuracy</h2>
				<p>{moveInfo.accuracy || 'N/A'}</p>
			</div>
		</div>
		<div class="my-8">
			<h2 class="text-2xl font-semibold">Effect Entry</h2>
			{#if moveInfo.effect_entries.length}
				<p>{moveInfo.effect_entries[0].effect}</p>
			{:else}
				<p>Data not available yet</p>
			{/if}
		</div>
		<div class="my-8">
			<h2 class="text-2xl font-semibold">Flavor Text Entry</h2>
			{#if moveInfo.flavor_text_entries.length}
				<p>{moveInfo.flavor_text_entries[0].flavor_text}</p>
			{:else}
				<p>Data not available yet</p>
			{/if}
		</div>
		<SearchBar data={searchData} />
	</div>
{:else}
	<p>Data not available yet</p>
{/if}
