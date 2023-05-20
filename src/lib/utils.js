export function capitalize(str) {
	if (!str) return str;
	return str
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

const keepHyphen = ['wo-chien', 'chi-yu'];
const keepHyphenSet = new Set(keepHyphen);
export function hyphenRemover(str) {
	if (str.indexOf('-') !== -1 && !keepHyphenSet.has(str)) {
		return str.split('-').join(' ');
	}
	return str;
}

// a function that takes a string parameter that looks like this "https://pokeapi.co/api/v2/ability/34/" and returns the id at the end of the string
export function getIdFromUrl(url) {
	const parts = url.split('/');
	return parts[parts.length - 2];
}

export function hasLevelUpEvolution(evolutionDetails) {
	return evolutionDetails.some((detail) => detail.min_level);
}

export const pokemonTypes = [
	{ name: 'normal', color: '#B8B8D0' },
	{ name: 'fire', color: '#F08030' },
	{ name: 'water', color: '#6890F0' },
	{ name: 'electric', color: '#F8D030' },
	{ name: 'grass', color: '#78C850' },
	{ name: 'ice', color: '#98D8D8' },
	{ name: 'fighting', color: '#C03028' },
	{ name: 'poison', color: '#A040A0' },
	{ name: 'ground', color: '#E0C068' },
	{ name: 'flying', color: '#A890F0' },
	{ name: 'psychic', color: '#F85888' },
	{ name: 'bug', color: '#A8B820' },
	{ name: 'rock', color: '#B8A038' },
	{ name: 'ghost', color: '#705898' },
	{ name: 'dragon', color: '#7038F8' },
	{ name: 'dark', color: '#705848' },
	{ name: 'steel', color: '#B8B8D0' },
	{ name: 'fairy', color: '#EE99AC' },
];
