import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

async function getMoveInfo(slug) {
	const cachedMove = cache.get(slug);
	if (cachedMove) {
		console.log(`cache hit for ${slug}`);
		return cachedMove;
	}

	console.log(`cache miss for ${slug}`);
	const response = await fetch(`https://pokeapi.co/api/v2/move/${slug}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch data from PokeAPI: ${response.status}`);
	}

	const data = await response.json();
	cache.set(slug, data);

	return data;
}

export { getMoveInfo };
