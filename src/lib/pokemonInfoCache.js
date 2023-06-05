import NodeCache from 'node-cache';
import { fetchPokemonInfo } from '$lib/pokemonInfoFetch';

const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 }); // 86400 = 24 hours stdTTL

async function getPokemonInfo(slug) {
	let memo = {};
	const cachedPokemon = cache.get(slug);
	if (cachedPokemon) {
		console.log(`Cache hit for ${slug} ✅`);
		return cachedPokemon;
	}

	console.log(`Cache miss for ${slug}, fetching data 🔃`);
	const response = await fetchPokemonInfo(slug);

	memo = { data: response };
	cache.set(slug, memo.data);

	// console.log(response)

	if (response.error) {
		throw new Error(response.error);
	}

	return memo.data;
}

export { getPokemonInfo };
