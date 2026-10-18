import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";
import type {
  Language,
  LocalizedText,
  Move,
  MoveMeta,
  NamedResource,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { t } from "../i18n/move-properties.ts";

export type BattleMove = Pick<Move, "target" | "attributes" | "statChanges" | "meta">;
type PropertyKey =
  | "hits"
  | "turns"
  | "healing"
  | "hpCost"
  | "drain"
  | "critRate"
  | "ailmentChance"
  | "flinchChance"
  | "statChance";
interface PropertyRow {
  key: PropertyKey;
  value: string;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function range(min: number | null, max: number | null, lang: Language): string {
  if (min === null) return max === null ? t(lang, "missing") : t(lang, "maximum", { value: max });
  if (max === null) return t(lang, "minimum", { value: min });
  return min === max ? String(min) : `${min}–${max}`;
}

function metadataRows(meta: MoveMeta, lang: Language): PropertyRow[] {
  const percent = (value: number | null) =>
    value === null ? t(lang, "missing") : value === 0 ? t(lang, "zeroChance") : `${value}%`;
  return [
    { key: "hits", value: range(meta.minHits, meta.maxHits, lang) },
    { key: "turns", value: range(meta.minTurns, meta.maxTurns, lang) },
    {
      key: meta.healing !== null && meta.healing < 0 ? "hpCost" : "healing",
      value:
        meta.healing === null
          ? t(lang, "missing")
          : t(lang, "healingValue", { value: Math.abs(meta.healing) }),
    },
    {
      key: "drain",
      value:
        meta.drain === null
          ? t(lang, "missing")
          : meta.drain === 0
            ? t(lang, "zeroDrain")
            : t(lang, meta.drain < 0 ? "recoilValue" : "drainValue", { value: signed(meta.drain) }),
    },
    { key: "critRate", value: meta.critRate === null ? t(lang, "missing") : signed(meta.critRate) },
    { key: "ailmentChance", value: percent(meta.ailmentChance) },
    { key: "flinchChance", value: percent(meta.flinchChance) },
    { key: "statChance", value: percent(meta.statChance) },
  ];
}

/** Preserve source uncertainty; a zero secondary-effect chance is not a probability claim. */
export function buildMoveProperties(
  move: BattleMove,
  stats: readonly NamedResource[],
  lang: Language,
) {
  const name = (resource: NamedResource): LocalizedText =>
    localize(resource.names, lang, resource.identifier);
  const meta = move.meta;
  const allRows = meta ? metadataRows(meta, lang) : [];
  const relevant = (key: PropertyKey): boolean => {
    if (!meta) return false;
    switch (key) {
      case "hits":
        return meta.minHits !== null || meta.maxHits !== null;
      case "turns":
        return meta.minTurns !== null || meta.maxTurns !== null;
      case "healing":
      case "hpCost":
        return meta.healing !== null && meta.healing !== 0;
      case "drain":
        return meta.drain !== null && meta.drain !== 0;
      case "critRate":
        return meta.critRate !== null && meta.critRate !== 0;
      case "ailmentChance":
        return (
          (meta.ailment !== null && meta.ailment.identifier !== "none") ||
          (meta.ailmentChance !== null && meta.ailmentChance !== 0)
        );
      case "flinchChance":
        return meta.flinchChance !== null && meta.flinchChance !== 0;
      case "statChance":
        return move.statChanges.length > 0 || (meta.statChance !== null && meta.statChance !== 0);
    }
  };
  return {
    target: move.target ? name(move.target) : null,
    flags: move.attributes.map(name),
    statChanges: move.statChanges.map((change) => {
      const stat = stats.find((entry) => entry.id === change.statId);
      return {
        id: change.statId,
        name: stat ? name(stat) : localize([], lang, t(lang, "stat", { id: change.statId })),
        stages: t(lang, Math.abs(change.change) === 1 ? "stageOne" : "stage", {
          value: signed(change.change),
        }),
      };
    }),
    metadata: meta
      ? {
          ailment: meta.ailment ? name(meta.ailment) : null,
          category: meta.category
            ? localize(
                meta.category.descriptions.map((entry) => ({
                  languageId: entry.languageId,
                  name: entry.description,
                })),
                lang,
                meta.category.identifier,
              )
            : null,
          rows: allRows.filter((row) => relevant(row.key)),
          allRows,
        }
      : null,
  };
}
