<script>
	export let data;
	import { capitalize, hyphenRemover } from '$lib/utils';
	import SearchBar from '../../../components/SearchBar.svelte';

	let abilityInfo = data.abilityInfo;
	let pokemon = data.pokemon.pokemon_v2_pokemon;

	console.log(abilityInfo);
</script>

<svelte:head>
	<title>{capitalize(hyphenRemover(abilityInfo.name))}</title>
</svelte:head>

<div class="flex flex-col items-center">
	<h1>Ability: {capitalize(hyphenRemover(abilityInfo.name))}</h1>
	<p>Flavour text: {abilityInfo.flavor_text_entries[0].flavor_text}</p>
	<p>effect description: {abilityInfo.effect_entries[0].effect}</p>
	<SearchBar data={pokemon} />
</div>
