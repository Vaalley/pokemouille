import { GraphQLClient } from 'graphql-request';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		'Accept': '*/*'
	},
});

export async function load({ params }) {
	const { slug } = params;

	try {
		const pokemon = await getPokemon(slug);
		const pokemonList = await getAllPokemon();

		// console.log(pokemonList);

		return {
			pokemonInfo: pokemon,
			pokemon: pokemonList,
			status: 200,
		};
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			error: 'Failed to fetch data from PokeAPI',
		};
	}
}

async function getPokemon(slug) {
	const cachedPokemon = cache.get(slug);
	if (cachedPokemon) {
		console.log(`Cache hit for ${slug}`);
		return cachedPokemon;
	}

	console.log(`Cache miss for ${slug}`);
	const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch data from PokeAPI: ${response.status}`);
	}

	const data = await response.json();
	cache.set(slug, data);

	return data;
}

async function getAllPokemon() {
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