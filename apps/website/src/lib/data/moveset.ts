import type { Language, LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";
import type { RelatedPokemon } from "./catalogue.ts";

export const MAX_MOVES = 4;

/** One variety, with the default form identity used by Pokémon links (null = species default). */
export interface LearnerIdentity {
  speciesId: number;
  pokemonId: number;
  form: string | null;
  generationId: number;
  introducedVersionGroupId: number | null;
}

/** [speciesId, pokemonId, form, generationId, introducedVersionGroupId] */
type IdentityRow = [number, number, string | null, number, number | null];
/** [index into `pokemon`, learn method id, level] */
type LearnsetRow = [number, number, number];

/**
 * Language-independent prerendered learner file for one move. Rows keep the exact
 * source version group, method and level; nothing is carried across groups.
 */
export interface MoveLearnersFile {
  moveId: number;
  pokemon: IdentityRow[];
  /** Version group id → learnset rows in that exact group. */
  groups: Record<string, LearnsetRow[]>;
}

export interface MoveLearners {
  moveId: number;
  pokemon: LearnerIdentity[];
  groups: ReadonlyMap<number, readonly LearnsetRow[]>;
}

const ID = /^[1-9]\d*$/;

/**
 * Repeated `move` parameters in URL order. Duplicates collapse silently; malformed,
 * unknown or surplus (beyond MAX_MOVES) values are dropped and flagged, never guessed.
 */
export function readMovesetSelection(
  params: Pick<URLSearchParams, "getAll">,
  known?: ReadonlySet<number>,
): { ids: number[]; invalid: boolean } {
  const ids: number[] = [];
  let invalid = false;
  for (const value of params.getAll("move")) {
    const id = Number(value);
    if (!ID.test(value) || !Number.isSafeInteger(id) || (known && !known.has(id))) {
      invalid = true;
      continue;
    }
    if (ids.includes(id)) continue;
    if (ids.length >= MAX_MOVES) {
      invalid = true;
      continue;
    }
    ids.push(id);
  }
  return { ids, invalid };
}

/** Replace the move selection, keeping every other parameter (notably `version`). */
export function movesetUrl(current: { readonly href: string }, ids: readonly number[]): URL {
  const url = new URL(current.href);
  url.searchParams.delete("move");
  for (const id of [...new Set(ids)].slice(0, MAX_MOVES))
    url.searchParams.append("move", String(id));
  return url;
}

/** Build-time projection of one move's related Pokémon into the compact file. */
export function projectMoveLearners(
  moveId: number,
  related: readonly Pick<RelatedPokemon, keyof LearnerIdentity | "learnsets">[],
): MoveLearnersFile {
  const sorted = related.toSorted((a, b) => a.speciesId - b.speciesId || a.pokemonId - b.pokemonId);
  const pokemon: IdentityRow[] = [];
  const groups: Record<string, LearnsetRow[]> = {};
  const seen = new Set<string>();
  for (const entry of sorted) {
    const index = pokemon.length;
    pokemon.push([
      entry.speciesId,
      entry.pokemonId,
      entry.form,
      entry.generationId,
      entry.introducedVersionGroupId,
    ]);
    for (const row of entry.learnsets) {
      const key = `${index}:${row.versionGroupId}:${row.learnMethodId}:${row.level}`;
      if (seen.has(key)) continue;
      seen.add(key);
      (groups[row.versionGroupId] ??= []).push([index, row.learnMethodId, row.level]);
    }
  }
  for (const rows of Object.values(groups)) {
    rows.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  }
  return { moveId, pokemon, groups };
}

const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value);

/** Validate a downloaded file; a stale or corrupt response fails rather than showing partial data. */
export function parseMoveLearners(value: unknown, moveId: number): MoveLearners {
  const fail = (): never => {
    throw new Error(`Invalid learner data for move ${moveId}`);
  };
  if (typeof value !== "object" || value === null) return fail();
  const file = value as Partial<MoveLearnersFile>;
  if (file.moveId !== moveId || !Array.isArray(file.pokemon)) return fail();
  if (typeof file.groups !== "object" || file.groups === null || Array.isArray(file.groups)) {
    return fail();
  }
  const pokemon = file.pokemon.map((row): LearnerIdentity => {
    if (
      !Array.isArray(row) ||
      row.length !== 5 ||
      !isInteger(row[0]) ||
      !isInteger(row[1]) ||
      !(row[2] === null || typeof row[2] === "string") ||
      !isInteger(row[3]) ||
      !(row[4] === null || isInteger(row[4]))
    ) {
      return fail();
    }
    return {
      speciesId: row[0],
      pokemonId: row[1],
      form: row[2],
      generationId: row[3],
      introducedVersionGroupId: row[4],
    };
  });
  const groups = new Map<number, LearnsetRow[]>();
  for (const [key, rows] of Object.entries(file.groups)) {
    if (!ID.test(key) || !Array.isArray(rows)) return fail();
    for (const row of rows as unknown[]) {
      if (
        !Array.isArray(row) ||
        row.length !== 3 ||
        !row.every(isInteger) ||
        row[0] < 0 ||
        row[0] >= pokemon.length
      ) {
        return fail();
      }
    }
    groups.set(Number(key), rows as LearnsetRow[]);
  }
  return { moveId, pokemon, groups };
}

