import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		'Accept': '*/*'
	},
});

export async function load() {
	const data = await fetchPokemon();

	// console.log(data.pokemon_v2_pokemon)
	return {
		pokemon: data.pokemon_v2_pokemon,
		status: 200,
	}
}

async function fetchPokemon() {
	try {
		const query = `
		query allPokemon {
			pokemon_v2_pokemon(order_by: {id: asc}) {
				name
				id
				pokemon_v2_pokemonsprites {
					sprites
				}
				pokemon_v2_pokemontypes_aggregate {
					nodes {
						pokemon_v2_type {
							name
						}
					}
				}
			}
		}		
`;
		return await client.request(query);
	} catch (error) {
		console.error(error);
	}
}
