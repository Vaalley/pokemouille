<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import SearchDrawer from '$lib/components/SearchDrawer.svelte';
	import NavBar from '$lib/components/NavBar.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<SearchDrawer />
<NavBar />
{@render children()}
