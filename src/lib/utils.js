// Capitalizes the first letter of each word in a string
export function capitalize(str) {
	return str.replace(/\b\w/g, (match) => match.toUpperCase());
}

// Removes hyphens from a string, except for specific strings in the keepHyphen array
const keepHyphen = new Set(['wo-chien', 'chi-yu', 'ting-lu', 'chien-pao', 'ho-oh']);
export function hyphenRemover(str) {
	return keepHyphen.has(str) ? str : str.replace(/-/g, ' ');
}


// Extracts the id from a URL string in the format "https://pokeapi.co/api/v2/ability/34/"
export function getIdFromUrl(urlString) {
	const match = urlString.match(/\/(\d+)\/$/);
	return match ? match[1] : null;
}

// Gets the hexcode of a stat value
export function getStatColor(statValue, minStat, maxStat) {
	const colorStart = 0xff4d4d;
	const colorEnd = 0x43d696;
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
	const baseStats = stats.map((stat) => stat.base_stat);
	if (parameter === 'highest') {
		return Math.max(...baseStats);
	} else if (parameter === 'lowest') {
		return Math.min(...baseStats);
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
		color: '#888484',
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
		color: '#e56140',
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
		color: '#299ade',
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
		color: '#e0bb3a',
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
		color: '#439740',
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
		color: '#44c8c8',
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
		color: '#e58f2e',
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
		color: '#9257c7',
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
		color: '#a57340',
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
		color: '#73aace',
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
		color: '#ea6d8b',
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
		color: '#a09e35',
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
		color: '#a9a383',
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
		color: '#6f466f',
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
		color: '#5570b9',
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
		color: '#4f4747',
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
		color: '#73b0ca',
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
		color: '#e18ede',
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
