import { getPokemonInfo } from '$lib/cacheInfo.js';

export async function load({ params }) {
	const { slug } = params;

	try {
		const pokemon = await getPokemonInfo(slug);

		return {
			pokemonInfo: pokemon,
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
