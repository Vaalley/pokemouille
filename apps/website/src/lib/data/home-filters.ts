import { normalizeSearchText } from "../search/rank.ts";
import {
  SPECIES_CLASSES,
  type Catalogue,
  type CatalogueSpecies,
  type SpeciesClass,
} from "./catalogue.ts";
import { NATIONAL_DEX_ID, speciesDexNumber } from "./regional-dex.ts";

export interface HomeFilters {
  q: string;
  type: number | null;
  generation: number | null;
  ability: number | null;
  classification: SpeciesClass | null;
  minTotal: number | null;
  maxTotal: number | null;
  /** Raw URL value: wrong-game and malformed dex selections must stay correctable. */
  dex: string | null;
}

export const HOME_VIEWS = ["list", "table"] as const;
export type HomeView = (typeof HOME_VIEWS)[number];

/** Stat keys follow `CatalogueStats` order, so their index reads the stats tuple. */
export const HOME_STAT_SORTS = [
  "hp",
  "attack",
  "defense",
  "spatk",
  "spdef",
  "speed",
  "total",
] as const;
export type HomeStatSort = (typeof HOME_STAT_SORTS)[number];
export const HOME_SORTS = ["number", "name", ...HOME_STAT_SORTS] as const;
export type HomeSort = (typeof HOME_SORTS)[number];
export type HomeOrder = "asc" | "desc";

export interface HomeDisplay {
  view: HomeView;
  sort: HomeSort;
  order: HomeOrder;
}

export const DEFAULT_HOME_DISPLAY: HomeDisplay = { view: "list", sort: "number", order: "asc" };

const FILTER_PARAMS = [
  "q",
  "type",
  "generation",
  "ability",
  "class",
  "minTotal",
  "maxTotal",
  "dex",
] as const;
const DISPLAY_PARAMS = ["view", "sort", "order"] as const;

/** Bigger stats are usually what people look for first; numbers and names read upwards. */
export function defaultHomeOrder(sort: HomeSort): HomeOrder {
  return sort === "number" || sort === "name" ? "asc" : "desc";
}

/** Plain decimal digits only (IDs, stat totals); signs, fractions and exponents mean “unset”. */
export function parseWholeNumber(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function knownNumber(value: string | null, allowed: readonly number[]): number | null {
  const number = parseWholeNumber(value);
  return number !== null && allowed.includes(number) ? number : null;
}

function known<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.find((entry) => entry === value) ?? null;
}

/** Invalid ordinary filters mean “all”; dex validity depends on the selected game. */
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
    ability: knownNumber(
      params.get("ability"),
      catalogue.abilities.map((ability) => ability.id),
    ),
    classification: known(params.get("class"), SPECIES_CLASSES),
    minTotal: parseWholeNumber(params.get("minTotal")),
    maxTotal: parseWholeNumber(params.get("maxTotal")),
    dex: params.get("dex") === "1" ? null : params.get("dex"),
  };
}

/** Unknown values fall back to the National Dex list; an invalid order uses the sort's default. */
export function readHomeDisplay(params: Pick<URLSearchParams, "get">): HomeDisplay {
  const sort = known(params.get("sort"), HOME_SORTS) ?? DEFAULT_HOME_DISPLAY.sort;
  return {
    view: known(params.get("view"), HOME_VIEWS) ?? DEFAULT_HOME_DISPLAY.view,
    sort,
    order: known(params.get("order"), ["asc", "desc"] as const) ?? defaultHomeOrder(sort),
  };
}

/** True when the URL carries any filter, even one that was ignored as invalid. */
export function hasHomeFilterParams(params: Pick<URLSearchParams, "has">): boolean {
  return FILTER_PARAMS.some((key) => params.has(key));
}

/**
 * Only home parameters change; game, form, hash, and unrelated context survive.
 * Defaults are omitted so the plain National Dex keeps a single canonical URL.
 */
