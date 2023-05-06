export function capitalize(str) {
	if (!str) return str;
	return str
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}


const keepHyphen = ['Wo-Chien', 'Chi-yu'];
const keepHyphenSet = new Set(keepHyphen);
export function hyphenRemover(str) {
	if (str.indexOf('-') !== -1 && !keepHyphenSet.has(str)) {
		return str.split('-').join(' ');
	}
	return str;
}
