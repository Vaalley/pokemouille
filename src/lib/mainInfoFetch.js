import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta');

async function fetchMainInfo() {
	try {
		const query = `
		query GetMainInfo {
			pokemon_v2_pokemon {
				name
				pokemon_v2_pokemontypes {
					pokemon_v2_type {
						name
					}
				}
				is_default
				id
			}
			pokemon_v2_ability {
				name
			}
			pokemon_v2_move {
				name
				pokemon_v2_type {
					name
				}
			}
			pokemon_v2_item {
				name
			}
		}
`;
		return await client.request(query);
	} catch (error) {
		throw new Error(`Error fetching main data ❌: ${error}`);
	}
}

export { fetchMainInfo };
