import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		Accept: '*/*'
	}
});

async function fetchPokemonInfo(slug) {
	let pokemonId = 0
	let pokemonName = "";

	// If type of slug is string, then set pokemonName to slug, else if it's a integer, then set pokemonId to slug
	if (typeof slug === 'string') {
		pokemonName = slug;
	} else {
		pokemonId = slug
	}

	try {
		const query = `
		query GetPokemonInfo {
			pokemon_v2_pokemon(where: {_or: [{id: {_eq: ${pokemonId}}}, {name: {_eq: "${pokemonName}"}}]}) {
				name
				id
				is_default
				height
				weight
				pokemon_v2_pokemontypes {
					pokemon_v2_type {
						name
					}
				}
				pokemon_v2_pokemonabilities {
					is_hidden
					pokemon_v2_ability {
						name
					}
				}
				pokemon_v2_pokemonstats {
					effort
					base_stat
					pokemon_v2_stat {
						name
					}
				}
				pokemon_v2_pokemonmoves {
					level
					id
					pokemon_v2_move {
						accuracy
						name
						power
						pp
						priority
						move_effect_chance
						pokemon_v2_moveeffect {
							pokemon_v2_moveeffecteffecttexts {
								effect
							}
						}
						pokemon_v2_type {
							name
						}
					}
				}
				pokemon_v2_pokemonspecy {
					pokemon_v2_evolutionchain {
						pokemon_v2_pokemonspecies {
							name
							id
							is_baby
							pokemon_v2_pokemonevolutions {
								pokemon_v2_evolutiontrigger {
									name
								}
								min_level
								min_happiness
								min_affection
								pokemon_v2_item {
									name
								}
								time_of_day
								pokemon_v2_location {
									name
								}
								party_species_id
								pokemonV2PokemonspecyByPartySpeciesId {
									name
								}
								pokemonV2ItemByHeldItemId {
									name
								}
							}
						}
					}
				}
			}
		}
`;
		return await client.request(query);
	} catch (error) {
		throw new Error('Error fetching pokemon data ❌');
	}
}

export { fetchPokemonInfo };
