import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  filters: "Filter the National Pokédex",
  query: "Name or National Pokédex number",
  placeholder: "e.g. Pikachu or #25",
  type: "Type",
  allTypes: "All types",
  generation: "Introduction generation",
  allGenerations: "All generations",
  generationNumber: "Generation {number}",
  scope:
    "Types are the current default variety’s types, not historical types for the selected game. Generation means the species’ introduction. This list does not establish availability in any game.",
  count: "{filtered} of {total} Pokémon",
  empty: "No Pokémon match these filters.",
  reset: "Reset filters",
  loading: "Loading the filters from this URL…",
  javascript: "Enable JavaScript to filter the National Pokédex and restore filters from the URL.",
};
const fr = {
  filters: "Filtrer le Pokédex national",
  query: "Nom ou numéro du Pokédex national",
  placeholder: "Ex. Pikachu ou nº 25",
  type: "Type",
  allTypes: "Tous les types",
  generation: "Génération d’apparition",
  allGenerations: "Toutes les générations",
  generationNumber: "Génération {number}",
  scope:
    "Les types sont ceux actuels de la variété par défaut, et non les types historiques du jeu sélectionné. La génération est celle de l’apparition de l’espèce. Cette liste ne garantit pas sa disponibilité dans un jeu.",
  count: "{filtered} Pokémon sur {total}",
  empty: "Aucun Pokémon ne correspond à ces filtres.",
  reset: "Réinitialiser les filtres",
  loading: "Chargement des filtres de cette URL…",
  javascript:
    "Activez JavaScript pour filtrer le Pokédex national et restaurer les filtres de l’URL.",
} satisfies Record<keyof typeof en, string>;
const ja = {
  filters: "全国図鑑を絞り込む",
  query: "名前または全国図鑑番号",
  placeholder: "例：ピカチュウ、#25",
  type: "タイプ",
  allTypes: "すべてのタイプ",
  generation: "初登場の世代",
  allGenerations: "すべての世代",
  generationNumber: "第{number}世代",
  scope:
    "タイプは現在の標準のすがたのもので、選択したゲームの過去のタイプではありません。世代はその種が初めて登場した世代です。この一覧は各ゲームでの入手の可否を示すものではありません。",
  count: "全{total}匹中{filtered}匹",
  empty: "条件に一致するポケモンはいません。",
  reset: "絞り込みをリセット",
  loading: "URLの絞り込み条件を読み込み中…",
  javascript: "全国図鑑の絞り込みとURLの条件の復元にはJavaScriptを有効にしてください。",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
