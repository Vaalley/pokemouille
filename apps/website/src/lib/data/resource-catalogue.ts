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
}

export interface ResourceCatalogue {
  kind: ResourceKind;
  entries: ResourceEntry[];
  types: { id: number; name: LocalizedText }[];
  categories: number[];
}
