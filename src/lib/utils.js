// Capitalizes the first letter of each word in a string
export function capitalize(str) {
	if (!str) return str;
	return str
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

// Removes hyphens from a string, except for specific strings in the keepHyphen array
const keepHyphen = ['wo-chien', 'chi-yu'];
const keepHyphenSet = new Set(keepHyphen);
export function hyphenRemover(str) {
	if (str.indexOf('-') !== -1 && !keepHyphenSet.has(str)) {
		return str.split('-').join(' ');
	}
	return str;
}

// Extracts the id from a URL string in the format "https://pokeapi.co/api/v2/ability/34/"
export function getIdFromUrl(url) {
	const parts = url.split('/');
	return parts[parts.length - 2];
}

// An array of objects representing each Pokemon type, with a name and color property
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

// Gets the hexcode of a stat value
export function getStatColor(statValue) {
	const maxStatValue = 160; // Assuming 255 is the maximum stat value
	const minStatValue = 20; // Assuming 0 is the minimum stat value
	const colorStart = "#ff0000"; // Red
	const colorEnd = "#00ff00"; // Green

	// Calculate the percentage of the stat value relative to the maximum and minimum values
	const percentage = (statValue - minStatValue) / (maxStatValue - minStatValue);

	// Calculate the color based on the percentage using the gradient between colorStart and colorEnd
	const red = parseInt(colorStart.substring(1, 3), 16) * (1 - percentage) + parseInt(colorEnd.substring(1, 3), 16) * percentage;
	const green = parseInt(colorStart.substring(3, 5), 16) * (1 - percentage) + parseInt(colorEnd.substring(3, 5), 16) * percentage;
	const blue = parseInt(colorStart.substring(5, 7), 16) * (1 - percentage) + parseInt(colorEnd.substring(5, 7), 16) * percentage;

	// Convert the RGB values to a hex code
	const hex = "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
	// console.log(statValue);
	// console.log(hex);

	// Return the hex code as a string
	return hex;
}

// Gets the text color of a background color
export function getTextColor(backgroundColor) {
	// Convert the background color to RGB values
	const rgb = hexToRgb(backgroundColor);

	// Calculate the relative luminance of the color
	const luminance = calculateLuminance(rgb.r, rgb.g, rgb.b);

	// Use the contrast ratio to determine the text color
	if (luminance > 0.5) {
		return '#000000'; // Set text color to black
	} else {
		return '#ffffff'; // Set text color to white
	}
}

// Converts a hex color to RGB
function hexToRgb(hex) {
	const match = hex.replace('#', '').match(/.{1,2}/g);
	return {
		r: parseInt(match[0], 16),
		g: parseInt(match[1], 16),
		b: parseInt(match[2], 16),
	};
}

// Calculates the luminance of a color
function calculateLuminance(r, g, b) {
	const rsrgb = r / 255;
	const gsrgb = g / 255;
	const bsrgb = b / 255;

	const rlinear = rsrgb <= 0.03928 ? rsrgb / 12.92 : ((rsrgb + 0.055) / 1.055) ** 2.4;
	const glinear = gsrgb <= 0.03928 ? gsrgb / 12.92 : ((gsrgb + 0.055) / 1.055) ** 2.4;
	const blinear = bsrgb <= 0.03928 ? bsrgb / 12.92 : ((bsrgb + 0.055) / 1.055) ** 2.4;

	return 0.2126 * rlinear + 0.7152 * glinear + 0.0722 * blinear;
}

// Fetches the move data from the pokeapi
export async function fetchMoveData(moveUrl) {
	const response = await fetch(moveUrl);
	const data = await response.json();
	return {
		type: capitalize(data.type.name),
		power: data.power,
		category: data.damage_class.name
	};
}