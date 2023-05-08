import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		Accept: '*/*'
	}
});

async function fetchAllPokemon() {
	const countData = await fetch('https://pokeapi.co/api/v2/pokedex/1/').then((res) => res.json());
	const count = countData.pokemon_entries.length - 2;
	try {
		const query = `
		query allPokemon {
			pokemon_v2_pokemon(order_by: {id: asc}, limit: ${count}) {
				name
				id
				pokemon_v2_pokemontypes_aggregate {
					nodes {
						pokemon_v2_type {
							name
						}
					}
				}
			}
			pokemon_v2_ability {
				id
				name
			}
		}
`;
		return await client.request(query);
	} catch (error) {
		throw new Error('Error fetching pokemon data');
	}
}

export { fetchAllPokemon };
