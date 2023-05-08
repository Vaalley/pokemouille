import NodeCache from 'node-cache';
import { fetchAllPokemon } from '$lib/searchFetch.js';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

const getPokemon = (() => {
	let memo = {};
	return async () => {
		const cached = cache.get('pokemon');
		if (cached) {
			console.log('cache hit');
			return cached;
		}
		console.log('cache miss, fetching pokemon');
		const result = await fetchAllPokemon();
		memo = { pokemon: result };
		cache.set('pokemon', memo.pokemon);
		return memo.pokemon;
	};
})();

export { getPokemon };
