import { getPokemonInfo } from '$lib/pokemonInfoCache.js';
import { getPokemon } from '$lib/searchCache.js';
import { fetchAllPokemon } from '$lib/searchFetch.js';

export async function load({ params, query }) {
	const { slug } = params;

	try {
		const pokemonInfo = await getPokemonInfo(slug);
		const searchData = await getPokemon(fetchAllPokemon);

		return {
			pokemonInfo,
			searchData,
			query,
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
