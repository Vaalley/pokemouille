import { getPokemon } from '$lib/searchCache.js';
import { fetchAllPokemon } from '$lib/searchFetch.js';

export async function load() {
	try {
		const pokemon = await getPokemon(fetchAllPokemon);
		return {
			pokemon,
			status: 200
		};
	} catch (error) {
		console.log(error);
		return {
			pokemon: null,
			status: 500
		};
	}
}
