<script lang="ts">
	import { goto } from '$app/navigation';
	import TypeBadge from '$lib/components/TypeBadge.svelte';
	import { getSavedGeneration } from '$lib/generation';
	import { getSavedLanguage } from '$lib/language';
	import { searchState } from '$lib/pokemon-search.svelte';
	import {
		ALL_TYPES,
		chart,
		getDefensiveEffectiveness,
		getOffensiveEffectiveness,
		type Effectiveness,
	} from '$lib/type-effectiveness';

	const iconUrl = (slug: string) =>
		`https://raw.githubusercontent.com/partywhale/pokemon-type-icons/fcbe6978c61c359680bc07636c3f9bdc0f346b43/icons/${slug}.svg`;

	function cellClass(atk: string, def: string): string {
		const m = chart[atk]?.[def] ?? 1;
		if (m === 0) return 'text-gray-400';
		if (m === 0.5) return 'text-blue-500';
		if (m === 2) return 'text-orange-500 font-semibold';
		return 'text-gray-300';
	}

	function cellLabel(atk: string, def: string): string {
		const m = chart[atk]?.[def] ?? 1;
		if (m === 0) return '0';
		if (m === 0.5) return '½';
		if (m === 2) return '2';
		return '1';
	}

	let { data } = $props<{ data: { selected: string[] } }>();

	let selected = $state<string[]>([]);

	$effect(() => {
		selected = data.selected;
	});

	function pushUrl(types: string[]) {
		const url = types.length > 0 ? `/types?types=${types.join(',')}` : '/types';
		goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function toggle(type: string) {
		if (selected.includes(type)) {
			selected = selected.filter((t) => t !== type);
		} else if (selected.length < 2) {
			selected = [...selected, type];
		}
		pushUrl(selected);
	}

	const offense = $derived(selected.length > 0 ? getOffensiveEffectiveness(selected) : null);
	const defense = $derived(selected.length > 0 ? getDefensiveEffectiveness(selected) : null);
	const selectedSet = $derived(new Set(selected));

	const matchingPokemon = $derived(
		selected.length > 0
			? searchState.pokemonList.filter((p) =>
					selected.every((t) => p.types.includes(t)) && p.types.length === selected.length,
				)
			: [],
	);

	type Row = { label: string; mult: string; types: string[]; color: string };

	function rows(e: Effectiveness): Row[] {
		return [
			{ label: 'Super effective against', mult: '2×', types: e.double, color: 'text-orange-500' },
			{ label: 'No effect against', mult: '0×', types: e.immune, color: 'text-gray-400' },
			{ label: 'Not very effective against', mult: '½×', types: e.half, color: 'text-blue-400' },
		].filter((r) => r.types.length > 0);
	}

	function defRows(e: Effectiveness): Row[] {
		return [
			{ label: 'Weak to', mult: '4×', types: e.quadruple, color: 'text-red-600' },
			{ label: 'Weak to', mult: '2×', types: e.double, color: 'text-orange-500' },
			{ label: 'Immune to', mult: '0×', types: e.immune, color: 'text-gray-400' },
			{ label: 'Resists', mult: '½×', types: e.half, color: 'text-blue-400' },
			{ label: 'Resists', mult: '¼×', types: e.quarter, color: 'text-blue-600' },
		].filter((r) => r.types.length > 0);
	}
</script>

<svelte:head>
	<title>Type Calculator | Pokemouille</title>
</svelte:head>

<section class="mx-auto max-w-2xl space-y-8 px-4 py-6">
	<div>
		<h1 class="text-2xl font-bold">Type Calculator</h1>
		<p class="mt-1 text-sm text-gray-500">Select up to 2 types to see attack and defense matchups.</p>
	</div>

	<div>
		<p class="mb-2 text-sm font-medium">
			{#if selected.length === 0}Pick a type{:else}Selected: {selected.join(' + ')}{/if}
			{#if selected.length > 0}
				<button
					class="ml-2 text-xs text-gray-400 underline"
					onclick={() => (selected = [])}
					type="button"
				>
					clear
				</button>
			{/if}
		</p>
		<div class="flex flex-wrap gap-2">
			{#each ALL_TYPES as type}
				{@const active = selected.includes(type)}
				{@const disabled = !active && selected.length >= 2}
				<button
					class="rounded-full transition-opacity {disabled ? 'opacity-30' : 'opacity-100'}"
					onclick={() => toggle(type)}
					type="button"
					aria-pressed={active}
				>
					<TypeBadge slug={type} name={type} />
					{#if active}
						<span class="sr-only">(selected)</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	{#if offense && defense}
		<div class="grid gap-6 sm:grid-cols-2">
			<div class="space-y-3">
				<h2 class="text-lg font-semibold">Attacking</h2>
				{#each rows(offense) as row}
					<div>
						<p class="mb-1 text-xs font-medium text-gray-500">
							<span class={row.color}>{row.mult}</span> — {row.label}
						</p>
						<div class="flex flex-wrap gap-1">
							{#each row.types as t}
								<TypeBadge slug={t} name={t} />
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="space-y-3">
				<h2 class="text-lg font-semibold">Defending</h2>
				{#each defRows(defense) as row}
					<div>
						<p class="mb-1 text-xs font-medium text-gray-500">
							<span class={row.color}>{row.mult}</span> — {row.label}
						</p>
						<div class="flex flex-wrap gap-1">
							{#each row.types as t}
								<TypeBadge slug={t} name={t} />
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if matchingPokemon.length > 0}
		<div>
			<h2 class="mb-2 text-lg font-semibold">
				Pokémon with this type{selected.length > 1 ? ' combination' : ''}
				<span class="text-sm font-normal text-gray-400">({matchingPokemon.length})</span>
			</h2>
			<div class="flex flex-wrap gap-2">
			{#each matchingPokemon as p}
				<a
					class="flex flex-col items-center cursor-pointer border-2 hover:bg-gray-50 w-24"
					data-sveltekit-preload-data="hover"
					href={`/pokemon/${getSavedLanguage()}/${getSavedGeneration()}/${p.id}`}
				>
					{#if p.sprite}
						<img alt={p.name} class="h-16 w-16" loading="lazy" src={p.sprite} />
					{/if}
					<span class="text-xs pb-1 capitalize">{p.name}</span>
				</a>
			{/each}
		</div>
		</div>
	{/if}
</section>

<div class="px-4 py-6 space-y-3">
	<h2 class="text-xl font-bold">Full Type Chart</h2>
	<p class="text-xs text-gray-500">Rows = attacking type · Columns = defending type</p>
	<table class="border-collapse text-center text-xs mx-auto">
		<thead>
			<tr>
				<th class="border border-gray-200 p-1"></th>
				{#each ALL_TYPES as def}
					<th class="border border-gray-200 p-1 {selectedSet.has(def) ? 'bg-gray-200' : ''}">
					<img alt={def} title={def} class="h-5 w-5 mx-auto" loading="lazy" src={iconUrl(def)} />
				</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each ALL_TYPES as atk}
				<tr>
					<td class="border border-gray-200 p-1 whitespace-nowrap {selectedSet.has(atk) ? 'bg-gray-200' : ''}">
					<span class="inline-flex items-center gap-1">
						<img alt={atk} class="h-4 w-4" loading="lazy" src={iconUrl(atk)} />
						<span class="font-medium capitalize">{atk}</span>
					</span>
				</td>
					{#each ALL_TYPES as def}
						<td class="border border-gray-200 p-1 {cellClass(atk, def)} {selected.length > 0 ? (selectedSet.has(atk) && selectedSet.has(def) ? 'bg-gray-200' : selectedSet.has(atk) || selectedSet.has(def) ? 'bg-gray-100' : 'opacity-20') : ''}">{cellLabel(atk, def)}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="flex gap-4 text-xs text-gray-500">
		<span><span class="font-semibold text-orange-500">2</span> super effective</span>
		<span><span class="font-medium text-blue-500">½</span> not very effective</span>
		<span><span class="font-medium text-gray-400">0</span> immune</span>
	</div>
</div>
