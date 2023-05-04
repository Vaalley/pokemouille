export function capitalize(str) {
	if (!str) return str; // Return the original string if it's empty or falsy
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const keepHyphen = ['Wo-Chien', 'Chi-yu'];
const keepHyphenSet = new Set(keepHyphen);
export function hyphenRemover(str) {
	if (str.indexOf('-') !== -1 && !keepHyphenSet.has(str)) {
		return str.split('-').join(' ');
	}
	return str;
}
