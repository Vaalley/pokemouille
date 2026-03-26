<script lang="ts">
	import { browser } from '$app/environment';
	import { generations, setGeneration, type Generation } from '$lib/generation';
	import { setLanguage, type Language } from '$lib/language';

	type PokemonItem = { id: number; name: string; generationId: number | null };

	let { data } = $props<{
		data: {
			generation: number;
			language: string;
			pokemon: PokemonItem[];
		};
	}>();

	let query = $state('');
	let genFilter = $state(0);

	const filtered = $derived(
		data.pokemon.filter((p: PokemonItem) => {
			const q = query.trim().toLowerCase();
			const matchesQuery = q === '' || p.name.toLowerCase().includes(q) || String(p.id).includes(q);
			const matchesGen = genFilter === 0 || p.generationId === genFilter;
			return matchesQuery && matchesGen;
		}),
	);

	function getSpriteUrl(id: number): string {
		return `https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/pokemon/${id}.png`;
	}

	$effect(() => {
		if (!browser) return;
		setLanguage(data.language as Language);
		setGeneration(data.generation as Generation);
	});
</script>

<svelte:head>
	<title>Pokémon{genFilter !== 0 ? ` — Gen ${genFilter}` : ''} | Pokemouille</title>
</svelte:head>

<section class="mx-auto max-w-4xl space-y-6 px-4 py-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-2xl font-bold">Pokédex</h1>
		<span class="text-sm text-gray-500">{filtered.length} / {data.pokemon.length}</span>
	</div>

	<div class="flex flex-wrap gap-3">
		<input
			bind:value={query}
			class="min-w-0 flex-1 border-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
			placeholder="Search by name or #id…"
			type="search"
		/>
		<select
			bind:value={genFilter}
			class="border-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
		>
			<option value={0}>All generations</option>
			{#each generations as gen}
				<option value={gen.value}>{gen.label}</option>
			{/each}
		</select>
	</div>

	<ul class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
		{#each filtered as pokemon (pokemon.id)}
			<li>
				<a
					href="/pokemon/{data.language}/{data.generation}/{pokemon.id}"
					class="flex flex-col items-center border-2 px-2 py-3 text-center text-sm hover:bg-gray-50"
				>
					<img
						alt={pokemon.name}
						class="h-16 w-16 [image-rendering:pixelated]"
						src={getSpriteUrl(pokemon.id)}
					/>
					<span class="mt-1 text-xs text-gray-400">#{pokemon.id}</span>
					<span class="font-medium">{pokemon.name}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
