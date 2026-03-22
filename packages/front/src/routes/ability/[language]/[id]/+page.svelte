<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { setLanguage, type Language } from '$lib/language';
	import { getSavedGeneration } from '$lib/generation';
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
			ability: {
				id: string;
				language: string;
				name: string;
				generationId: number | null;
				isMainSeries: boolean;
				shortEffect: string | null;
				effect: string | null;
				flavorText: string;
				pokemon: PokemonEntry[];
			};
		};
	}>();

	$effect(() => {
		if (!browser) return;
		setLanguage(data.language as Language);
	});

	const normal = $derived(data.ability.pokemon.filter((p: PokemonEntry) => !p.isHidden));
	const hidden = $derived(data.ability.pokemon.filter((p: PokemonEntry) => p.isHidden));

	async function goToPokemon(speciesId: number) {
		const gen = getSavedGeneration();
		await goto(`/pokemon/${data.language}/${gen}/${speciesId}`);
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
					<button
						type="button"
						class="flex w-full flex-col items-center border-2 cursor-pointer p-2 text-center text-sm hover:bg-gray-50"
						onclick={() => p.speciesId && goToPokemon(p.speciesId)}
					>
						{#if p.sprite}
							<img alt={p.name} class="h-16 w-16 [image-rendering:pixelated]" src={p.sprite} />
						{/if}
						<span class="mt-2 font-medium">{p.name}</span>
						<div class="mt-2 flex flex-wrap justify-center gap-1">
							{#each p.types as type}
								<TypeBadge slug={type.slug} name={type.name} />
							{/each}
						</div>
					</button>
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
</section>
