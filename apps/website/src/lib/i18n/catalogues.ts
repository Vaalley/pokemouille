import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  move: "Moves",
  ability: "Abilities",
  item: "Items",
  intro: "Browse the full list and select a name to see its details.",
  filters: "Catalogue filters",
  query: "Name, in your language or English",
  placeholder: "Search by name…",
  type: "Current type",
  allTypes: "All types",
  category: "Damage category",
  allCategories: "All categories",
  status: "Status",
  physical: "Physical",
  special: "Special",
  unknown: "Unknown category ({id})",
  scope:
    "This list has every entry in our data, not only the ones in the selected game. Names with no translation appear in English. Links to details keep the selected game.",
  moveScope:
    "Type and damage category are today’s values and may not match the selected game. Disc icons show the type only; they don’t mean a TM exists.",
  abilityScope:
    "Abilities don’t have their own icons in the games, so every ability uses the Ability Capsule icon.",
  itemScope: "Items without artwork show a dashed placeholder.",
  count: "{filtered} of {total}",
  empty: "No entries match these filters.",
  reset: "Reset filters",
  loading: "Loading filters from the link…",
  javascript:
    "Turn on JavaScript to filter this list or use filters saved in a link. The full list is below.",
};
const fr = {
  move: "Capacités",
  ability: "Talents",
  item: "Objets",
  intro: "Parcourez la liste complète et sélectionnez un nom pour afficher sa fiche.",
  filters: "Filtres du catalogue",
  query: "Nom, en français ou en anglais",
  placeholder: "Rechercher par nom…",
  type: "Type actuel",
  allTypes: "Tous les types",
  category: "Catégorie de dégâts",
  allCategories: "Toutes les catégories",
  status: "Statut",
  physical: "Physique",
  special: "Spéciale",
  unknown: "Catégorie inconnue ({id})",
  scope:
    "Cette liste contient toutes les entrées de nos données, pas seulement celles du jeu sélectionné. Les noms sans traduction s’affichent en anglais. Les liens vers les fiches conservent le jeu sélectionné.",
  moveScope:
    "Le type et la catégorie de dégâts sont les valeurs actuelles et peuvent différer dans le jeu sélectionné. Les disques indiquent seulement le type ; ils ne signifient pas qu’une CT existe.",
  abilityScope:
    "Les talents n’ont pas d’icône propre dans les jeux : ils utilisent tous l’icône de la Pilule Talent.",
  itemScope: "Un repère en pointillés remplace l’icône des objets sans illustration.",
  count: "{filtered} sur {total}",
  empty: "Aucune entrée ne correspond à ces filtres.",
  reset: "Réinitialiser les filtres",
  loading: "Chargement des filtres du lien…",
  javascript:
    "Activez JavaScript pour filtrer cette liste ou utiliser les filtres enregistrés dans un lien. La liste complète est affichée ci-dessous.",
} satisfies Record<keyof typeof en, string>;
const ja = {
  move: "わざ",
  ability: "とくせい",
  item: "どうぐ",
  intro: "全項目を一覧できます。名前を選ぶと詳細が表示されます。",
  filters: "一覧の絞り込み",
  query: "日本語名または英語名",
  placeholder: "名前で検索…",
  type: "現在のタイプ",
  allTypes: "すべてのタイプ",
  category: "わざの分類",
  allCategories: "すべての分類",
  status: "変化",
  physical: "物理",
  special: "特殊",
  unknown: "不明な分類（{id}）",
  scope:
    "この一覧にはデータ内の全項目が含まれ、選択したゲームのものに限りません。翻訳がない名前は英語で表示されます。詳細へのリンクでは選択したゲームが引き継がれます。",
  moveScope:
    "タイプと分類は現在の値で、選択したゲームとは異なる場合があります。ディスクのアイコンはタイプを表すだけで、わざマシンがあることを示すものではありません。",
  abilityScope:
    "ゲーム内でとくせいごとのアイコンはないため、すべてとくせいカプセルのアイコンを使っています。",
  itemScope: "画像がないどうぐには点線のマークを表示します。",
  count: "全{total}件中{filtered}件",
  empty: "条件に一致する項目はありません。",
  reset: "絞り込みをリセット",
  loading: "リンクの絞り込み条件を読み込み中…",
  javascript:
    "絞り込みや、リンクに保存された条件の利用にはJavaScriptを有効にしてください。以下に全項目を表示しています。",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
