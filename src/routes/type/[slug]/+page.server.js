import { pokemonTypes } from '$lib/utils.js';
import { getMainInfo } from '$lib/mainInfoCache.js';

export async function load({ params }) {
	const { slug } = params;

	try {
		const typeInfo = pokemonTypes.find((type) => type.name === slug); // Find the type info based on the slug
		const searchData = await getMainInfo();

		return {
			typeInfo,
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
