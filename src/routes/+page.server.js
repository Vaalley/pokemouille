import { getPokemon } from '$lib/cache.js';
import { fetchAllPokemon } from '$lib/pokeapi.js';


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
