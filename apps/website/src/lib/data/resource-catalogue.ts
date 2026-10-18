import type { LocalizedText } from "../../../../../packages/pokemon-data/src/index.ts";

export type ResourceKind = "move" | "ability" | "item";

/** Compact current reference metadata, without descriptions, effects, or relationships. */
export interface ResourceEntry {
  id: number;
  identifier: string;
  name: LocalizedText;
  englishName: string;
  typeId?: number;
  damageClassId?: number;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
}

export interface ResourceCatalogue {
  kind: ResourceKind;
  entries: ResourceEntry[];
  types: { id: number; name: LocalizedText }[];
  categories: number[];
}

export const MOVE_SORTS = ["name", "power", "accuracy", "pp"] as const;
export type MoveSort = (typeof MOVE_SORTS)[number];

/** Unknown URL values use the same stable default as the unfiltered list. */
export function readMoveSort(params: Pick<URLSearchParams, "get">): MoveSort {
  const value = params.get("sort");
  return MOVE_SORTS.find((sort) => sort === value) ?? "name";
}

/** Numbers descend, names ascend; absent/flexible values always sort last. */
export function sortMoves(
  entries: readonly ResourceEntry[],
  sort: MoveSort,
  language: string,
): ResourceEntry[] {
  const collator = new Intl.Collator(language);
  return entries.toSorted((a, b) => {
    if (sort !== "name") {
      const av = a[sort];
      const bv = b[sort];
      // Zero power denotes no fixed base power, not a comparable zero.
      const aMissing = av == null || (sort === "power" && av === 0);
      const bMissing = bv == null || (sort === "power" && bv === 0);
      if (aMissing !== bMissing) return aMissing ? 1 : -1;
      if (!aMissing && !bMissing && av !== bv) return bv - av;
    }
    return collator.compare(a.name.text, b.name.text) || a.id - b.id;
  });
}
