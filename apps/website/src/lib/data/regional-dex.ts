import type { Catalogue, CatalogueSpecies } from "./catalogue.ts";

export const NATIONAL_DEX_ID = 1;
export type CatalogueDex = Catalogue["pokedexes"][number];
export type DexSelection =
  | { status: "national"; id: 1 }
  | { status: "regional"; id: number; dex: CatalogueDex }
  | { status: "waiting" }
  | { status: "invalid"; requested: string; dex: CatalogueDex | null };

/** Exact group mappings include every source dex (base game and DLC), once by ID. */
export function regionalDexChoices(
  catalogue: Pick<Catalogue, "pokedexes" | "versions">,
  version: string | null,
): CatalogueDex[] {
  const group = catalogue.versions.find(([identifier]) => identifier === version)?.[1];
  if (group === undefined) return [];
  const dexes = new Map<number, CatalogueDex>();
  for (const dex of catalogue.pokedexes) {
    if (dex.id !== NATIONAL_DEX_ID && dex.versionGroupIds.includes(group)) dexes.set(dex.id, dex);
  }
  return [...dexes.values()].sort((a, b) => a.id - b.id);
}

/** An incompatible or malformed URL remains invalid, never silently becomes National. */
export function resolveDexSelection(
  requested: string | null,
  catalogue: Pick<Catalogue, "pokedexes" | "versions">,
  version: string | null,
): DexSelection {
  if (requested === null || requested === "1") return { status: "national", id: NATIONAL_DEX_ID };
  if (version === null) return { status: "waiting" };
  const id = /^\d+$/.test(requested) ? Number(requested) : NaN;
  const dex = Number.isSafeInteger(id)
    ? (catalogue.pokedexes.find((row) => row.id === id) ?? null)
    : null;
  return dex && regionalDexChoices(catalogue, version).some((row) => row.id === id)
    ? { status: "regional", id, dex }
    : { status: "invalid", requested, dex };
}

/** National species IDs are intrinsic; regional zero is a real number, not missing. */
export function speciesDexNumber(
  species: CatalogueSpecies,
  dexId = NATIONAL_DEX_ID,
): number | null {
  return dexId === NATIONAL_DEX_ID
    ? species.id
    : (species.dexNumbers.find(([id]) => id === dexId)?.[1] ?? null);
}
