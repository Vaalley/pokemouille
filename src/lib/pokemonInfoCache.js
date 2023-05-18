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

	const cachedEvolutionChain = cache.get(`${slug}-evolution-chain`);
	let evolutionChainData;
	if (cachedEvolutionChain) {
		console.log(`Cache hit for ${slug} evolution chain`);
		evolutionChainData = cachedEvolutionChain;
	} else {
		console.log(`Cache miss for ${slug} evolution chain`);
		const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${slug}`);
		const speciesData = await speciesResponse.json();

		const evolutionChainUrl = speciesData.evolution_chain.url;
		const evolutionChainResponse = await fetch(evolutionChainUrl);
		evolutionChainData = await evolutionChainResponse.json();

		cache.set(`${slug}-evolution-chain`, evolutionChainData);
	}

	cache.set(slug, { ...data, evolutionChain: evolutionChainData });

	return { ...data, evolutionChain: evolutionChainData };
}

export { getPokemonInfo };
