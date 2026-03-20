<script lang="ts">
	import { browser } from '$app/environment';
	import { setGeneration, type Generation } from '$lib/generation';
	import { setLanguage, type Language } from '$lib/language';

	let { data } = $props<{
		data: {
			generation: number;
			id: string;
			language: string;
			pokemon: {
				effectiveGeneration: number;
				flavorText: string;
				id: string;
				introducedGeneration: number;
				language: string;
				name: string;
				genus: string | null;
				selectedGeneration: number;
				isLegendary: boolean;
				isMythical: boolean;
				isBaby: boolean;
				color: string | null;
				habitat: string | null;
				shape: string | null;
				genderRate: number;
				hatchCounter: number;
				captureRate: number;
				baseHappiness: number;
				growthRate: string | null;
				eggGroups: string[];
				evolutionChain: {
					id: number;
					name: string;
					evolution: {
						trigger: string | null;
						minLevel: number | null;
						minHappiness: number | null;
						timeOfDay: string | null;
						minAffection: number | null;
						needsOverworldRain: boolean | null;
						turnUpsideDown: boolean | null;
						item: string | null;
						heldItem: string | null;
						move: string | null;
					} | null;
				}[];
				height: number | null;
				weight: number | null;
				baseExperience: number | null;
				spriteDefault: string | null;
				spriteShiny: string | null;
				types: string[];
				abilities: { name: string; isHidden: boolean }[];
				stats: { base_stat: number; effort: number; stat: { name: string } }[];
				moves: { level: number; movelearnmethod: { name: string }; move: { name: string } }[];
			};
		};
	}>();

	function getPokemonImageUrl(selectedPokemonId: string): string {
		return `https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/pokemon/${selectedPokemonId}.png`;
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		setLanguage(data.language as Language);
		setGeneration(data.generation as Generation);
	});
</script>

<svelte:head>
	<title>{data.pokemon.name ? `${data.pokemon.name} | Pokemouille` : 'Pokemouille'}</title>
</svelte:head>

