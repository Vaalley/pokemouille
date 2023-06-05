<script>
	export let evolutionChainData;
	import { goto } from '$app/navigation';
	import { capitalize, hyphenRemover } from '$lib/utils';

	const pokemonSpriteUrl =
		'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';

	console.log(evolutionChainData);
</script>

<div class="mx-[10%] my-12">
	<h2 class="text-2xl font-semibold mb-6 text-gray-800 underline">Evolution Chain</h2>
	<div class="flex justify-around">
		{#each evolutionChainData.pokemon_v2_evolutionchain.pokemon_v2_pokemonspecies as pokemon, index}
			<a
				class="hover:bg-gray-100 p-4"
				href={`/pokemon/${pokemon.name}`}
				on:click|preventDefault={() => {
					if (window.location.pathname === `/pokemon/${pokemon.name}`) {
						window.location.href = `${window.location.origin}/pokemon`;
					} else {
						goto(`/pokemon/${pokemon.name}`);
						window.location.href = `${window.location.origin}/pokemon/${pokemon.name}`;
					}
				}}
			>
				<div>
					<p class="text-lg font-semibold text-gray-800 text-center">
						{capitalize(hyphenRemover(pokemon.name))}
					</p>
					<img src={`${pokemonSpriteUrl}${pokemon.id}.png`} alt={pokemon.name} />
				</div>
				{#if pokemon.pokemon_v2_pokemonevolutions}
					<div class="flex flex-col">
						{#each pokemon.pokemon_v2_pokemonevolutions as evolution}
							<p class="underline font-semibold text-center">
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
