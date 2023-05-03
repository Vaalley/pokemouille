import NodeCache from 'node-cache';
import { fetchAllPokemon } from '$lib/pokeapi.js';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

async function getPokemon() {
	let pokemon = cache.get('pokemon');
	if (pokemon) {
		console.log('cache hit');
		return pokemon;
	}
	console.log('cache miss, fetching pokemon');
	pokemon = await fetchAllPokemon();
	cache.set('pokemon', pokemon);
	return pokemon;
}

export { getPokemon };
