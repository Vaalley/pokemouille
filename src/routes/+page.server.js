import { GraphQLClient } from 'graphql-request';
import NodeCache from 'node-cache';
export const _myCache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		'Accept': '*/*'
	},
});

export async function load() {
	if (_myCache.get('pokemon') == undefined) {
		_myCache.set('pokemon', await fetchAllPokemon());
		console.log('cache miss, retrieved pokemon');
	} else {
		console.log('cache hit');
	}

	return {
		pokemon: _myCache.get('pokemon'),
		status: 200,
	};
}

async function fetchAllPokemon() {
	const countData = await fetch("https://pokeapi.co/api/v2/pokedex/1/").then(res => res.json());
	const count = countData.pokemon_entries.length - 2;
	// console.log(count);
	try {
		const query = `
		query allPokemon {
			pokemon_v2_pokemon(order_by: {id: asc}, limit: ${count}) {
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
