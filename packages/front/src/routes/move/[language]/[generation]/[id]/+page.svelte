<script lang="ts">
	import { browser } from '$app/environment';
	import { setLanguage, type Language } from '$lib/language';
	import { setGeneration, type Generation } from '$lib/generation';
	import TypeBadge from '$lib/components/TypeBadge.svelte';

	type PokemonEntry = {
		speciesId: number | null;
		name: string;
		sprite: string | null;
		types: { name: string; slug: string }[];
		level: number;
		learnMethod: string;
	};

	type MoveData = {
		id: string;
		language: string;
		selectedGeneration: number;
		name: string;
		generationId: number | null;
		accuracy: number | null;
		power: number | null;
		pp: number | null;
		priority: number;
		effectChance: number | null;
		typeSlug: string | null;
		typeName: string | null;
		damageClass: string | null;
		target: string | null;
		flavorText: string;
		shortEffect: string | null;
		effect: string | null;
		meta: {
			critRate: number;
			drain: number;
			flinchChance: number;
			healing: number;
			minHits: number | null;
			maxHits: number | null;
			statChance: number;
			ailment: string | null;
		} | null;
		machines: { number: number; name: string | null }[];
		pokemon: PokemonEntry[];
	};

	let { data } = $props<{
		data: {
			id: string;
			language: string;
			generation: number;
			requestedGeneration: number | null;
			move: MoveData;
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

	const byMethod = $derived.by(() => {
		const map = new Map<string, PokemonEntry[]>();
		for (const p of data.move.pokemon) {
			const key = p.learnMethod || 'unknown';
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(p);
		}
		return map;
	});
</script>

<svelte:head>
	<title>{data.move.name} | Pokemouille</title>
</svelte:head>

<section class="mx-auto max-w-3xl space-y-8 px-4 py-6">
	<div class="space-y-1">
		<p class="text-sm text-gray-500">Move — Gen {data.generation}{data.move.generationId != null ? ` · Introduced in Gen ${data.move.generationId}` : ''}</p>
		<h1 class="text-3xl font-bold">{data.move.name}</h1>
		{#if data.move.flavorText}
			<p class="text-sm leading-relaxed text-gray-600">{data.move.flavorText}</p>
		{/if}
	</div>

	{#if data.requestedGeneration !== null}
		<div class="border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
			{data.move.name} was introduced in Gen {data.move.generationId} and is not available in Generation {data.requestedGeneration}. Showing data for Gen {data.generation}.
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
		<div class="flex gap-2">
			<span class="font-medium">Type</span>
			{#if data.move.typeSlug && data.move.typeName}
				<TypeBadge slug={data.move.typeSlug} name={data.move.typeName} />
			{:else}
				<span>—</span>
			{/if}
		</div>
		<div class="flex gap-2"><span class="font-medium">Category</span><span>{data.move.damageClass ?? '—'}</span></div>
		<div class="flex gap-2"><span class="font-medium">Power</span><span>{data.move.power ?? '—'}</span></div>
		<div class="flex gap-2"><span class="font-medium">Accuracy</span><span>{data.move.accuracy != null ? `${data.move.accuracy}%` : '—'}</span></div>
		<div class="flex gap-2"><span class="font-medium">PP</span><span>{data.move.pp ?? '—'}</span></div>
		<div class="flex gap-2"><span class="font-medium">Priority</span><span>{data.move.priority > 0 ? `+${data.move.priority}` : data.move.priority}</span></div>
		<div class="flex gap-2"><span class="font-medium">Target</span><span>{data.move.target ?? '—'}</span></div>
		{#if data.move.effectChance != null}
			<div class="flex gap-2"><span class="font-medium">Effect chance</span><span>{data.move.effectChance}%</span></div>
		{/if}
		{#if data.move.machines.length > 0}
			<div class="flex gap-2">
				<span class="font-medium">TM/HM</span>
				<span>{data.move.machines.map((machine: { number: number; name: string | null }) => machine.name ?? `TM${machine.number}`).join(', ')}</span>
			</div>
		{/if}
	</div>

	{#if data.move.shortEffect}
		<div>
			<h2 class="mb-1 text-lg font-semibold">Effect</h2>
			<p class="text-sm leading-relaxed">{data.move.shortEffect}</p>
		</div>
	{/if}

	{#if data.move.meta}
		{@const m = data.move.meta}
		{@const hasMeta = m.ailment || m.flinchChance > 0 || m.critRate > 0 || m.drain !== 0 || m.healing !== 0 || m.minHits != null}
		{#if hasMeta}
			<div>
				<h2 class="mb-2 text-lg font-semibold">Battle mechanics</h2>
				<dl class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
					{#if m.ailment}<div class="flex gap-2"><dt class="font-medium">Ailment</dt><dd>{m.ailment}</dd></div>{/if}
					{#if m.flinchChance > 0}<div class="flex gap-2"><dt class="font-medium">Flinch chance</dt><dd>{m.flinchChance}%</dd></div>{/if}
					{#if m.critRate > 0}<div class="flex gap-2"><dt class="font-medium">Crit rate</dt><dd>+{m.critRate}</dd></div>{/if}
					{#if m.drain !== 0}<div class="flex gap-2"><dt class="font-medium">Drain</dt><dd>{m.drain}%</dd></div>{/if}
					{#if m.healing !== 0}<div class="flex gap-2"><dt class="font-medium">Healing</dt><dd>{m.healing}%</dd></div>{/if}
					{#if m.minHits != null}<div class="flex gap-2"><dt class="font-medium">Hits</dt><dd>{m.minHits === m.maxHits ? m.minHits : `${m.minHits}–${m.maxHits}`}</dd></div>{/if}
				</dl>
			</div>
		{/if}
	{/if}

	{#if data.move.pokemon.length > 0}
		<div>
			<h2 class="mb-3 text-xl font-semibold">
				Learned by <span class="text-base font-normal text-gray-400">({new Set(data.move.pokemon.map((p: PokemonEntry) => p.speciesId)).size})</span>
			</h2>
			{#each [...byMethod.entries()] as [method, entries]}
				<div class="mb-4">
					<h3 class="mb-2 text-sm font-semibold capitalize text-gray-500">{method}</h3>
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
									<span class="mt-1 font-medium">{p.name}</span>
									{#if p.level > 0}<span class="text-xs text-gray-400">Lv. {p.level}</span>{/if}
									<div class="mt-1 flex flex-wrap justify-center gap-1">
										{#each p.types as type}<TypeBadge slug={type.slug} name={type.name} />{/each}
									</div>
								</a>
							{:else}
								<div class="flex w-full flex-col items-center border-2 p-2 text-center text-sm">
									{#if p.sprite}<img alt={p.name} class="h-16 w-16 [image-rendering:pixelated]" loading="lazy" src={p.sprite} />{/if}
										<span class="mt-1 font-medium">{p.name}</span>
										{#if p.level > 0}<span class="text-xs text-gray-400">Lv. {p.level}</span>{/if}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
</section>
