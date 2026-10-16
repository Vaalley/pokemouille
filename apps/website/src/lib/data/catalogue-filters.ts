import { normalizeSearchText } from "../search/rank.ts";
import type { ResourceCatalogue, ResourceEntry } from "./resource-catalogue.ts";

export interface CatalogueFilters {
  q: string;
  type: number | null;
  category: number | null;
}

/** Malformed and unknown IDs mean all, as on the National Pokédex. */
export function readCatalogueFilters(
  params: Pick<URLSearchParams, "get">,
  catalogue: ResourceCatalogue,
): CatalogueFilters {
  const knownId = (value: string | null, allowed: readonly number[]): number | null => {
    if (!value || !/^\d+$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && allowed.includes(id) ? id : null;
  };
  return {
    q: params.get("q") ?? "",
    type: knownId(
      params.get("type"),
      catalogue.types.map((row) => row.id),
    ),
    category: knownId(params.get("category"), catalogue.categories),
  };
}

/** Keep game context, remove unrelated Pokémon form context, and replace list filters. */
export function catalogueFiltersUrl(
  url: { readonly href: string },
  filters: CatalogueFilters,
): URL {
  const next = new URL(url.href);
  for (const key of ["q", "type", "category", "form"]) next.searchParams.delete(key);
  if (filters.q) next.searchParams.set("q", filters.q);
  if (filters.type !== null) next.searchParams.set("type", String(filters.type));
  if (filters.category !== null) next.searchParams.set("category", String(filters.category));
  return next;
}

export interface PreparedResource {
  entry: ResourceEntry;
  names: string[];
}

export function prepareResources(entries: readonly ResourceEntry[]): PreparedResource[] {
  return entries.map((entry) => ({
    entry,
    names: [
      entry.name.text,
      entry.englishName,
      entry.identifier,
      entry.identifier.replaceAll("-", " "),
    ].map(normalizeSearchText),
  }));
}

/** Localized and canonical aliases share normalization; move facets combine with AND. */
export function filterResources(
  prepared: readonly PreparedResource[],
  filters: CatalogueFilters,
): ResourceEntry[] {
  const query = normalizeSearchText(filters.q);
  return prepared
    .filter(
      ({ entry, names }) =>
        (!query || names.some((name) => name.includes(query))) &&
        (filters.type === null || entry.typeId === filters.type) &&
        (filters.category === null || entry.damageClassId === filters.category),
    )
    .map(({ entry }) => entry);
}
