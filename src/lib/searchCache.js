import NodeCache from 'node-cache';
import { GetMainInfo } from '$lib/searchFetch.js';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

const getPokemon = (() => {
	let memo = {};
	return async () => {
		const cached = cache.get('data');
		if (cached) {
			console.log('cache hit ✅');
			// console.log(cached);
			return cached;
		}
		console.log('cache miss, fetching data 🔃');
		const result = await GetMainInfo();
		memo = { data: result };
		cache.set('data', memo.data);
		return memo.data;
	};
})();

export { getPokemon };
