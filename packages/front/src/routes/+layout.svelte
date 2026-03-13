<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import GenerationSelector from '$lib/components/GenerationSelector.svelte';
	import PokemonSearchDrawer from '$lib/components/PokemonSearchDrawer.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<PokemonSearchDrawer />
<div class="flex gap-2 p-4">
	<ThemeSelector />
	<LanguageSelector />
	<GenerationSelector />
</div>
{@render children()}
