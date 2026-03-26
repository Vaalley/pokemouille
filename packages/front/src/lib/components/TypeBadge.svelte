<script lang="ts">
	const { slug, name }: { slug: string; name: string } = $props();

	const typeColors: Record<string, string> = {
		normal: '#A8A878',
		fire: '#F08030',
		water: '#6890F0',
		electric: '#F8D030',
		grass: '#78C850',
		ice: '#98D8D8',
		fighting: '#C03028',
		poison: '#A040A0',
		ground: '#E0C068',
		flying: '#A890F0',
		psychic: '#F85888',
		bug: '#A8B820',
		rock: '#B8A038',
		ghost: '#705898',
		dragon: '#7038F8',
		dark: '#705848',
		steel: '#B8B8D0',
		fairy: '#EE99AC',
	};

	const color = $derived(typeColors[slug] ?? '#888');
</script>

<span
	class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white"
	style="background-color: {color}"
>
	<img
		alt={slug}
		class="h-3.5 w-3.5"
		src="https://raw.githubusercontent.com/partywhale/pokemon-type-icons/fcbe6978c61c359680bc07636c3f9bdc0f346b43/icons/{slug}.svg"
	/>
	{name}
</span>
