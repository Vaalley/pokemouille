<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import PokemonSearchDrawer from '$lib/components/PokemonSearchDrawer.svelte';
	import NavBar from '$lib/components/NavBar.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<PokemonSearchDrawer />
<NavBar />
{@render children()}
