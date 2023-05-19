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