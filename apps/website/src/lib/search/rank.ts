import { introductionStatus } from "../../../../../packages/pokemon-data/src/index.ts";
import type { SearchEntry } from "../../../../../packages/pokemon-data/src/index.ts";

export type MatchKind = "number" | "exact" | "prefix" | "substring" | "typo";
export type Introduction = "available" | "not-introduced" | "unknown";

export interface SearchGame {
  generationId: number;
  order: number;
  /** versionGroupId → order */
  groupOrders: ReadonlyMap<number, number>;
}

export interface SearchResult {
  entry: SearchEntry;
  match: MatchKind;
  /** null when no game is given. */
  introduction: Introduction | null;
}

/** Which entry field a key came from; lower ranks first. */
const NAME = 0;
const SPECIES_NAME = 1;
const ALIAS = 2;
type KeyField = typeof NAME | typeof SPECIES_NAME | typeof ALIAS;

interface PreparedKey {
  compact: string;
  /** Word tokens of multi-word sources (single-word sources are covered by `compact`). */
  tokens: string[];
  field: KeyField;
}

interface PreparedEntry {
  entry: SearchEntry;
  /** Deduplicated by compact key, ordered name → speciesName → aliases. */
  keys: PreparedKey[];
}

/** Opaque to callers: build with `prepareSearchIndex`, consume with `searchPokemon`. */
export interface PreparedIndex {
  readonly entries: readonly PreparedEntry[];
}

const TIERS: readonly MatchKind[] = ["number", "exact", "prefix", "substring", "typo"];
const NUMBER = 0;
const EXACT = 1;
const PREFIX = 2;
const SUBSTRING = 3;
const TYPO = 4;
const NO_MATCH = 5;

