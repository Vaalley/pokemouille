// Main-series type-only damage factors; excludes abilities, moves, items and Stellar.
// PokeAPI sources (attacking type IDs -> defending type IDs):
// https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/type_efficacy.csv
// https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/type_efficacy_past.csv
// Each current row stores [double damage, half damage, no damage]; omitted cells are neutral.
const chart: readonly (readonly [readonly number[], readonly number[], readonly number[]])[] = [
  [[], [6, 9], [8]], // Normal
  [[1, 6, 9, 15, 17], [3, 4, 7, 14, 18], [8]], // Fighting
  [[2, 7, 12], [6, 9, 13], []], // Flying
  [[12, 18], [4, 5, 6, 8], [9]], // Poison
  [[4, 6, 9, 10, 13], [7, 12], [3]], // Ground
  [[3, 7, 10, 15], [2, 5, 9], []], // Rock
  [[12, 14, 17], [2, 3, 4, 8, 9, 10, 18], []], // Bug
  [[8, 14], [17], [1]], // Ghost
  [[6, 15, 18], [9, 10, 11, 13], []], // Steel
  [[7, 9, 12, 15], [6, 10, 11, 16], []], // Fire
  [[5, 6, 10], [11, 12, 16], []], // Water
  [[5, 6, 11], [3, 4, 7, 9, 10, 12, 16], []], // Grass
  [[3, 11], [12, 13, 16], [5]], // Electric
  [[2, 4], [9, 14], [17]], // Psychic
  [[3, 5, 12, 16], [9, 10, 11, 15], []], // Ice
  [[16], [9], [18]], // Dragon
  [[8, 14], [2, 17, 18], []], // Dark
  [[2, 16, 17], [4, 9, 10], []], // Fairy
];

export function isIntroduced(typeId: number, generationId: number): boolean {
  return (
    Number.isInteger(typeId) &&
    typeId >= 1 &&
    typeId <= 18 &&
    ((typeId !== 9 && typeId !== 17) || generationId >= 2) &&
    (typeId !== 18 || generationId >= 6)
  );
}

function damageFactor(attacking: number, defending: number, generation: number): number {
  // PokeAPI's past generation is the last generation using the old factor.
  if (generation === 1) {
    if ((attacking === 4 && defending === 7) || (attacking === 7 && defending === 4)) {
      return 2;
    }
    if (attacking === 8 && defending === 14) return 0;
    if (attacking === 15 && defending === 10) return 1;
  }
  if (generation <= 5 && defending === 9 && (attacking === 8 || attacking === 17)) {
    return 0.5;
  }
  const [weak, resistant, immune] = chart[attacking - 1]!;
  if (immune.includes(defending)) return 0;
  if (weak.includes(defending)) return 2;
  if (resistant.includes(defending)) return 0.5;
  return 1;
}

export function defensiveMatchups(
  defendingTypeIds: readonly number[],
  generationId: number,
): { typeId: number; multiplier: number }[] | null {
  if (
    !Number.isInteger(generationId) ||
    generationId < 1 ||
    defendingTypeIds.length === 0 ||
    defendingTypeIds.some((id) => !isIntroduced(id, generationId))
  ) {
    return null;
  }

  const defenders = [...new Set(defendingTypeIds)];
  const matchups: { typeId: number; multiplier: number }[] = [];
  for (let typeId = 1; typeId <= 18; typeId++) {
    if (!isIntroduced(typeId, generationId)) continue;
    let multiplier = 1;
    for (const defender of defenders) {
      multiplier *= damageFactor(typeId, defender, generationId);
    }
    matchups.push({ typeId, multiplier });
  }
  return matchups;
}

/** Damage one attacking type deals to each defending type introduced by `generationId`. */
export function offensiveMatchups(
  attackingTypeId: number,
  generationId: number,
): { typeId: number; multiplier: number }[] | null {
  if (
    !Number.isInteger(generationId) ||
    generationId < 1 ||
    !isIntroduced(attackingTypeId, generationId)
  ) {
    return null;
  }

  const matchups: { typeId: number; multiplier: number }[] = [];
  for (let typeId = 1; typeId <= 18; typeId++) {
    if (!isIntroduced(typeId, generationId)) continue;
    matchups.push({ typeId, multiplier: damageFactor(attackingTypeId, typeId, generationId) });
  }
  return matchups;
}
