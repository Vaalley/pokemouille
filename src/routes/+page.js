import { GraphQLClient } from 'graphql-request';
// import NodeCache from "node-cache";
// const myCache = new NodeCache({ stdTTL: 60 });

// myCache.set("hello", "world");

const client = new GraphQLClient('https://beta.pokeapi.co/graphql/v1beta', {
	headers: {
		'Content-Type': 'application/json',
		'Accept': '*/*'
	},
});

export async function load({ fetch }) {
	const countData = await fetch("https://pokeapi.co/api/v2/pokedex/1/").then(res => res.json());
	const count = countData.pokemon_entries.length - 2;
	const data = await fetchAllPokemon(count);

	// console.log(count);
	// console.log(data.pokemon_v2_pokemon)
	return {
		pokemon: data.pokemon_v2_pokemon,
		status: 200,
	}
}

async function fetchAllPokemon(count = 151) {
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
