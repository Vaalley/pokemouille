import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta');

async function fetchMoveInfo(slug) {
	let moveName = slug;

	try {
		const query = `
		query GetMoveInfo {
			pokemon_v2_move(where: {name: {_eq: "${moveName}"}}) {
				name
				id
				pokemon_v2_generation {
					name
				}
				pokemon_v2_moveflavortexts(where: {language_id: {_eq: 9}}, limit: 1) {
					flavor_text
				}
				priority
				pp
				power
				pokemon_v2_type {
					name
				}
				pokemon_v2_pokemonmoves(distinct_on: pokemon_id) {
					pokemon_v2_pokemon {
						name
						id
					}
				}
				accuracy
				move_damage_class_id
				pokemon_v2_moveeffect {
					pokemon_v2_moveeffecteffecttexts {
						effect
						short_effect
					}
				}
				move_effect_chance
			}
		}
		
`;
		return await client.request(query);
	} catch (error) {
		throw new Error(`Error fetching move data ❌: ${error}`);
	}
}

export { fetchMoveInfo };
