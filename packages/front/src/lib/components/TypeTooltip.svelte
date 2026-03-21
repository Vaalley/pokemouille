<script lang="ts">
	import { getDefensiveEffectiveness } from '$lib/type-effectiveness';
	import TypeBadge from './TypeBadge.svelte';

	const { types }: { types: { name: string; slug: string }[] } = $props();

	const effectiveness = $derived(getDefensiveEffectiveness(types.map((t) => t.slug)));
	let visible = $state(false);
</script>

<div
	class="relative inline-flex gap-1"
	onmouseenter={() => (visible = true)}
	onmouseleave={() => (visible = false)}
	role="group"
>
	<a href="/types?types={types.map((t) => t.slug).join(',')}" class="inline-flex gap-1">
		{#each types as type}
			<TypeBadge slug={type.slug} name={type.name} />
		{/each}
	</a>

	{#if visible}
		<div class="absolute top-full z-50 mt-1 w-56 border-2 bg-white p-2 text-sm">
			{#if effectiveness.quadruple.length > 0}
				<div class="mb-1">
					<span class="font-bold text-red-600">4×</span>
					<span class="ml-1 text-gray-700">{effectiveness.quadruple.join(', ')}</span>
				</div>
			{/if}
			{#if effectiveness.double.length > 0}
				<div class="mb-1">
					<span class="font-bold text-orange-500">2×</span>
					<span class="ml-1 text-gray-700">{effectiveness.double.join(', ')}</span>
				</div>
			{/if}
			{#if effectiveness.half.length > 0}
				<div class="mb-1">
					<span class="font-bold text-blue-500">½×</span>
					<span class="ml-1 text-gray-700">{effectiveness.half.join(', ')}</span>
				</div>
			{/if}
			{#if effectiveness.quarter.length > 0}
				<div class="mb-1">
					<span class="font-bold text-blue-800">¼×</span>
					<span class="ml-1 text-gray-700">{effectiveness.quarter.join(', ')}</span>
				</div>
			{/if}
			{#if effectiveness.immune.length > 0}
				<div>
					<span class="font-bold text-gray-400">0×</span>
					<span class="ml-1 text-gray-700">{effectiveness.immune.join(', ')}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
