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
    "Types are the default form’s current types, not the ones it had in the selected game. Generation is when the species first appeared. Being on this list doesn’t mean a Pokémon is available in any particular game.",
  count: "{filtered} of {total} Pokémon",
  empty: "No Pokémon match these filters.",
  reset: "Reset filters",
  loading: "Loading filters from the link…",
  javascript: "Turn on JavaScript to filter the National Pokédex or use filters saved in a link.",
  pagination: "National Pokédex pages",
  previous: "Previous",
  next: "Next",
  pagePosition: "Page {page} of {pages}",
};
const fr = {
  filters: "Filtrer le Pokédex National",
  query: "Nom ou numéro du Pokédex National",
  placeholder: "Ex. Pikachu ou nº 25",
  type: "Type",
  allTypes: "Tous les types",
  generation: "Génération d’apparition",
  allGenerations: "Toutes les générations",
  generationNumber: "Génération {number}",
  scope:
    "Les types sont ceux de la forme par défaut aujourd’hui, pas ceux qu’elle avait dans le jeu sélectionné. La génération indique la première apparition de l’espèce. Figurer dans cette liste ne veut pas dire qu’un Pokémon est disponible dans un jeu donné.",
  count: "{filtered} Pokémon sur {total}",
  empty: "Aucun Pokémon ne correspond à ces filtres.",
  reset: "Réinitialiser les filtres",
  loading: "Chargement des filtres du lien…",
  javascript:
    "Activez JavaScript pour filtrer le Pokédex National ou utiliser les filtres enregistrés dans un lien.",
  pagination: "Pages du Pokédex National",
  previous: "Précédent",
  next: "Suivant",
  pagePosition: "Page {page} sur {pages}",
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
    "タイプは標準のすがたの現在のタイプで、選択したゲーム当時のタイプではありません。世代はその種が初めて登場した世代です。一覧にいても、各ゲームで入手できるとは限りません。",
  count: "全{total}匹中{filtered}匹",
  empty: "条件に一致するポケモンはいません。",
  reset: "絞り込みをリセット",
  loading: "リンクの絞り込み条件を読み込み中…",
  javascript:
    "全国図鑑の絞り込みや、リンクに保存された条件の利用にはJavaScriptを有効にしてください。",
  pagination: "全国図鑑のページ",
  previous: "前へ",
  next: "次へ",
  pagePosition: "{pages}ページ中{page}ページ",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
