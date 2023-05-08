import { getAbilityInfo } from '$lib/abilityInfoCache.js';
import { getPokemon } from '$lib/searchCache.js';
import { fetchAllPokemon } from '$lib/searchFetch.js';

export async function load({ params }) {
	const { slug } = params;

	try {
		const abilityInfo = await getAbilityInfo(slug);
		const pokemon = await getPokemon(fetchAllPokemon);

		return {
			abilityInfo,
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
