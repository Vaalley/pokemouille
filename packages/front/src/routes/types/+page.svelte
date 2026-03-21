<script lang="ts">
	import { goto } from '$app/navigation';
	import TypeBadge from '$lib/components/TypeBadge.svelte';
	import {
		ALL_TYPES,
		getDefensiveEffectiveness,
		getOffensiveEffectiveness,
		type Effectiveness,
	} from '$lib/type-effectiveness';

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
</section>
