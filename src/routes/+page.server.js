import { getPokemon } from '$lib/searchCache.js';
import { GetMainInfo } from '$lib/searchFetch.js';

export async function load() {
	try {
		const searchData = await getPokemon(GetMainInfo);
		return {
			searchData,
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
