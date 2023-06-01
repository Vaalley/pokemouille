import { getMoveInfo } from '$lib/moveInfoCache.js';
import { getPokemon } from '$lib/searchCache.js';
import { GetMainInfo } from '$lib/searchFetch.js';

export async function load({ params }) {
	const { slug } = params;

	try {
		const moveInfo = await getMoveInfo(slug);
		const searchData = await getPokemon(GetMainInfo);

		return {
			moveInfo,
			searchData,
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