export function homeFiltersUrl(
  url: { readonly href: string },
  filters: HomeFilters,
  display: HomeDisplay,
): URL {
  const next = new URL(url.href);
  for (const key of [...FILTER_PARAMS, ...DISPLAY_PARAMS]) next.searchParams.delete(key);
  if (filters.q) next.searchParams.set("q", filters.q);
  if (filters.type !== null) next.searchParams.set("type", String(filters.type));
  if (filters.generation !== null) next.searchParams.set("generation", String(filters.generation));
  if (filters.ability !== null) next.searchParams.set("ability", String(filters.ability));
  if (filters.classification !== null) next.searchParams.set("class", filters.classification);
  if (filters.minTotal !== null) next.searchParams.set("minTotal", String(filters.minTotal));
  if (filters.maxTotal !== null) next.searchParams.set("maxTotal", String(filters.maxTotal));
  if (filters.dex !== null) next.searchParams.set("dex", filters.dex);
  if (display.view !== DEFAULT_HOME_DISPLAY.view) next.searchParams.set("view", display.view);
  if (display.sort !== DEFAULT_HOME_DISPLAY.sort) next.searchParams.set("sort", display.sort);
  if (display.order !== defaultHomeOrder(display.sort))
    next.searchParams.set("order", display.order);
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

/**
 * Text, current default-variety type and abilities, classification, base stat
 * total range and introduction generation combine with AND. A species with
 * unknown stats never satisfies a total bound.
 */
export function filterHomeSpecies(
  prepared: readonly PreparedHomeSpecies[],
  filters: HomeFilters,
  dexId = NATIONAL_DEX_ID,
): CatalogueSpecies[] {
  const query = normalizeSearchText(filters.q);
  const numberMatch = /^(?:#|no\.?|n°\.?|n\.)?\s*(\d+)$/.exec(
    filters.q.normalize("NFKC").toLowerCase().trim(),
  );
  const number = numberMatch ? Number(numberMatch[1]) : null;
  const { ability, minTotal, maxTotal } = filters;
  return prepared
    .filter(({ species, name }) => {
      const total = species.stats?.[6] ?? null;
      return (
        speciesDexNumber(species, dexId) !== null &&
        (filters.type === null || species.typeIds.includes(filters.type)) &&
        (filters.generation === null || species.generationId === filters.generation) &&
        (ability === null ||
          species.abilityIds.includes(ability) ||
          species.hiddenAbilityIds.includes(ability)) &&
        (filters.classification === null || species.classification === filters.classification) &&
        (minTotal === null || (total !== null && total >= minTotal)) &&
        (maxTotal === null || (total !== null && total <= maxTotal)) &&
        (number !== null ? species.id === number : !query || name.includes(query))
      );
    })
    .map(({ species }) => species);
}

/** Ties always fall back to ascending National Dex number; unknown stats sort last. */
export function sortHomeSpecies(
  species: readonly CatalogueSpecies[],
  { sort, order }: Pick<HomeDisplay, "sort" | "order">,
  language: string,
  dexId = NATIONAL_DEX_ID,
): CatalogueSpecies[] {
  const direction = order === "asc" ? 1 : -1;
  if (sort === "number")
    return species.toSorted((a, b) => {
      const av = speciesDexNumber(a, dexId);
      const bv = speciesDexNumber(b, dexId);
      if (av === null || bv === null)
        return (av === null ? 1 : 0) - (bv === null ? 1 : 0) || a.id - b.id;
      return direction * (av - bv) || a.id - b.id;
    });
  if (sort === "name") {
    const collator = new Intl.Collator(language);
    return species.toSorted((a, b) => direction * collator.compare(a.name, b.name) || a.id - b.id);
  }
  const index = HOME_STAT_SORTS.indexOf(sort);
  return species.toSorted((a, b) => {
    const av = a.stats?.[index];
    const bv = b.stats?.[index];
    if (av === undefined || bv === undefined)
      return (av === undefined ? 1 : 0) - (bv === undefined ? 1 : 0) || a.id - b.id;
    return direction * (av - bv) || a.id - b.id;
  });
}
