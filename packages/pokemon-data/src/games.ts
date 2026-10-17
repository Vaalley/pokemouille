import type { GameOption, ReferenceData } from "./types.ts";

// An explicit product list, not a heuristic over upstream versions. New source
// versions remain in references but require a deliberate selector decision.
const MAIN_SERIES: Record<string, true> = {
  "red-japan": true,
  "green-japan": true,
  "blue-japan": true,
  red: true,
  blue: true,
  yellow: true,
  gold: true,
  silver: true,
  crystal: true,
  ruby: true,
  sapphire: true,
  emerald: true,
  firered: true,
  leafgreen: true,
  diamond: true,
  pearl: true,
  platinum: true,
  heartgold: true,
  soulsilver: true,
  black: true,
  white: true,
  "black-2": true,
  "white-2": true,
  x: true,
  y: true,
  "omega-ruby": true,
  "alpha-sapphire": true,
  sun: true,
  moon: true,
  "ultra-sun": true,
  "ultra-moon": true,
  "lets-go-pikachu": true,
  "lets-go-eevee": true,
  sword: true,
  shield: true,
  "brilliant-diamond": true,
  "shining-pearl": true,
  "legends-arceus": true,
  scarlet: true,
  violet: true,
  "legends-za": true,
};
const EXPANSIONS: Record<string, readonly string[]> = {
  sword: ["the-isle-of-armor", "the-crown-tundra"],
  shield: ["the-isle-of-armor", "the-crown-tundra"],
  scarlet: ["the-teal-mask", "the-indigo-disk"],
  violet: ["the-teal-mask", "the-indigo-disk"],
  "legends-za": ["mega-dimension"],
};

type GameReferences = Pick<ReferenceData, "versions" | "versionGroups" | "coverage">;
const cache = new WeakMap<GameReferences, GameOption[]>();

// Inputs are immutable published snapshots. Reusing the reference object avoids
// rescanning version/group arrays on every page/context resolution.
export function getMainSeriesGames(references: GameReferences): GameOption[] {
  const existing = cache.get(references);
  if (existing) return existing;
  const groups = new Map(references.versionGroups.map((group) => [group.id, group]));
  const coverage = new Map(references.coverage.map((row) => [row.versionGroupId, row]));
  const result: GameOption[] = [];
  for (const version of references.versions) {
    if (!Object.hasOwn(MAIN_SERIES, version.identifier)) continue;
    const group = groups.get(version.versionGroupId);
    if (!group) throw new Error(`Missing version group ${version.versionGroupId}`);
    const expansions: GameOption["expansions"] = [];
    for (const identifier of EXPANSIONS[version.identifier] ?? []) {
      const expansion = references.versionGroups.find((entry) => entry.identifier === identifier);
      const expansionCoverage = expansion ? (coverage.get(expansion.id) ?? null) : null;
      expansions.push({
        identifier,
        group: expansion ?? null,
        versions: expansion
          ? references.versions.filter(
              (entry) =>
                entry.versionGroupId === expansion.id &&
                (entry.identifier.endsWith(`-${version.identifier}`) ||
                  version.identifier === "legends-za"),
            )
          : [],
        coverage: expansionCoverage,
        coverageState: {
          learnsets: expansionCoverage?.learnsetRows ? "source-rows-present" : "missing",
          speciesFlavorTexts: expansionCoverage?.speciesFlavorTextRows
            ? "source-rows-present"
            : "missing",
        },
      });
    }
    const baseCoverage = coverage.get(group.id) ?? null;
    result.push({
      version,
      group,
      expansions,
      coverage: baseCoverage,
      coverageState: {
        learnsets: baseCoverage?.learnsetRows ? "source-rows-present" : "missing",
        speciesFlavorTexts: baseCoverage?.speciesFlavorTextRows ? "source-rows-present" : "missing",
      },
    });
  }
  result.sort((a, b) => a.group.order - b.group.order || a.version.id - b.version.id);
  cache.set(references, result);
  return result;
}
