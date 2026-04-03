<script lang="ts">
	import { browser } from '$app/environment';
	import { setLanguage, type Language } from '$lib/language';
	import { setGeneration, type Generation } from '$lib/generation';
	import TypeBadge from '$lib/components/TypeBadge.svelte';

	type PokemonEntry = {
		isHidden: boolean;
		slot: number;
		speciesId: number | null;
		name: string;
		sprite: string | null;
		types: { name: string; slug: string }[];
	};

	let { data } = $props<{
		data: {
			id: string;
			language: string;
			generation: number;
			ability: {
				id: string;
				language: string;
				name: string;
				generationId: number | null;
				isMainSeries: boolean;
				shortEffect: string | null;
				effect: string | null;
				flavorText: string;
				effectChanges: { generationId: number | null; effect: string | null }[];
				pastPokemon: {
					isHidden: boolean;
					lostAtGenerationId: number | null;
					speciesId: number | null;
					name: string;
					sprite: string | null;
				}[];
				pokemon: PokemonEntry[];
			};
		};
	}>();

	$effect(() => {
		if (!browser) return;
		setLanguage(data.language as Language);
		setGeneration(data.generation as Generation);
	});

	const normal = $derived(data.ability.pokemon.filter((p: PokemonEntry) => !p.isHidden));
	const hidden = $derived(data.ability.pokemon.filter((p: PokemonEntry) => p.isHidden));

	function pokemonHref(speciesId: number) {
		return `/pokemon/${data.language}/${data.generation}/${speciesId}`;
	}
</script>

<svelte:head>
	<title>{data.ability.name} | Pokemouille</title>
</svelte:head>

<section class="mx-auto max-w-3xl space-y-8 px-4 py-6">
	<div class="space-y-1">
		<p class="text-sm text-gray-500">
			Ability{data.ability.generationId ? ` — Gen ${data.ability.generationId}` : ''}
		</p>
		<h1 class="text-3xl font-bold">{data.ability.name}</h1>
		{#if data.ability.flavorText}
			<p class="text-sm leading-relaxed text-gray-600">{data.ability.flavorText}</p>
		{/if}
	</div>

	{#if data.ability.shortEffect}
		<div>
			<h2 class="mb-1 text-lg font-semibold">Effect</h2>
			<p class="text-sm leading-relaxed">{data.ability.shortEffect}</p>
		</div>
	{/if}

	{#snippet pokemonGrid(entries: PokemonEntry[])}
		<ul class="grid grid-cols-3 gap-2">
			{#each entries as p (p.speciesId ?? p.name)}
				<li>
					{#if p.speciesId}
						<a
							class="flex w-full flex-col items-center border-2 cursor-pointer p-2 text-center text-sm hover:bg-gray-50"
							data-sveltekit-preload-data="hover"
							href={pokemonHref(p.speciesId)}
						>
						{#if p.sprite}<img alt={p.name} class="h-16 w-16 [image-rendering:pixelated]" loading="lazy" src={p.sprite} />{/if}
						<span class="mt-2 font-medium">{p.name}</span>
						<div class="mt-2 flex flex-wrap justify-center gap-1">
							{#each p.types as type}<TypeBadge slug={type.slug} name={type.name} />{/each}
						</div>
					</a>
				{:else}
					<div class="flex w-full flex-col items-center border-2 p-2 text-center text-sm">
						{#if p.sprite}<img alt={p.name} class="h-16 w-16 [image-rendering:pixelated]" loading="lazy" src={p.sprite} />{/if}
							<span class="mt-2 font-medium">{p.name}</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/snippet}

	{#if normal.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">
				Pokémon with this ability
				<span class="text-base font-normal text-gray-400">({normal.length})</span>
			</h2>
			{@render pokemonGrid(normal)}
		</div>
	{/if}

	{#if hidden.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">
				Hidden ability Pokémon
				<span class="text-base font-normal text-gray-400">({hidden.length})</span>
			</h2>
			{@render pokemonGrid(hidden)}
		</div>
	{/if}

	{#if data.ability.pastPokemon.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">
				Formerly had this ability
				<span class="text-base font-normal text-gray-400">({data.ability.pastPokemon.length})</span>
			</h2>
			<ul class="grid grid-cols-3 gap-2">
				{#each data.ability.pastPokemon as p (p.speciesId ?? p.name)}
					<li>
						{#if p.speciesId}
							<a
								class="flex w-full flex-col items-center border-2 cursor-pointer p-2 text-center text-sm hover:bg-gray-50 opacity-70"
								data-sveltekit-preload-data="hover"
								href={pokemonHref(p.speciesId)}
							>
							{#if p.sprite}<img alt={p.name} class="h-16 w-16 [image-rendering:pixelated] grayscale" loading="lazy" src={p.sprite} />{/if}
							<span class="mt-2 font-medium">{p.name}</span>
							{#if p.lostAtGenerationId}<span class="text-xs text-gray-400">Until Gen {p.lostAtGenerationId}</span>{/if}
						</a>
					{:else}
						<div class="flex w-full flex-col items-center border-2 p-2 text-center text-sm opacity-70">
							{#if p.sprite}<img alt={p.name} class="h-16 w-16 [image-rendering:pixelated] grayscale" loading="lazy" src={p.sprite} />{/if}
								<span class="mt-2 font-medium">{p.name}</span>
								{#if p.lostAtGenerationId}<span class="text-xs text-gray-400">Until Gen {p.lostAtGenerationId}</span>{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if data.ability.effectChanges.length > 0}
		<div>
			<h2 class="mb-2 text-xl font-semibold">Effect history</h2>
			<ul class="space-y-2">
				{#each data.ability.effectChanges as change}
					{#if change.effect}
						<li class="text-sm">
							{#if change.generationId}
								<span class="font-medium text-gray-500">Before Gen {change.generationId + 1}:</span>
							{/if}
							<p class="leading-relaxed text-gray-600">{change.effect}</p>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
	{/if}
</section>
