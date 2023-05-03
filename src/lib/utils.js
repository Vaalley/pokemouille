// Write a function that takes a string and returns that string with the first letter of the first word capitalized.
export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const keepHyphen = [
	'Wo-Chien',
	'Chi-yu'
]
export function hyphenRemover(str) {
	// If the string contains an hyphan and isn't in the keepHyphen array, return the string without the hyphen and with a space instead
	if (str.includes('-') && !keepHyphen.includes(str)) {
		return str.replace('-', ' ');
	}
}