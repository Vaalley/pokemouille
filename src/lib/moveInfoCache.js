import NodeCache from 'node-cache';
import { fetchMoveInfo } from '$lib/moveInfoFetch';

const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 }); // 86400 = 24 hours stdTTL

async function getMoveInfo(slug) {
	let memo = {};
	const cachedMove = cache.get(slug);
	if (cachedMove) {
		console.log(`Cache hit for ${slug} ✅`);
		return cachedMove;
	}

	console.log(`Cache miss for ${slug}, fetching data 🔃`);
	const response = await fetchMoveInfo(slug);

	memo = { data: response };
	cache.set(slug, memo.data);

	// console.log(response)

	if (response.error) {
		throw new Error(response.error);
	}

	return memo.data;
}

export { getMoveInfo };
