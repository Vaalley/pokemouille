import { normalizeSearchText } from "../search/rank.ts";
import type { Catalogue, CatalogueSpecies } from "./catalogue.ts";

export interface HomeFilters {
  q: string;
  type: number | null;
  generation: number | null;
}

function knownNumber(value: string | null, allowed: readonly number[]): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && allowed.includes(number) ? number : null;
}

/** Unknown/malformed IDs mean “all”, never an accidentally empty result set. */
export function readHomeFilters(
  params: Pick<URLSearchParams, "get">,
  catalogue: Catalogue,
): HomeFilters {
  return {
    q: params.get("q") ?? "",
    type: knownNumber(
      params.get("type"),
      catalogue.types.map((type) => type.id),
    ),
    generation: knownNumber(params.get("generation"), catalogue.generations),
  };
}

/** Only filter parameters change; game, form, hash, and unrelated context survive. */
export function homeFiltersUrl(url: { readonly href: string }, filters: HomeFilters): URL {
  const next = new URL(url.href);
  next.searchParams.delete("q");
  next.searchParams.delete("type");
  next.searchParams.delete("generation");
  if (filters.q) next.searchParams.set("q", filters.q);
  if (filters.type !== null) next.searchParams.set("type", String(filters.type));
  if (filters.generation !== null) next.searchParams.set("generation", String(filters.generation));
  return next;
}

export interface PreparedHomeSpecies {
  species: CatalogueSpecies;
  name: string;
}

export function prepareHomeSpecies(species: readonly CatalogueSpecies[]): PreparedHomeSpecies[] {
  return [...species]
    .sort((a, b) => a.id - b.id)
    .map((entry) => ({ species: entry, name: normalizeSearchText(entry.name) }));
}

/** Text, current default-variety type, and introduction generation combine with AND. */
export function filterHomeSpecies(
  prepared: readonly PreparedHomeSpecies[],
  filters: HomeFilters,
): CatalogueSpecies[] {
  const query = normalizeSearchText(filters.q);
  const numberMatch = /^(?:#|no\.?|n°\.?|n\.)?\s*(\d+)$/.exec(
    filters.q.normalize("NFKC").toLowerCase().trim(),
  );
  const number = numberMatch ? Number(numberMatch[1]) : null;
  return prepared
    .filter(
      ({ species, name }) =>
        (filters.type === null || species.typeIds.includes(filters.type)) &&
        (filters.generation === null || species.generationId === filters.generation) &&
        (number !== null ? species.id === number : !query || name.includes(query)),
    )
    .map(({ species }) => species);
}
