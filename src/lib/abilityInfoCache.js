import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

async function getAbilityInfo(slug) {
	const cachedAbility = cache.get(slug);
	if (cachedAbility) {
		console.log(`Cache hit for ${slug}`);
		return cachedAbility;
	}

	console.log(`Cache miss for ${slug}`);
	const response = await fetch(`https://pokeapi.co/api/v2/ability/${slug}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch data from PokeAPI: ${response.status}`);
	}

	const data = await response.json();
	cache.set(slug, data);

	return data;
}

export { getAbilityInfo };
