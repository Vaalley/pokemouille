// Write a function that takes a string and returns that string with the first letter of the first word capitalized.
export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}