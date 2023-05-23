<script>
	export let evolution;
	import { capitalize, hyphenRemover, getIdFromUrl } from '$lib/utils';
	import { goto } from '$app/navigation';
	const pokemonSpritesBaseUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
</script>

<a
	class="flex flex-col items-center w-fit bg-gray-200 p-4 transition-colors duration-300 hover:bg-gray-300"
	href={`/pokemon/${evolution.species.name}`}
	on:click|preventDefault={() => {
		if (window.location.pathname === `/pokemon/${evolution.species.name}`) {
			window.location.href = `${window.location.origin}/pokemon`;
		} else {
			goto(`/pokemon/${evolution.species.name}`);
			window.location.href = `${window.location.origin}/pokemon/${evolution.species.name}`;
		}
	}}
>
	<p class="text-lg">{capitalize(hyphenRemover(evolution.species.name))}</p>
	{#each evolution.evolution_details as detail}
		{#if detail.min_level}
			<p>Level {detail.min_level}</p>
		{/if}
		{#if detail.trigger.name === 'use-item'}
			<p>Use {capitalize(hyphenRemover(detail.item.name))}</p>
		{/if}
		{#if detail.trigger.name === 'trade'}
			<p>Trade</p>
		{/if}
		{#if detail.trigger.name === 'other'}
			<p>Other requirement</p>
		{/if}
		{#if detail.min_affection}
			<p>Min Affection: {detail.min_affection}</p>
		{/if}
		{#if detail.min_happiness}
			<p>Min Happiness: {detail.min_happiness}</p>
		{/if}
		{#if detail.location}
			<p>Location: {capitalize(hyphenRemover(detail.location.name))}</p>
		{/if}
		{#if detail.time_of_day}
			<p>Time of Day: {capitalize(hyphenRemover(detail.time_of_day))}</p>
		{/if}
		<!-- Add more conditions for other trigger types -->
	{/each}
	<img
		src={`${pokemonSpritesBaseUrl}/${getIdFromUrl(evolution.species.url)}.png`}
		alt={evolution.species.name}
	/>
</a>
