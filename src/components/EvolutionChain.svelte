<script>
	export let evolutionChainData;
	export let currentPokemonName;
	import { capitalize, hyphenRemover } from '$lib/utils';

	const pokemonSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

	function getEvolutionTriggerDetails(evolution) {
		if (evolution.pokemon_v2_evolutiontrigger.name === 'level-up') {
			return [
				evolution.min_level ? `Level: ${evolution.min_level}` : '',
				evolution.min_happiness ? `Happiness: ${evolution.min_happiness}` : '',
				evolution.time_of_day ? `Time: ${evolution.time_of_day}` : '',
				evolution.pokemon_v2_location
					? `Location: ${capitalize(hyphenRemover(evolution.pokemon_v2_location.name))}`
					: '',
				evolution.min_affection ? `Affection: ${evolution.min_affection}` : '',
				evolution.pokemonV2PokemonspecyByPartySpeciesId
					? `Need in party: ${capitalize(
							hyphenRemover(evolution.pokemonV2PokemonspecyByPartySpeciesId.name)
					  )}`
					: ''
			]
				.filter((detail) => detail !== '')
				.join(', ');
		} else if (evolution.pokemon_v2_evolutiontrigger.name === 'use-item') {
			return capitalize(hyphenRemover(evolution.pokemon_v2_item.name));
		} else if (evolution.pokemon_v2_evolutiontrigger.name === 'trade') {
			return evolution.pokemonV2ItemByHeldItemId
				? `Needs to carry: ${capitalize(hyphenRemover(evolution.pokemonV2ItemByHeldItemId.name))}`
				: '';
		}
		return '';
	}
</script>

<section class="container mx-auto mt-16">
	<h2 class="h2 font-semibold">
		Evolution Chain for {capitalize(hyphenRemover(currentPokemonName))}:
	</h2>
	<div class="mt-5 flex flex-wrap justify-around gap-5">
		{#each evolutionChainData.pokemon_v2_evolutionchain.pokemon_v2_pokemonspecies.sort((a, b) => a.id - b.id) as pokemon}
			<a
				data-sveltekit-reload
				class="p-5 transition-all hover:card hover:text-primary-500"
				href={`/pokemon/${pokemon.name}`}
			>
				<div>
					<p class="h3 text-center font-semibold">
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
								{capitalize(hyphenRemover(evolution.pokemon_v2_evolutiontrigger.name))}:
							</p>
							<p>{getEvolutionTriggerDetails(evolution)}</p>
						{/each}
					</div>
				{/if}
			</a>
			{#if pokemon.pokemon_v2_pokemons.length > 1}
				{#each pokemon.pokemon_v2_pokemons as form}
					{#if form.pokemon_v2_pokemonforms[0].form_name !== ''}
						<a
							data-sveltekit-reload
							class="p-5 transition-all hover:card hover:text-primary-500"
							href={`/pokemon/${form.pokemon_v2_pokemonforms[0].name}`}
						>
							<div>
								<p class="h3 text-center font-semibold">
									{capitalize(hyphenRemover(form.pokemon_v2_pokemonforms[0].name))}
								</p>
								<img
									class="mx-auto"
									loading="lazy"
									src={`${pokemonSpriteUrl}${form.pokemon_v2_pokemonforms[0].pokemon_id}.png`}
									alt={form.pokemon_v2_pokemonforms[0].name}
								/>
							</div>
						</a>
					{/if}
				{/each}
			{/if}
		{/each}
	</div>
</section>
