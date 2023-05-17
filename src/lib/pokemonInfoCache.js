import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 21600, checkperiod: 120 }); // 21600 = 6 hours stdTTL

async function getPokemonInfo(slug) {
	const cachedPokemon = cache.get(slug);
	if (cachedPokemon) {
		console.log(`Cache hit for ${slug}`);
		return cachedPokemon;
	}

	console.log(`Cache miss for ${slug}`);
	const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);

	if (!response.ok) {
		throw new Error(`Failed to fetch data from PokeAPI: ${response.status}`);
	}

	const data = await response.json();
	cache.set(slug, data);

	return data;
}

async function getEvolutionChain(slug) {
	const cachedEvolutionChain = cache.get(`${slug}-evolution-chain`);
	if (cachedEvolutionChain) {
		console.log(`Cache hit for ${slug} evolution chain`);
		return cachedEvolutionChain;
	}

	console.log(`Cache miss for ${slug} evolution chain`);
	const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${slug}`);
	const speciesData = await response.json();

	const evolutionChainUrl = speciesData.evolution_chain.url;
	const evolutionChainResponse = await fetch(evolutionChainUrl);
	const evolutionChainData = await evolutionChainResponse.json();

	cache.set(`${slug}-evolution-chain`, evolutionChainData);
	return evolutionChainData.chain;
}

export { getPokemonInfo, getEvolutionChain };