const LATIN_COMBINING_MARKS = /[\u0300-\u036f]/g;
const KATAKANA = /[\u30a1-\u30f6]/g;
const SEPARATOR = /[\p{P}\p{S}\p{Z}\p{Cc}\p{Cf}]+/u;
const SEPARATORS = /[\p{P}\p{S}\p{Z}\p{Cc}\p{Cf}]+/gu;
/** Optional `#`, `no`, `no.`, `n°`, `nº` (NFKC → `no`), `n.` prefix, then digits. */
const NUMBER_QUERY = /^(?:#|no\.?|n°\.?|n\.)?\s*(\d+)$/;

/** Case/width/accent/kana folding that keeps separators, so words can still be split. */
function fold(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(LATIN_COMBINING_MARKS, "")
    .normalize("NFC")
    .replace(KATAKANA, (katakana) => String.fromCharCode(katakana.charCodeAt(0) - 0x60))
    .replaceAll("♀", "f")
    .replaceAll("♂", "m");
}

/** Compact comparison key: NFKC, lowercase, Latin accents stripped (kana voicing marks kept),
 * katakana folded to hiragana, ♀/♂ → f/m, punctuation and whitespace removed. */
export function normalizeSearchText(text: string): string {
  return fold(text).replace(SEPARATORS, "");
}

export function prepareSearchIndex(entries: readonly SearchEntry[]): PreparedIndex {
  return {
    entries: entries.map((entry) => {
      const byCompact = new Map<string, PreparedKey>();
      const add = (text: string, field: KeyField) => {
        const words = fold(text).split(SEPARATOR).filter(Boolean);
        const compact = words.join("");
        if (!compact) return;
        let key = byCompact.get(compact);
        if (!key) {
          key = { compact, tokens: [], field };
          byCompact.set(compact, key);
        }
        if (words.length > 1)
          for (const word of words) if (!key.tokens.includes(word)) key.tokens.push(word);
      };
      add(entry.name.text, NAME);
      add(entry.speciesName.text, SPECIES_NAME);
      for (const alias of entry.aliases) add(alias, ALIAS);
      return { entry, keys: [...byCompact.values()] };
    }),
  };
}

function textTier(key: PreparedKey, query: string): number {
  const { compact } = key;
  if (compact === query) return EXACT;
  if (compact.startsWith(query)) return PREFIX;
  for (const token of key.tokens) if (token.startsWith(query)) return PREFIX;
  if (query.length >= 2 && compact.includes(query)) return SUBSTRING;
  return NO_MATCH;
}

/** Banded optimal-string-alignment distance between `query` and either the whole `key` or any
 * key prefix within `maxDistance` of the query's length; `maxDistance + 1` when farther. */
class TypoMatcher {
  readonly maxDistance: number;
  private readonly codes: Int32Array;
  private readonly rows: readonly [Int32Array, Int32Array, Int32Array];

  constructor(query: string, maxDistance: number) {
    this.maxDistance = maxDistance;
    this.codes = new Int32Array(query.length);
    for (let i = 0; i < query.length; i++) this.codes[i] = query.charCodeAt(i);
    const width = query.length + maxDistance + 2;
    this.rows = [new Int32Array(width), new Int32Array(width), new Int32Array(width)];
  }

  distance(key: string): number {
    const q = this.codes;
    const n = q.length;
    const maxD = this.maxDistance;
    const far = maxD + 1;
    if (key.length < n - maxD) return far;
    const cols = Math.min(key.length, n + maxD);
    let before = this.rows[0];
    let previous = this.rows[1];
    let current = this.rows[2];
    for (let j = 0; j <= cols; j++) previous[j] = j <= maxD ? j : far;
    for (let i = 1; i <= n; i++) {
      const low = Math.max(1, i - maxD);
      const high = Math.min(cols, i + maxD);
      current[low - 1] = low === 1 && i <= maxD ? i : far;
      if (high < cols) current[high + 1] = far;
      const qi = q[i - 1];
      let rowMin = current[low - 1];
      for (let j = low; j <= high; j++) {
        const kj = key.charCodeAt(j - 1);
        let value = previous[j - 1] + (qi === kj ? 0 : 1);
        const deletion = previous[j] + 1;
        if (deletion < value) value = deletion;
        const insertion = current[j - 1] + 1;
        if (insertion < value) value = insertion;
        if (i > 1 && j > 1 && qi === key.charCodeAt(j - 2) && q[i - 2] === kj) {
          const transposition = before[j - 2] + 1;
          if (transposition < value) value = transposition;
        }
        if (value > far) value = far;
        current[j] = value;
        if (value < rowMin) rowMin = value;
      }
      if (rowMin > maxD) return far;
      const recycled = before;
      before = previous;
      previous = current;
      current = recycled;
    }
    let best = far;
    for (let j = Math.max(1, n - maxD); j <= cols; j++) if (previous[j] < best) best = previous[j];
    return best;
  }
}

interface Candidate {
  entry: SearchEntry;
  tier: number;
  distance: number;
  field: number;
  introduction: Introduction | null;
}

function parseNumberQuery(query: string): number | null {
  const match = NUMBER_QUERY.exec(query.normalize("NFKC").toLowerCase().trim());
  return match ? Number(match[1]) : null;
}

function introductionOf(entry: SearchEntry, game: SearchGame | null | undefined) {
  if (!game) return null;
  const groupOrder =
    entry.introducedVersionGroupId == null
      ? null
      : game.groupOrders.get(entry.introducedVersionGroupId);
  return introductionStatus(entry.generationId, groupOrder, game);
}

function compareCandidates(a: Candidate, b: Candidate): number {
  return (
    a.tier - b.tier ||
    a.distance - b.distance ||
    a.field - b.field ||
    Number(a.introduction === "not-introduced") - Number(b.introduction === "not-introduced") ||
    Number(b.entry.isDefault) - Number(a.entry.isDefault) ||
    a.entry.speciesId - b.entry.speciesId ||
    a.entry.pokemonId - b.entry.pokemonId ||
    (a.entry.formId ?? -Infinity) - (b.entry.formId ?? -Infinity)
  );
}

export function searchPokemon(
  index: PreparedIndex,
  query: string,
  options: { game?: SearchGame | null; limit?: number } = {},
): SearchResult[] {
  const limit = options.limit ?? 20;
  if (limit <= 0) return [];
  const candidates: Candidate[] = [];
  const speciesNumber = parseNumberQuery(query);
  if (speciesNumber !== null) {
    for (const { entry } of index.entries)
      if (entry.speciesId === speciesNumber)
        candidates.push({
          entry,
          tier: NUMBER,
          distance: 0,
          field: NAME,
          introduction: introductionOf(entry, options.game),
        });
  } else {
    const compact = normalizeSearchText(query);
    if (!compact) return [];
    const typo = compact.length >= 4 ? new TypoMatcher(compact, compact.length >= 8 ? 2 : 1) : null;
    for (const { entry, keys } of index.entries) {
      let tier = NO_MATCH;
      let field = 0;
      let distance = 0;
      for (const key of keys) {
        const keyTier = textTier(key, compact);
        if (keyTier < tier || (keyTier === tier && key.field < field)) {
          tier = keyTier;
          field = key.field;
          if (tier === EXACT && field === NAME) break;
        }
      }
      if (tier === NO_MATCH && typo) {
        distance = typo.maxDistance + 1;
        for (const key of keys) {
          const keyDistance = typo.distance(key.compact);
          if (keyDistance < distance || (keyDistance === distance && key.field < field)) {
            distance = keyDistance;
            field = key.field;
          }
        }
        if (distance <= typo.maxDistance) tier = TYPO;
      }
      if (tier === NO_MATCH) continue;
      candidates.push({
        entry,
        tier,
        distance,
        field,
        introduction: introductionOf(entry, options.game),
      });
    }
  }
  candidates.sort(compareCandidates);
  return candidates.slice(0, limit).map(({ entry, tier, introduction }) => ({
    entry,
    match: TIERS[tier],
    introduction,
  }));
}
