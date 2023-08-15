// Capitalizes the first letter of each word in a string
export function capitalize(str) {
	return str.replace(/\b\w/g, match => match.toUpperCase());
}

// Removes hyphens from a string, except for specific strings in the keepHyphen array
const keepHyphen = new Set(['wo-chien', 'chi-yu', 'ting-lu', 'chien-pao']);
export function hyphenRemover(str) {
	if (str.includes('-') && !keepHyphen.has(str)) {
		return str.replace(/-/g, ' ');
	}
	return str;
}

// Extracts the id from a URL string in the format "https://pokeapi.co/api/v2/ability/34/"
export function getIdFromUrl(urlString) {
	const match = urlString.match(/\/(\d+)\/$/);
	return match ? match[1] : null;
}

// An array of objects representing each Pokemon type, with a name, color property and their defensive capabilities
export const pokemonTypes = [
	{
		name: 'normal',
		color: '#B8B8D0',
		weak: ['fighting'],
		resist: [],
		immune: ['ghost']
	},
	{
		name: 'fire',
		color: '#F08030',
		weak: ['water', 'ground', 'rock'],
		resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
		immune: []
	},
	{
		name: 'water',
		color: '#6890F0',
		weak: ['grass', 'electric'],
		resist: ['fire', 'water', 'ice', 'steel'],
		immune: []
	},
	{
		name: 'grass',
		color: '#78C850',
		weak: ['fire', 'ice', 'poison', 'flying', 'bug'],
		resist: ['water', 'grass', 'electric', 'ground'],
		immune: []
	},
	{
		name: 'electric',
		color: '#F8D030',
		weak: ['ground'],
		resist: ['electric', 'flying', 'steel'],
		immune: []
	},
	{
		name: 'ice',
		color: '#98D8D8',
		weak: ['fire', 'fighting', 'rock', 'steel'],
		resist: ['ice'],
		immune: []
	},
	{
		name: 'fighting',
		color: '#C03028',
		weak: ['flying', 'psychic', 'fairy'],
		resist: ['bug', 'rock', 'dark'],
		immune: []
	},
	{
		name: 'poison',
		color: '#A040A0',
		weak: ['ground', 'psychic'],
		resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
		immune: []
	},
	{
		name: 'ground',
		color: '#E0C068',
		weak: ['water', 'grass', 'ice', 'electric'],
		resist: ['poison', 'rock'],
		immune: ['electric']
	},
	{
		name: 'flying',
		color: '#A890F0',
		weak: ['electric', 'ice', 'rock'],
		resist: ['grass', 'fighting', 'bug'],
		immune: ['ground']
	},
	{
		name: 'psychic',
		color: '#F85888',
		weak: ['bug', 'ghost', 'dark'],
		resist: ['fighting', 'psychic'],
		immune: []
	},
	{
		name: 'bug',
		color: '#A8B820',
		weak: ['fire', 'flying', 'rock'],
		resist: ['grass', 'fighting', 'ground'],
		immune: []
	},
	{
		name: 'rock',
		color: '#B8A038',
		weak: ['water', 'grass', 'fighting', 'ground', 'steel'],
		resist: ['normal', 'fire', 'poison', 'flying'],
		immune: []
	},
	{
		name: 'ghost',
		color: '#705898',
		weak: ['ghost', 'dark'],
		resist: ['poison', 'bug'],
		immune: ['normal', 'fighting']
	},
	{
		name: 'dragon',
		color: '#7038F8',
		weak: ['ice', 'dragon', 'fairy'],
		resist: ['fire', 'water', 'grass', 'electric'],
		immune: []
	},
	{
		name: 'dark',
		color: '#705848',
		weak: ['fighting', 'bug', 'fairy'],
		resist: ['ghost', 'dark'],
		immune: ['psychic']
	},
	{
		name: 'steel',
		color: '#B8B8D0',
		weak: ['fire', 'fighting', 'ground'],
		resist: [
			'normal',
			'grass',
			'ice',
			'flying',
			'psychic',
			'bug',
			'rock',
			'dragon',
			'steel',
			'fairy'
		],
		immune: ['poison']
	},
	{
		name: 'fairy',
		color: '#EE99AC',
		weak: ['poison', 'steel'],
		resist: ['fighting', 'bug', 'dark'],
		immune: ['dragon']
	}
];

// Gets the hexcode of a stat value
export function getStatColor(statValue, minStat, maxStat) {
	const colorStart = 0xd4163c;
	const colorEnd = 0x4685af;
	const percentage = (statValue - minStat) / (maxStat - minStat);
	const red = interpolateColorComponent(colorStart >> 16, colorEnd >> 16, percentage);
	const green = interpolateColorComponent((colorStart >> 8) & 0xff, (colorEnd >> 8) & 0xff, percentage);
	const blue = interpolateColorComponent(colorStart & 0xff, colorEnd & 0xff, percentage);
	const hex = `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, '0')}`;
	return hex;
}

function interpolateColorComponent(start, end, percentage) {
	return Math.floor(start * (1 - percentage) + end * percentage);
}

// Gets the extreme value of a stat
export function getExtremeValue(stats, parameter) {
	if (parameter === 'highest') {
		return Math.max(...stats.map(stat => stat.base_stat));
	} else if (parameter === 'lowest') {
		return Math.min(...stats.map(stat => stat.base_stat));
	}
}

// Gets text color based on background color luminance
export function getTextColor(backgroundColor) {
	const { r, g, b } = hexToRgb(backgroundColor);
	const luminance = calculateLuminance(r, g, b);
	return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Converts a hex string to an object
function hexToRgb(hex) {
	const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
	if (!match) {
		throw new Error('Invalid hex color');
	}
	const [, r, g, b] = match;
	return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) };
}

// Calculates the luminance of a color
function calculateLuminance(r, g, b) {
	const rsrgb = r / 255;
	const gsrgb = g / 255;
	const bsrgb = b / 255;
	const rlinear = calculateLinear(rsrgb);
	const glinear = calculateLinear(gsrgb);
	const blinear = calculateLinear(bsrgb);
	return 0.2126 * rlinear + 0.7152 * glinear + 0.0722 * blinear;
}

// Calculates the linear value of a color
function calculateLinear(component) {
	return component <= 0.03928 ? component / 12.92 : Math.pow((component + 0.055) / 1.055, 2.4);
}