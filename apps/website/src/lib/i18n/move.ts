import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  heading: "Move",
  number: "Move No. {id}",
  type: "Type",
  category: "Category",
  physical: "Physical",
  special: "Special",
  status: "Status",
  power: "Power",
  accuracy: "Accuracy",
  pp: "PP",
  priority: "Priority",
  generation: "Introduced in Generation {generation}",
  effectChance: "Effect chance",
  effect: "Effect",
  scope:
    "Current move data, not specific to the selected game. Earlier games may use different values or effects. A listed move does not establish availability in a game.",
  missing: "Not recorded",
  variable: "Not applicable or variable",
  descriptions: "In-game descriptions",
  games: "Games",
  description: "Description",
  noDescriptions: "No in-game descriptions are recorded.",
  back: "National Pokédex",
};
const fr = {
  heading: "Capacité",
  number: "Capacité nº {id}",
  type: "Type",
  category: "Catégorie",
  physical: "Physique",
  special: "Spéciale",
  status: "Statut",
  power: "Puissance",
  accuracy: "Précision",
  pp: "PP",
  priority: "Priorité",
  generation: "Introduite en génération {generation}",
  effectChance: "Probabilité de l’effet",
  effect: "Effet",
  scope:
    "Données actuelles, indépendantes du jeu sélectionné. Les valeurs et effets peuvent différer dans les jeux antérieurs. La présence d’une capacité ne garantit pas sa disponibilité dans un jeu.",
  missing: "Non renseigné",
  variable: "Sans objet ou variable",
  descriptions: "Descriptions dans les jeux",
  games: "Jeux",
  description: "Description",
  noDescriptions: "Aucune description de jeu n’est renseignée.",
  back: "Pokédex national",
} satisfies Record<keyof typeof en, string>;
const ja = {
  heading: "わざ",
  number: "わざ番号 {id}",
  type: "タイプ",
  category: "分類",
  physical: "物理",
  special: "特殊",
  status: "変化",
  power: "威力",
  accuracy: "命中率",
  pp: "PP",
  priority: "優先度",
  generation: "第{generation}世代で登場",
  effectChance: "追加効果の発生率",
  effect: "効果",
  scope:
    "現在のわざデータであり、選択したゲーム固有のものではありません。過去のゲームでは数値や効果が異なる場合があります。掲載されていても、そのゲームで使用できるとは限りません。",
  missing: "データなし",
  variable: "対象外または変動",
  descriptions: "ゲーム内の説明",
  games: "ゲーム",
  description: "説明",
  noDescriptions: "ゲーム内の説明は記録されていません。",
  back: "全国図鑑",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
