<script lang="ts">
	import { getDefensiveEffectiveness, getOffensiveEffectiveness } from '$lib/type-effectiveness';
	import TypeBadge from './TypeBadge.svelte';

	const { types }: { types: { name: string; slug: string }[] } = $props();

	const slugs = $derived(types.map((t) => t.slug));
	const defensive = $derived(getDefensiveEffectiveness(slugs));
	const offensive = $derived(getOffensiveEffectiveness(slugs));
	let visible = $state(false);
</script>

<div
	class="relative inline-flex gap-1"
	onmouseenter={() => (visible = true)}
	onmouseleave={() => (visible = false)}
	role="group"
>
	<a href="/types?types={types.map((t) => t.slug).join(',')}" class="inline-flex gap-1">
		{#each types as type (type.slug)}
			<TypeBadge slug={type.slug} name={type.name} />
		{/each}
	</a>

	{#if visible}
		<div class="absolute top-full z-50 mt-1 w-56 border-2 bg-white p-2 text-sm">
			<p class="mb-1 text-xs font-semibold uppercase text-gray-400">Defensive</p>
			{#if defensive.quadruple.length > 0}
				<div class="mb-1">
					<span class="font-bold text-red-600">4×</span>
					<span class="ml-1 text-gray-700">{defensive.quadruple.join(', ')}</span>
				</div>
			{/if}
			{#if defensive.double.length > 0}
				<div class="mb-1">
					<span class="font-bold text-orange-500">2×</span>
					<span class="ml-1 text-gray-700">{defensive.double.join(', ')}</span>
				</div>
			{/if}
			{#if defensive.half.length > 0}
				<div class="mb-1">
					<span class="font-bold text-blue-500">½×</span>
					<span class="ml-1 text-gray-700">{defensive.half.join(', ')}</span>
				</div>
			{/if}
			{#if defensive.quarter.length > 0}
				<div class="mb-1">
					<span class="font-bold text-blue-800">¼×</span>
					<span class="ml-1 text-gray-700">{defensive.quarter.join(', ')}</span>
				</div>
			{/if}
			{#if defensive.immune.length > 0}
				<div class="mb-1">
					<span class="font-bold text-gray-400">0×</span>
					<span class="ml-1 text-gray-700">{defensive.immune.join(', ')}</span>
				</div>
			{/if}

			<p class="mb-1 mt-2 text-xs font-semibold uppercase text-gray-400">Offensive</p>
			{#if offensive.double.length > 0}
				<div class="mb-1">
					<span class="font-bold text-orange-500">2×</span>
					<span class="ml-1 text-gray-700">{offensive.double.join(', ')}</span>
				</div>
			{/if}
			{#if offensive.quadruple.length > 0}
				<div class="mb-1">
					<span class="font-bold text-red-600">4×</span>
					<span class="ml-1 text-gray-700">{offensive.quadruple.join(', ')}</span>
				</div>
			{/if}
			{#if offensive.half.length > 0}
				<div class="mb-1">
					<span class="font-bold text-blue-500">½×</span>
					<span class="ml-1 text-gray-700">{offensive.half.join(', ')}</span>
				</div>
			{/if}
			{#if offensive.immune.length > 0}
				<div>
					<span class="font-bold text-gray-400">0×</span>
					<span class="ml-1 text-gray-700">{offensive.immune.join(', ')}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
