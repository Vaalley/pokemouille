import NodeCache from 'node-cache';
import { fetchMainInfo } from '$lib/mainInfoFetch.js';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

const getMainInfo = (() => {
	let memo = {};

	return async () => {
		const cached = cache.get('data');
		if (cached) {
			console.log('cache hit ✅');
			// console.log(cached);
			return cached;
		}

		console.log('cache miss, fetching data 🔃');
		const result = await fetchMainInfo();

		memo = { data: result };
		cache.set('data', memo.data);

		return memo.data;
	};
})();

export { getMainInfo };