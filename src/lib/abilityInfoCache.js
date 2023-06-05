import NodeCache from 'node-cache';
import { fetchAbilityInfo } from '$lib/abilityInfoFetch';

const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 }); // 86400 = 24 hours stdTTL

async function getAbilityInfo(slug) {
	let memo = {};
	const cachedAbility = cache.get(slug);
	if (cachedAbility) {
		console.log(`Cache hit for ${slug} ✅`);
		return cachedAbility;
	}

	console.log(`Cache miss for ${slug}, fetching data 🔃`);
	const response = await fetchAbilityInfo(slug);

	memo = { data: response };
	cache.set(slug, memo.data);

	// console.log(response)

	if (response.error) {
		throw new Error(response.error);
	}

	return memo.data;
}

export { getAbilityInfo };
