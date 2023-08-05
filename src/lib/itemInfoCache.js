import NodeCache from 'node-cache';
import { fetchItemInfo } from '$lib/itemInfoFetch';

const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 }); // 86400 = 24 hours stdTTL

async function getItemInfo(slug) {
	let memo = {};
	const cachedItem = cache.get(slug);
	if (cachedItem) {
		console.log(`Cache hit for ${slug} ✅`);
		return cachedItem;
	}

	console.log(`Cache miss for ${slug}, fetching data 🔃`);
	const response = await fetchItemInfo(slug);

	memo = { data: response };
	cache.set(slug, memo.data);

	// console.log(response)

	if (response.error) {
		throw new Error(response.error);
	}

	return memo.data;
}

export { getItemInfo };
