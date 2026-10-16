import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  heading: "Defensive type matchups",
  combined: "See defensive matchups for this type combination",
  first: "First type",
  second: "Second type (optional)",
  choose: "Choose a type",
  reset: "Reset types",
  intro:
    "Pick one or two types to see which Pokémon have them and how they take damage in the selected game.",
  empty: "Pick a type to see matching Pokémon and defensive matchups.",
  invalid:
    "This type selection isn’t valid. Choose up to two different standard types (IDs 1 to 18).",
  loading: "Loading type matchups…",
  javascript: "Turn on JavaScript to load the types and game from the link.",
  error: "Couldn’t load type data.",
  retry: "Retry",
  weaknesses: "Weaknesses",
  resistances: "Resistances",
  immunities: "Immunities",
  none: "None",
  pokemonHeading: "Pokémon with these types",
  pokemonCount: "{count} Pokémon",
  pokemonEmpty: "No Pokémon or forms have these types in the selected game.",
  pokemonScope:
    "With one type, the list includes both single- and dual-type Pokémon. With two, it shows only that exact pair, in either order. Alternate forms are included, using the types they had in each generation and the introduction dates in our data. Cosmetic forms with the same types are grouped. A Pokémon that had appeared by this game may still be impossible to obtain in it, and this list is neither a regional Pokédex nor a guide to game-specific battle rules. Form icons show the base species.",
  introductionGap:
    "{count} matching Pokémon or forms are hidden because our data doesn’t say when they were introduced.",
  typeGap:
    "{count} Pokémon or forms that may be in this game have no type data here, so they can’t be sorted by type.",
  scope:
    "Generation {generation} type chart. Multipliers show the damage this type combination takes. Neutral matchups (×1) are left out. Abilities, items, moves and other battle effects aren’t counted, and special rules in some games may change the result.",
  unavailable:
    "At least one selected type didn’t exist in this game’s generation, or there’s no chart for this generation, so no matchups are shown.",
};
const fr = {
  heading: "Affinités défensives des types",
  combined: "Voir les affinités défensives de cette combinaison de types",
  first: "Premier type",
  second: "Second type (facultatif)",
  choose: "Choisir un type",
  reset: "Réinitialiser les types",
  intro:
    "Choisissez un ou deux types pour voir les Pokémon qui les ont et les dégâts qu’ils subissent dans le jeu sélectionné.",
  empty: "Choisissez un type pour voir les Pokémon correspondants et leurs affinités défensives.",
  invalid:
    "Cette sélection de types n’est pas valide. Choisissez au plus deux types standards différents (identifiants 1 à 18).",
  loading: "Chargement des affinités…",
  javascript: "Activez JavaScript pour charger les types et le jeu indiqués dans le lien.",
  error: "Impossible de charger les types.",
  retry: "Réessayer",
  weaknesses: "Faiblesses",
  resistances: "Résistances",
  immunities: "Immunités",
  none: "Aucune",
  pokemonHeading: "Pokémon de ces types",
  pokemonCount: "{count} Pokémon",
  pokemonEmpty: "Aucun Pokémon ni aucune forme n’a ces types dans le jeu sélectionné.",
  pokemonScope:
    "Avec un seul type, la liste inclut les Pokémon à un ou deux types. Avec deux, seule cette paire exacte s’affiche, dans n’importe quel ordre. Les formes alternatives sont incluses, avec les types qu’elles avaient à chaque génération et les dates d’apparition de nos données. Les formes cosmétiques de mêmes types sont regroupées. Un Pokémon déjà apparu dans ce jeu n’y est pas forcément obtenable, et cette liste n’est ni un Pokédex régional ni un guide des règles de combat propres à chaque jeu. Les icônes des formes représentent l’espèce de base.",
  introductionGap:
    "{count} Pokémon ou formes correspondants sont masqués : nos données ne disent pas quand ils sont apparus.",
  typeGap:
    "{count} Pokémon ou formes peut-être présents dans ce jeu n’ont pas de données de type ici et ne peuvent pas être classés.",
  scope:
    "Table des types de la génération {generation}. Les multiplicateurs indiquent les dégâts subis par cette combinaison de types. Les affinités neutres (×1) ne sont pas affichées. Les talents, objets, capacités et autres effets de combat ne sont pas pris en compte, et les règles spéciales de certains jeux peuvent changer le résultat.",
  unavailable:
    "Au moins un des types sélectionnés n’existait pas dans la génération de ce jeu, ou il n’y a pas de table pour cette génération : aucune affinité n’est affichée.",
} satisfies Record<keyof typeof en, string>;
const ja = {
  heading: "防御のタイプ相性",
  combined: "このタイプの組み合わせの防御相性を見る",
  first: "タイプ1",
  second: "タイプ2（任意）",
  choose: "タイプを選択",
  reset: "タイプをリセット",
  intro:
    "タイプを1つか2つ選ぶと、そのタイプを持つポケモンと、選択したゲームで受けるダメージの倍率が表示されます。",
  empty: "タイプを選ぶと、該当するポケモンと防御相性が表示されます。",
  invalid: "このタイプ指定は無効です。異なる通常タイプを2つまで選んでください（ID 1から18）。",
  loading: "タイプ相性を読み込み中…",
  javascript: "リンクのタイプとゲームを読み込むにはJavaScriptを有効にしてください。",
  error: "タイプデータを読み込めませんでした。",
  retry: "再試行",
  weaknesses: "弱点",
  resistances: "耐性",
  immunities: "無効",
  none: "なし",
  pokemonHeading: "このタイプのポケモン",
  pokemonCount: "{count} 匹・フォルム",
  pokemonEmpty: "選択したゲームで、このタイプを持つポケモン・フォルムはいません。",
  pokemonScope:
    "タイプ1つでは単タイプと複合タイプの両方を、2つではその組み合わせのポケモンだけを表示します（順序は問いません）。別の姿も、各世代でのタイプとデータ上の登場時期に基づいて含めます。タイプが同じ外見違いのフォルムはまとめて表示します。このゲームまでに登場していても、入手できるとは限りません。また、地方図鑑やゲームごとの戦闘ルールの一覧ではありません。フォルムのアイコンは基本の種族の姿です。",
  introductionGap: "該当する{count}匹・フォルムは、データに登場時期がないため表示していません。",
  typeGap:
    "このゲームにいる可能性のある{count}匹・フォルムは、タイプのデータがないため分類できません。",
  scope:
    "第{generation}世代のタイプ相性表。倍率はこのタイプの組み合わせが受けるダメージです。等倍（×1）は省略しています。特性・持ち物・わざなどの戦闘中の効果は含まず、ゲームによっては特別なルールで結果が変わることがあります。",
  unavailable:
    "選択したタイプのいずれかがこのゲームの世代に存在しないか、この世代の相性表がないため、相性は表示されません。",
} satisfies Record<keyof typeof en, string>;
export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
