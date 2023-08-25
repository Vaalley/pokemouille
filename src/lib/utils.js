// Capitalizes the first letter of each word in a string
export function capitalize(str) {
	return str.replace(/\b\w/g, (match) => match.toUpperCase());
}

// Removes hyphens from a string, except for specific strings in the keepHyphen array
const keepHyphen = new Set(['wo-chien', 'chi-yu', 'ting-lu', 'chien-pao', 'ho-oh']);
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

// Gets the hexcode of a stat value
export function getStatColor(statValue, minStat, maxStat) {
	const colorStart = 0xd4163c;
	const colorEnd = 0x4685af;
	const percentage = (statValue - minStat) / (maxStat - minStat);
	const red = interpolateColorComponent(colorStart >> 16, colorEnd >> 16, percentage);
	const green = interpolateColorComponent(
		(colorStart >> 8) & 0xff,
		(colorEnd >> 8) & 0xff,
		percentage
	);
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
		return Math.max(...stats.map((stat) => stat.base_stat));
	} else if (parameter === 'lowest') {
		return Math.min(...stats.map((stat) => stat.base_stat));
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
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return { r, g, b };
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
	return component <= 0.03928 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
}

// An array of objects representing each Pokemon type, with a name, color property and their defensive capabilities
export const pokemonTypes = [
	{
		name: 'normal',
		color: '#B8B8D0',
		defending: {
			weak: ['fighting'],
			resist: [],
			immune: ['ghost']
		},
		attacking: {
			notVeryEffective: ['rock', 'steel'],
			superEffective: [],
			noEffect: ['ghost']
		}
	},
	{
		name: 'fire',
		color: '#F08030',
		defending: {
			weak: ['water', 'ground', 'rock'],
			resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['fire', 'water', 'rock', 'dragon'],
			superEffective: ['grass', 'ice', 'bug', 'steel'],
			noEffect: []
		}
	},
	{
		name: 'water',
		color: '#6890F0',
		defending: {
			weak: ['grass', 'electric'],
			resist: ['fire', 'water', 'ice', 'steel'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['water', 'grass', 'dragon'],
			superEffective: ['fire', 'ground', 'rock'],
			noEffect: []
		}
	},
	{
		name: 'electric',
		color: '#F8D030',
		defending: {
			weak: ['ground'],
			resist: ['electric', 'flying', 'steel'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['electric', 'grass', 'dragon'],
			superEffective: ['water', 'flying'],
			noEffect: ['ground']
		}
	},
	{
		name: 'grass',
		color: '#78C850',
		defending: {
			weak: ['fire', 'ice', 'poison', 'flying', 'bug'],
			resist: ['water', 'grass', 'electric', 'ground'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
			superEffective: ['water', 'ground', 'rock'],
			noEffect: ['ground']
		}
	},
	{
		name: 'ice',
		color: '#98D8D8',
		defending: {
			weak: ['fire', 'fighting', 'rock', 'steel'],
			resist: ['ice'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['fire', 'water', 'ice', 'steel'],
			superEffective: ['grass', 'ground', 'flying', 'dragon'],
			noEffect: []
		}
	},
	{
		name: 'fighting',
		color: '#C03028',
		defending: {
			weak: ['flying', 'psychic', 'fairy'],
			resist: ['bug', 'rock', 'dark'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
			superEffective: ['normal', 'ice', 'rock', 'dark', 'steel'],
			noEffect: ['ghost']
		}
	},
	{
		name: 'poison',
		color: '#A040A0',
		defending: {
			weak: ['ground', 'psychic'],
			resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['poison', 'ground', 'rock', 'ghost'],
			superEffective: ['grass', 'fairy'],
			noEffect: ['steel']
		}
	},
	{
		name: 'ground',
		color: '#E0C068',
		defending: {
			weak: ['water', 'grass', 'ice', 'electric'],
			resist: ['poison', 'rock'],
			immune: ['electric']
		},
		attacking: {
			notVeryEffective: ['grass', 'bug'],
			superEffective: ['fire', 'electric', 'poison', 'rock', 'steel'],
			noEffect: ['flying']
		}
	},
	{
		name: 'flying',
		color: '#A890F0',
		defending: {
			weak: ['electric', 'ice', 'rock'],
			resist: ['grass', 'fighting', 'bug'],
			immune: ['ground']
		},
		attacking: {
			notVeryEffective: ['electric', 'rock', 'steel'],
			superEffective: ['grass', 'fighting', 'bug'],
			noEffect: []
		}
	},
	{
		name: 'psychic',
		color: '#F85888',
		defending: {
			weak: ['bug', 'ghost', 'dark'],
			resist: ['fighting', 'psychic'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['psychic', 'steel'],
			superEffective: ['fighting', 'poison'],
			noEffect: ['dark']
		}
	},
	{
		name: 'bug',
		color: '#A8B820',
		defending: {
			weak: ['fire', 'flying', 'rock'],
			resist: ['grass', 'fighting', 'ground'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
			superEffective: ['grass', 'psychic', 'dark'],
			noEffect: []
		}
	},
	{
		name: 'rock',
		color: '#B8A038',
		defending: {
			weak: ['water', 'grass', 'fighting', 'ground', 'steel'],
			resist: ['normal', 'fire', 'poison', 'flying'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['fighting', 'ground', 'steel'],
			superEffective: ['fire', 'ice', 'flying', 'bug'],
			noEffect: []
		}
	},
	{
		name: 'ghost',
		color: '#705898',
		defending: {
			weak: ['ghost', 'dark'],
			resist: ['poison', 'bug'],
			immune: ['normal', 'fighting']
		},
		attacking: {
			notVeryEffective: ['dark'],
			superEffective: ['psychic', 'ghost'],
			noEffect: ['normal']
		}
	},
	{
		name: 'dragon',
		color: '#7038F8',
		defending: {
			weak: ['ice', 'dragon', 'fairy'],
			resist: ['fire', 'water', 'grass', 'electric'],
			immune: []
		},
		attacking: {
			notVeryEffective: ['steel'],
			superEffective: ['dragon'],
			noEffect: ['fairy']
		}
	},
	{
		name: 'dark',
		color: '#705848',
		defending: {
			weak: ['fighting', 'bug', 'fairy'],
			resist: ['ghost', 'dark'],
			immune: ['psychic']
		},
		attacking: {
			notVeryEffective: ['fighting', 'dragon', 'fairy'],
			superEffective: ['psychic', 'ghost'],
			noEffect: []
		}
	},
	{
		name: 'steel',
		color: '#B8B8D0',
		defending: {
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
		attacking: {
			notVeryEffective: ['fire', 'water', 'electric', 'steel'],
			superEffective: ['ice', 'rock', 'fairy'],
			noEffect: []
		}
	},
	{
		name: 'fairy',
		color: '#EE99AC',
		defending: {
			weak: ['poison', 'steel'],
			resist: ['fighting', 'bug', 'dark'],
			immune: ['dragon']
		},
		attacking: {
			notVeryEffective: ['fire', 'poison', 'steel'],
			superEffective: ['fighting', 'dragon', 'dark'],
			noEffect: []
		}
	}
];