<section class="mx-auto max-w-3xl space-y-8 px-4 py-6">

	<div class="flex gap-6 items-start">
		<div class="flex gap-2 shrink-0">
			{#if data.pokemon.spriteDefault}
				<img alt="{data.pokemon.name} default" class="h-32 w-32 [image-rendering:pixelated]" src={data.pokemon.spriteDefault} />
			{/if}
			{#if data.pokemon.spriteShiny}
				<img alt="{data.pokemon.name} shiny" class="h-32 w-32 [image-rendering:pixelated]" src={data.pokemon.spriteShiny} />
			{/if}
		</div>
		<div class="space-y-1">
			<div class="flex gap-2 text-sm">
				{#if data.pokemon.isLegendary}<span class="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800">Legendary</span>{/if}
				{#if data.pokemon.isMythical}<span class="rounded bg-purple-100 px-2 py-0.5 text-purple-800">Mythical</span>{/if}
				{#if data.pokemon.isBaby}<span class="rounded bg-pink-100 px-2 py-0.5 text-pink-800">Baby</span>{/if}
			</div>
			<h1 class="text-3xl font-bold">#{data.id} {data.pokemon.name}</h1>
			{#if data.pokemon.genus}<p class="text-gray-500">{data.pokemon.genus} — Gen {data.pokemon.introducedGeneration}</p>{:else}<p class="text-gray-500">Gen {data.pokemon.introducedGeneration}</p>{/if}
			<p class="text-sm">{data.pokemon.types.join(' / ')}</p>
			<p class="mt-2 text-sm leading-relaxed">{data.pokemon.flavorText}</p>
		</div>
	</div>

	<div>
		<h2 class="mb-3 text-xl font-semibold">Info</h2>
		<dl class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
			<div class="flex gap-1"><dt class="font-medium">Height</dt><dd>{data.pokemon.height != null ? `${data.pokemon.height / 10} m` : '—'}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Weight</dt><dd>{data.pokemon.weight != null ? `${data.pokemon.weight / 10} kg` : '—'}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Base EXP</dt><dd>{data.pokemon.baseExperience ?? '—'}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Color</dt><dd>{data.pokemon.color ?? '—'}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Shape</dt><dd>{data.pokemon.shape ?? '—'}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Habitat</dt><dd>{data.pokemon.habitat ?? '—'}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Capture Rate</dt><dd>{data.pokemon.captureRate}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Base Happiness</dt><dd>{data.pokemon.baseHappiness}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Growth Rate</dt><dd>{data.pokemon.growthRate ?? '—'}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Egg Groups</dt><dd>{data.pokemon.eggGroups.join(', ') || '—'}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Hatch Counter</dt><dd>{data.pokemon.hatchCounter}</dd></div>
			<div class="flex gap-1"><dt class="font-medium">Gender Rate</dt><dd>{data.pokemon.genderRate === -1 ? 'Genderless' : `${data.pokemon.genderRate * 12.5}% female`}</dd></div>
		</dl>
	</div>

	{#if data.pokemon.abilities.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">Abilities</h2>
			<ul class="flex flex-wrap gap-2">
				{#each data.pokemon.abilities as ability}
					<li class="rounded border px-3 py-1 text-sm">{ability.name}{ability.isHidden ? ' (hidden)' : ''}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if data.pokemon.evolutionChain.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">Evolution Chain</h2>
			<div class="flex flex-wrap items-center gap-2">
				{#each data.pokemon.evolutionChain as evo, i}
					{#if i > 0 && evo.evolution}
						<div class="flex flex-col items-center text-xs text-center text-gray-500 px-1">
							<span class="text-base">→</span>
							{#if evo.evolution.trigger}<span>{evo.evolution.trigger}</span>{/if}
							{#if evo.evolution.minLevel}<span>Lv. {evo.evolution.minLevel}</span>{/if}
							{#if evo.evolution.item}<span>{evo.evolution.item}</span>{/if}
							{#if evo.evolution.heldItem}<span>Hold: {evo.evolution.heldItem}</span>{/if}
							{#if evo.evolution.move}<span>Know: {evo.evolution.move}</span>{/if}
							{#if evo.evolution.minHappiness}<span>Friendship: {evo.evolution.minHappiness}</span>{/if}
							{#if evo.evolution.minAffection}<span>Affection: {evo.evolution.minAffection}</span>{/if}
							{#if evo.evolution.timeOfDay}<span>{evo.evolution.timeOfDay}</span>{/if}
							{#if evo.evolution.needsOverworldRain}<span>Rain</span>{/if}
							{#if evo.evolution.turnUpsideDown}<span>Upside down</span>{/if}
						</div>
					{:else if i > 0}
						<span class="text-gray-400">→</span>
					{/if}
					<a href="/pokemon/{data.language}/{data.pokemon.selectedGeneration}/{evo.id}" class="flex flex-col items-center rounded border px-3 py-2 text-sm hover:bg-gray-50 text-center">
						<img alt={evo.name} class="h-16 w-16 [image-rendering:pixelated]" src={getPokemonImageUrl(String(evo.id))} />
						<span>{evo.name}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.pokemon.stats.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">Base Stats</h2>
			<ul class="space-y-1 text-sm">
				{#each data.pokemon.stats as stat}
					<li class="flex items-center gap-3">
						<span class="w-32 shrink-0 font-medium">{stat.stat.name}</span>
						<span class="w-8 text-right">{stat.base_stat}</span>
						<div class="h-2 flex-1 rounded bg-gray-200">
							<div class="h-2 rounded bg-blue-400" style="width: {Math.min(stat.base_stat / 255 * 100, 100)}%"></div>
						</div>
						{#if stat.effort > 0}<span class="text-xs text-gray-400">+{stat.effort} EV</span>{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if data.pokemon.moves.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">Moves <span class="text-base font-normal text-gray-500">(Gen {data.pokemon.selectedGeneration})</span></h2>
			<ul class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
				{#each data.pokemon.moves.toSorted((a: { level: number }, b: { level: number }) => a.level - b.level) as move}
					<li class="flex gap-1">
						<span class="font-medium">{move.move.name}</span>
						<span class="text-gray-400 text-xs self-center">— {move.movelearnmethod.name}{move.level > 0 ? ` lv.${move.level}` : ''}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</section>