export interface LearnerGame {
  versionGroupId: number;
  generationId: number;
  /** Release order of the selected version group (not its ID). */
  order: number;
}

export interface MoveMethods {
  moveId: number;
  /** Sorted by method id; levels ascending and unique (0 = no level recorded). */
  methods: { learnMethodId: number; levels: number[] }[];
}

export interface MovesetMatch {
  pokemon: LearnerIdentity;
  /** One entry per selected move, in selection order. */
  moves: MoveMethods[];
}

export interface MovesetResult {
  rows: MovesetMatch[];
  /** Per selected move: varieties learning it in this exact group (chronology applied). */
  counts: { moveId: number; count: number }[];
  /** Varieties learning every move whose form introduction can't be placed in this game's timeline. */
  missingIntroduction: number;
}

/**
 * Varieties that learn every selected move in the selected game's exact version group.
 * As in related-Pokémon lists, species from later generations and forms introduced
 * after the game are excluded, while unknown form chronology is counted, not guessed.
 * Learnable is not obtainable, and combination legality is not checked.
 */
export function intersectLearners(
  files: readonly MoveLearners[],
  game: LearnerGame,
  introductionOrder: ReadonlyMap<number, number>,
): MovesetResult {
  const unique = files.filter(
    (file, index) => files.findIndex((other) => other.moveId === file.moveId) === index,
  );
  if (unique.length === 0) return { rows: [], counts: [], missingIntroduction: 0 };

  // Chronology: true = shown, false = excluded, null = unknown introduction.
  const eligibility = (identity: LearnerIdentity): boolean | null => {
    if (identity.generationId > game.generationId) return false;
    const introduced =
      identity.introducedVersionGroupId === null
        ? undefined
        : introductionOrder.get(identity.introducedVersionGroupId);
    if (introduced === undefined) return null;
    return introduced <= game.order;
  };

  const perMove = unique.map((file) => {
    const methods = new Map<
      number,
      { identity: LearnerIdentity; methods: Map<number, Set<number>> }
    >();
    for (const [index, learnMethodId, level] of file.groups.get(game.versionGroupId) ?? []) {
      const identity = file.pokemon[index]!;
      let entry = methods.get(identity.pokemonId);
      if (!entry) {
        entry = { identity, methods: new Map() };
        methods.set(identity.pokemonId, entry);
      }
      let levels = entry.methods.get(learnMethodId);
      if (!levels) {
        levels = new Set();
        entry.methods.set(learnMethodId, levels);
      }
      levels.add(level);
    }
    return { moveId: file.moveId, methods };
  });

  const counts = perMove.map(({ moveId, methods }) => ({
    moveId,
    count: [...methods.values()].filter((entry) => eligibility(entry.identity) === true).length,
  }));

  const rows: MovesetMatch[] = [];
  let missingIntroduction = 0;
  const [first, ...rest] = perMove;
  for (const [pokemonId, entry] of first!.methods) {
    if (!rest.every((move) => move.methods.has(pokemonId))) continue;
    const eligible = eligibility(entry.identity);
    if (eligible === null) missingIntroduction += 1;
    if (eligible !== true) continue;
    rows.push({
      pokemon: entry.identity,
      moves: perMove.map(({ moveId, methods }) => ({
        moveId,
        methods: [...methods.get(pokemonId)!.methods]
          .map(([learnMethodId, levels]) => ({
            learnMethodId,
            levels: [...levels].sort((a, b) => a - b),
          }))
          .sort((a, b) => a.learnMethodId - b.learnMethodId),
      })),
    });
  }
  rows.sort(
    (a, b) =>
      a.pokemon.speciesId - b.pokemon.speciesId || a.pokemon.pokemonId - b.pokemon.pokemonId,
  );
  return { rows, counts, missingIntroduction };
}

/** [pokemonId, text, sourceLanguageId, fallback]: page-data names without repeated keys. */
export type CompactName = [number, string, number | null, boolean];

export function compactNames(names: Iterable<[number, LocalizedText]>): CompactName[] {
  return [...names]
    .map(([id, name]): CompactName => [id, name.text, name.sourceLanguageId, name.fallback])
    .sort((a, b) => a[0] - b[0]);
}

export function expandNames(
  rows: readonly CompactName[],
  lang: Language,
): Map<number, LocalizedText> {
  return new Map(
    rows.map(([id, text, sourceLanguageId, fallback]) => [
      id,
      { text, requestedLanguage: lang, sourceLanguageId, fallback },
    ]),
  );
}
