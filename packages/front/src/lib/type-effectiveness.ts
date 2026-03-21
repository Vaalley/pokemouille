// Multipliers: attacking type → defending type → multiplier
// 0 = immune, 0.5 = resist, 2 = weak
const chart: Record<string, Record<string, number>> = {
	normal: { rock: 0.5, ghost: 0, steel: 0.5 },
	fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
	water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
	electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
	grass: {
		fire: 0.5,
		water: 2,
		grass: 0.5,
		poison: 0.5,
		ground: 2,
		flying: 0.5,
		bug: 0.5,
		rock: 2,
		dragon: 0.5,
		steel: 0.5,
	},
	ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
	fighting: {
		normal: 2,
		ice: 2,
		poison: 0.5,
		flying: 0.5,
		psychic: 0.5,
		bug: 0.5,
		rock: 2,
		ghost: 0,
		dark: 2,
		steel: 2,
		fairy: 0.5,
	},
	poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
	ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
	flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
	psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
	bug: {
		fire: 0.5,
		grass: 2,
		fighting: 0.5,
		poison: 0.5,
		flying: 0.5,
		psychic: 2,
		ghost: 0.5,
		dark: 2,
		steel: 0.5,
		fairy: 0.5,
	},
	rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
	ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
	dragon: { dragon: 2, steel: 0.5, fairy: 0 },
	dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
	steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
	fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const ALL_TYPES = Object.keys(chart);

export type Effectiveness = {
	immune: string[];
	quarter: string[];
	half: string[];
	double: string[];
	quadruple: string[];
};

function bucket(result: Record<string, number>): Effectiveness {
	return {
		immune: Object.entries(result)
			.filter(([, v]) => v === 0)
			.map(([k]) => k),
		quarter: Object.entries(result)
			.filter(([, v]) => v === 0.25)
			.map(([k]) => k),
		half: Object.entries(result)
			.filter(([, v]) => v === 0.5)
			.map(([k]) => k),
		double: Object.entries(result)
			.filter(([, v]) => v === 2)
			.map(([k]) => k),
		quadruple: Object.entries(result)
			.filter(([, v]) => v === 4)
			.map(([k]) => k),
	};
}

export function getDefensiveEffectiveness(defenderTypes: string[]): Effectiveness {
	const result: Record<string, number> = {};
	for (const attacker of ALL_TYPES) {
		let multiplier = 1;
		for (const defender of defenderTypes) {
			multiplier *= chart[attacker]?.[defender] ?? 1;
		}
		if (multiplier !== 1) result[attacker] = multiplier;
	}
	return bucket(result);
}

export function getOffensiveEffectiveness(attackerTypes: string[]): Effectiveness {
	const result: Record<string, number> = {};
	for (const defender of ALL_TYPES) {
		let multiplier = 1;
		for (const attacker of attackerTypes) {
			const m = chart[attacker]?.[defender] ?? 1;
			if (m > multiplier) multiplier = m;
		}
		if (multiplier !== 1) result[defender] = multiplier;
	}
	return bucket(result);
}
