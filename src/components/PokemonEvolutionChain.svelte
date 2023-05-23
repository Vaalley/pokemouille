<script>
	export let pokemonEvolutionChain;

	import EvolutionLink from './EvolutionLink.svelte';
</script>

<div class=" py-8">
	<div class="container mx-auto">
		<h2 class="text-2xl font-semibold mb-6">Evolution Chain:</h2>
		<div class="flex justify-around">
			{#if pokemonEvolutionChain.chain.species}
				<EvolutionLink evolution={pokemonEvolutionChain.chain} />
			{/if}
			{#if pokemonEvolutionChain.chain.evolves_to}
				{#each pokemonEvolutionChain.chain.evolves_to as evolvesTo}
					<EvolutionLink evolution={evolvesTo} />
					{#if evolvesTo.evolves_to}
						{#each evolvesTo.evolves_to as secondEvolvesTo}
							<EvolutionLink evolution={secondEvolvesTo} />
						{/each}
					{/if}
				{/each}
			{/if}
		</div>
	</div>
</div>
