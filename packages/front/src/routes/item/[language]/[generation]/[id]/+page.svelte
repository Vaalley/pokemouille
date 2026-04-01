<script lang="ts">
	import { browser } from '$app/environment';
	import { setLanguage, type Language } from '$lib/language';
	import { setGeneration, type Generation } from '$lib/generation';

	type PokemonEntry = {
		speciesId: number | null;
		name: string;
		sprite: string | null;
		rarity: number | null;
		version: string | null;
	};

	type MachineEntry = {
		number: number;
		moveName: string | null;
	};

	type ItemData = {
		id: string;
		language: string;
		selectedGeneration: number;
		name: string;
		sprite: string | null;
		cost: number | null;
		flingPower: number | null;
		flingEffect: string | null;
		shortEffect: string | null;
		effect: string | null;
		flavorText: string;
		category: string | null;
		pocket: string | null;
		attributes: string[];
		machines: MachineEntry[];
		pokemon: PokemonEntry[];
	};

	let { data } = $props<{
		data: {
			id: string;
			language: string;
			generation: number;
			item: ItemData;
		};
	}>();

	$effect(() => {
		if (!browser) return;
		setLanguage(data.language as Language);
		setGeneration(data.generation as Generation);
	});

	function pokemonHref(speciesId: number) {
		return `/pokemon/${data.language}/${data.generation}/${speciesId}`;
	}

	function machineLabel(m: MachineEntry) {
		return m.moveName ?? `TM${String(m.number).padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>{data.item.name} | Pokemouille</title>
</svelte:head>

<section class="mx-auto max-w-3xl space-y-8 px-4 py-6">
	<div class="flex items-center gap-4">
		{#if data.item.sprite}
			<img alt={data.item.name} class="h-16 w-16 [image-rendering:pixelated]" src={data.item.sprite} />
		{/if}
		<div class="space-y-1">
			<p class="text-sm text-gray-500">Item — Gen {data.generation}</p>
			<h1 class="text-3xl font-bold">{data.item.name}</h1>
			{#if data.item.flavorText}
				<p class="text-sm leading-relaxed text-gray-600">{data.item.flavorText}</p>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
		{#if data.item.cost != null}
			<div class="flex gap-2"><span class="font-medium">Cost</span><span>{data.item.cost} ₽</span></div>
		{/if}
		{#if data.item.pocket}
			<div class="flex gap-2"><span class="font-medium">Pocket</span><span>{data.item.pocket}</span></div>
		{/if}
		{#if data.item.category}
			<div class="flex gap-2"><span class="font-medium">Category</span><span>{data.item.category}</span></div>
		{/if}
		{#if data.item.flingPower != null}
			<div class="flex gap-2"><span class="font-medium">Fling power</span><span>{data.item.flingPower}</span></div>
		{/if}
		{#if data.item.flingEffect}
			<div class="flex gap-2"><span class="font-medium">Fling effect</span><span>{data.item.flingEffect}</span></div>
		{/if}
		{#if data.item.machines.length > 0}
			<div class="flex gap-2">
				<span class="font-medium">TM/HM</span>
				<span>{data.item.machines.map(machineLabel).join(', ')}</span>
			</div>
		{/if}
	</div>

	{#if data.item.attributes.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each data.item.attributes as attr (attr)}
				<span class="border px-2 py-1 text-xs">{attr}</span>
			{/each}
		</div>
	{/if}

	{#if data.item.shortEffect}
		<div>
			<h2 class="mb-1 text-lg font-semibold">Effect</h2>
			<p class="text-sm leading-relaxed">{data.item.shortEffect}</p>
		</div>
	{/if}

	{#if data.item.pokemon.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">
				Held by <span class="text-base font-normal text-gray-400">({data.item.pokemon.length})</span>
			</h2>
			<ul class="grid grid-cols-3 gap-2">
				{#each data.item.pokemon as p (p.speciesId ?? p.name)}
					<li>
						{#if p.speciesId}
							<a
								class="flex w-full flex-col items-center border-2 cursor-pointer p-2 text-center text-sm hover:bg-gray-50"
								data-sveltekit-preload-data="hover"
								href={pokemonHref(p.speciesId)}
							>
								{#if p.sprite}<img alt={p.name} class="h-16 w-16 [image-rendering:pixelated]" src={p.sprite} />{/if}
								<span class="mt-1 font-medium">{p.name}</span>
								{#if p.rarity != null}<span class="text-xs text-gray-400">{p.rarity}% chance</span>{/if}
								{#if p.version}<span class="text-xs text-gray-400">{p.version}</span>{/if}
							</a>
						{:else}
							<div class="flex w-full flex-col items-center border-2 p-2 text-center text-sm">
								{#if p.sprite}<img alt={p.name} class="h-16 w-16 [image-rendering:pixelated]" src={p.sprite} />{/if}
								<span class="mt-1 font-medium">{p.name}</span>
								{#if p.rarity != null}<span class="text-xs text-gray-400">{p.rarity}% chance</span>{/if}
								{#if p.version}<span class="text-xs text-gray-400">{p.version}</span>{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>
