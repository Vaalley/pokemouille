import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  move: "Moves",
  ability: "Abilities",
  item: "Items",
  intro: "Browse the published snapshot. Select a name to view its details.",
  filters: "Catalogue filters",
  query: "Localized or English name",
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
    "This catalogue includes all entries in the snapshot, not only those available in the selected game. Names may fall back to English. Game context is preserved when opening details.",
  moveScope:
    "Type and damage category are current source values, not historical mechanics for the selected game. Disc icons illustrate type only, not TM availability.",
  abilityScope:
    "The Ability Capsule icon identifies the category; abilities have no individual game icons.",
  itemScope: "Icons use the available item artwork; a dashed marker means no icon is available.",
  count: "Results: {filtered} / {total}",
  empty: "No entries match these filters.",
  reset: "Reset filters",
  loading: "Loading the filters from this URL…",
  javascript:
    "Enable JavaScript to filter this catalogue and restore URL filters. The complete unfiltered catalogue is shown below.",
};
const fr = {
  move: "Capacités",
  ability: "Talents",
  item: "Objets",
  intro: "Parcourez les données publiées. Sélectionnez un nom pour afficher sa fiche.",
  filters: "Filtres du catalogue",
  query: "Nom localisé ou anglais",
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
    "Ce catalogue contient toutes les entrées des données publiées, pas uniquement celles disponibles dans le jeu sélectionné. Les noms manquants peuvent être en anglais. Le jeu sélectionné est conservé dans les liens vers les fiches.",
  moveScope:
    "Le type et la catégorie de dégâts sont les valeurs actuelles de la source, et non les mécaniques historiques du jeu sélectionné. Les disques illustrent uniquement le type, pas la disponibilité d’une CT.",
  abilityScope:
    "L’icône de la Pilule Talent indique la catégorie ; les talents n’ont pas d’icône individuelle dans les jeux.",
  itemScope:
    "Les icônes utilisent les illustrations d’objets disponibles ; un repère en pointillés indique une icône absente.",
  count: "Résultats : {filtered} / {total}",
  empty: "Aucune entrée ne correspond à ces filtres.",
  reset: "Réinitialiser les filtres",
  loading: "Chargement des filtres de cette URL…",
  javascript:
    "Activez JavaScript pour filtrer ce catalogue et restaurer les filtres de l’URL. Le catalogue complet, sans filtre, est affiché ci-dessous.",
} satisfies Record<keyof typeof en, string>;
const ja = {
  move: "わざ",
  ability: "とくせい",
  item: "どうぐ",
  intro: "公開済みのデータを一覧できます。名前を選ぶと詳細が表示されます。",
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
    "この一覧は公開済みデータの全項目を含み、選択したゲームで使えるものだけではありません。翻訳がない名前は英語で表示されることがあります。詳細へのリンクには選択したゲームが引き継がれます。",
  moveScope:
    "タイプと分類は現在のデータの値であり、選択したゲームの過去の仕様ではありません。ディスクのアイコンはタイプのみを表し、わざマシンの有無を示しません。",
  abilityScope:
    "とくせいカプセルのアイコンは項目の種類を表します。とくせいに個別のゲーム内アイコンはありません。",
  itemScope: "利用可能などうぐの画像を表示します。点線のマークは画像がないことを示します。",
  count: "全{total}件中{filtered}件",
  empty: "条件に一致する項目はありません。",
  reset: "絞り込みをリセット",
  loading: "URLの絞り込み条件を読み込み中…",
  javascript:
    "絞り込みとURLの条件の復元にはJavaScriptを有効にしてください。以下に絞り込み前の全項目を表示します。",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
