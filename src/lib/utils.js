// Write a function that takes a string and returns that string with the first letter of the first word capitalized.
export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const keepHyphen = [
	'Wo-Chien',
	'Chi-yu'
]
export function hyphenRemover(str) {
	// If the str contains an hyphen and isn't in the keepHyphen array, return the string without the hyphen and with a space instead if it's in the keepHyphen array return with the hyphen
	if (str.includes('-') && !keepHyphen.includes(str)) {
		return str.replace('-', ' ');
	}
	return str;
}