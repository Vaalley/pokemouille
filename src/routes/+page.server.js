import { GraphQLClient } from 'graphql-request';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		'Accept': '*/*'
	},
});

export async function load() {
	try {
		const pokemon = await getPokemon();
		return {
			pokemon,
			status: 200,
		};
	} catch (error) {
		console.log(error);
		return {
			pokemon: null,
			status: 500,
		};
	}
}

async function getPokemon() {
	let pokemon = cache.get('pokemon');
	if (pokemon) {
		console.log('cache hit');
		return pokemon;
	}
	console.log('cache miss, fetching pokemon');
	pokemon = await fetchAllPokemon();
	cache.set('pokemon', pokemon);
	return pokemon;
}

async function fetchAllPokemon() {
	const countData = await fetch("https://pokeapi.co/api/v2/pokedex/1/").then(res => res.json());
	const count = countData.pokemon_entries.length - 2;
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
		throw new Error('Error fetching pokemon data');
	}
}