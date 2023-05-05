import { getPokemonInfo } from '$lib/cacheInfo.js';
import { getPokemon } from '$lib/cache.js';
import { fetchAllPokemon } from '$lib/pokeapi.js';

export async function load({ params }) {
	const { slug } = params;

	try {
		const pokemonInfo = await getPokemonInfo(slug);
		const pokemon = await getPokemon(fetchAllPokemon);

		return {
			pokemonInfo,
			pokemon,
			status: 200
		};
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			error: 'Failed to fetch data from PokeAPI'
		};
	}
}
