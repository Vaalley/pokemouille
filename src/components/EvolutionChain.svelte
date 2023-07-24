<script>
	export let evolutionChainData;
	export let currentPokemonName;
	import { capitalize, hyphenRemover } from '$lib/utils';

	const pokemonSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

	console.log(evolutionChainData);
</script>

<!-- TODO: Show alternate forms under evolution -->
<div class="container mx-auto my-24">
	<h2 class="h2 font-semibold underline">
		Evolution Chain for {capitalize(hyphenRemover(currentPokemonName))}:
	</h2>
	<div class="flex gap-6 mt-6">
		{#each evolutionChainData.pokemon_v2_evolutionchain.pokemon_v2_pokemonspecies.sort((a, b) => a.id - b.id) as pokemon}
			<a
				data-sveltekit-reload
				class="hover:bg-secondary-hover-token p-6 transition-all"
				href={`/pokemon/${pokemon.name}`}
			>
				<div>
					<p class="h3 font-semibold text-center">
						{capitalize(hyphenRemover(pokemon.name))}
					</p>
					<img
						class="mx-auto"
						loading="lazy"
						src={`${pokemonSpriteUrl}${pokemon.id}.png`}
						alt={pokemon.name}
					/>
				</div>
				{#if pokemon.pokemon_v2_pokemonevolutions}
					<div class="flex flex-col">
						{#each pokemon.pokemon_v2_pokemonevolutions as evolution}
							<p class="h4 font-semibold">
								{capitalize(hyphenRemover(evolution.pokemon_v2_evolutiontrigger.name))}
								:
							</p>
							{#if evolution.pokemon_v2_evolutiontrigger.name === 'level-up'}
								{#if evolution.min_level}
									<p>Level: {evolution.min_level}</p>
								{/if}
								{#if evolution.min_happiness}
									<p>Happiness: {evolution.min_happiness}</p>
								{/if}
								{#if evolution.time_of_day}
									<p>Time: {evolution.time_of_day}</p>
								{/if}
								{#if evolution.pokemon_v2_location}
									<p>
										Location: {capitalize(hyphenRemover(evolution.pokemon_v2_location.name))}
									</p>
								{/if}
								{#if evolution.min_affection}
									<p>Affection: {evolution.min_affection}</p>
								{/if}
								{#if evolution.pokemonV2PokemonspecyByPartySpeciesId}
									<p>
										Need in party: {capitalize(
											hyphenRemover(evolution.pokemonV2PokemonspecyByPartySpeciesId.name)
										)}
									</p>
								{/if}
							{/if}
							{#if evolution.pokemon_v2_evolutiontrigger.name === 'use-item'}
								<p>{capitalize(hyphenRemover(evolution.pokemon_v2_item.name))}</p>
							{/if}
							{#if evolution.pokemon_v2_evolutiontrigger.name === 'trade'}
								{#if evolution.pokemonV2ItemByHeldItemId}
									<p>
										Needs to carry: {capitalize(
											hyphenRemover(evolution.pokemonV2ItemByHeldItemId.name)
										)}
									</p>
								{/if}
							{/if}
						{/each}
					</div>
				{/if}
			</a>
		{/each}
	</div>
</div>
