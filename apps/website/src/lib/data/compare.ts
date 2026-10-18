/** Compare page state: `?p=<speciesId>` or `?p=<speciesId>~<formIdentifier>`, repeated. */
export const MAX_COMPARED = 6;
export const COMPARE_PARAM = "p";

export interface ComparedPokemon {
  speciesId: number;
  /** Variety or form identifier as given; `resolvePokemonView` decides whether it exists. */
  form: string | null;
}

export interface CompareSelection {
  entries: ComparedPokemon[];
  /** At least one `p` value was malformed and ignored. */
  invalid: boolean;
  /** More than `MAX_COMPARED` distinct Pokémon were requested; only the first ones are kept. */
  truncated: boolean;
}

const SPECIES_ID = /^[1-9]\d{0,4}$/;
const FORM_IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Stable identity of a compared Pokémon, also its URL value. */
export function compareKey({ speciesId, form }: ComparedPokemon): string {
  return form === null ? String(speciesId) : `${speciesId}~${form}`;
}

export function parseCompared(value: string): ComparedPokemon | null {
  const separator = value.indexOf("~");
  const id = separator === -1 ? value : value.slice(0, separator);
  const form = separator === -1 ? null : value.slice(separator + 1);
  if (!SPECIES_ID.test(id) || (form !== null && !FORM_IDENTIFIER.test(form))) return null;
  return { speciesId: Number(id), form };
}

/** Distinct entries in first-seen order, at most `MAX_COMPARED`. */
function normalize(entries: readonly ComparedPokemon[]): {
  entries: ComparedPokemon[];
  truncated: boolean;
} {
  const seen = new Set<string>();
  const unique: ComparedPokemon[] = [];
  let truncated = false;
  for (const entry of entries) {
    const key = compareKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    if (unique.length === MAX_COMPARED) truncated = true;
    else unique.push({ speciesId: entry.speciesId, form: entry.form });
  }
  return { entries: unique, truncated };
}

export function readCompareSelection(params: URLSearchParams): CompareSelection {
  const parsed: ComparedPokemon[] = [];
  let invalid = false;
  for (const value of params.getAll(COMPARE_PARAM)) {
    const entry = parseCompared(value);
    if (entry) parsed.push(entry);
    else invalid = true;
  }
  return { ...normalize(parsed), invalid };
}

/** `current` with its `p` values replaced; every other parameter (e.g. `version`) is kept. */
export function compareUrl(current: URL, entries: readonly ComparedPokemon[]): URL {
  const url = new URL(current.href);
  url.searchParams.delete(COMPARE_PARAM);
  for (const entry of normalize(entries).entries) {
    url.searchParams.append(COMPARE_PARAM, compareKey(entry));
  }
  return url;
}

/** Appends `entry` unless it is already compared or the comparison is full. */
export function addCompared(
  entries: readonly ComparedPokemon[],
  entry: ComparedPokemon,
): ComparedPokemon[] {
  const key = compareKey(entry);
  if (entries.length >= MAX_COMPARED || entries.some((current) => compareKey(current) === key)) {
    return [...entries];
  }
  return [...entries, entry];
}

export function removeCompared(
  entries: readonly ComparedPokemon[],
  key: string,
): ComparedPokemon[] {
  return entries.filter((entry) => compareKey(entry) !== key);
}

/**
 * Which values are the row's highest. Ties are all highest; nothing is highlighted unless at
 * least two values are known and they differ (a lone or uniform value is not a "best").
 */
export function markHighest(values: readonly (number | null)[]): boolean[] {
  const known = values.filter((value): value is number => value !== null);
  const max = Math.max(...known);
  const highlight = known.length >= 2 && known.some((value) => value !== max);
  return values.map((value) => highlight && value === max);
}

export interface CompareStatRow<S> {
  /** First column's stat with this id, for its localized name. */
  stat: S;
  values: (number | null)[];
  highest: boolean[];
}

/**
 * One row per stat id across all columns, in first-seen order. `null` columns (stats unknown
 * or Pokémon unavailable) and columns lacking a stat get `null` cells. The total is only given
 * for columns with known stats.
 */
export function compareStats<S extends { id: number; value: number }>(
  columns: readonly (readonly S[] | null)[],
): { rows: CompareStatRow<S>[]; total: { values: (number | null)[]; highest: boolean[] } } {
  const stats = new Map<number, S>();
  for (const column of columns) {
    for (const stat of column ?? []) if (!stats.has(stat.id)) stats.set(stat.id, stat);
  }
  const rows = [...stats.values()].map((stat) => {
    const values = columns.map(
      (column) => column?.find((entry) => entry.id === stat.id)?.value ?? null,
    );
    return { stat, values, highest: markHighest(values) };
  });
  const totals = columns.map((column) =>
    column ? column.reduce((sum, stat) => sum + stat.value, 0) : null,
  );
  return { rows, total: { values: totals, highest: markHighest(totals) } };
}

export interface MatchupRow {
  typeId: number;
  multiplier: number;
}

/** Weaknesses strongest first, resistances most resisted first, immunities in type order. */
export function splitDefensiveMatchups(rows: readonly MatchupRow[]): {
  weaknesses: MatchupRow[];
  resistances: MatchupRow[];
  immunities: MatchupRow[];
} {
  const byStrength = (direction: 1 | -1) => (a: MatchupRow, b: MatchupRow) =>
    direction * (a.multiplier - b.multiplier) || a.typeId - b.typeId;
  return {
    weaknesses: rows.filter((row) => row.multiplier > 1).sort(byStrength(-1)),
    resistances: rows.filter((row) => row.multiplier > 0 && row.multiplier < 1).sort(byStrength(1)),
    immunities: rows.filter((row) => row.multiplier === 0).sort(byStrength(1)),
  };
}
