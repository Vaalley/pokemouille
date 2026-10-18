import type {
  Encounter,
  PokemonReferences,
  PokemonVariety,
  ResolvedPokemon,
} from "../../../../../packages/pokemon-data/src/index.ts";

type EncounterVariety = Pick<PokemonVariety, "id" | "identifier" | "encounters">;

export interface EncounterGroup {
  location: Encounter["location"];
  area: Encounter["area"];
  method: Encounter["method"];
  /** Each source slot remains independent, including every condition and level range. */
  rows: Encounter[];
}

export interface EncounterLocations {
  status:
    | "rows"
    | "not-introduced"
    | "unknown"
    | "variety-unknown"
    | "coverage-unknown"
    | "game-empty"
    | "variety-empty";
  variety: EncounterVariety | null;
  groups: EncounterGroup[];
}

/** Resolve only the already-downloaded species variety and the exact selected game. */
export function resolveEncounters({
  varieties,
  pokemon,
  version,
  references,
}: {
  varieties: readonly EncounterVariety[];
  pokemon: Pick<ResolvedPokemon, "pokemonId" | "status">;
  version: string;
  references: Pick<PokemonReferences, "versions" | "encounterCoverage">;
}): EncounterLocations {
  const variety = varieties.find((entry) => entry.id === pokemon.pokemonId) ?? null;
  const empty = (status: EncounterLocations["status"]): EncounterLocations => ({
    status,
    variety,
    groups: [],
  });
  if (pokemon.status !== "available") return empty(pokemon.status);
  if (!variety) return empty("variety-unknown");
  const game = references.versions.find((entry) => entry.identifier === version);
  if (!game) return empty("coverage-unknown");

  const groups = new Map<string, EncounterGroup>();
  for (const row of variety.encounters) {
    if (row.versionId !== game.id) continue;
    const key = `${row.location.id}:${row.area.id}:${row.method.id}`;
    const group = groups.get(key);
    if (group) group.rows.push(row);
    else
      groups.set(key, { location: row.location, area: row.area, method: row.method, rows: [row] });
  }
  if (groups.size > 0) {
    return {
      status: "rows",
      variety,
      groups: [...groups.values()].sort(
        (a, b) =>
          a.location.id - b.location.id || a.area.id - b.area.id || a.method.id - b.method.id,
      ),
    };
  }
  const coverage = references.encounterCoverage.find((entry) => entry.versionId === game.id);
  if (!coverage) return empty("coverage-unknown");
  return empty(coverage.rows === 0 ? "game-empty" : "variety-empty");
}
