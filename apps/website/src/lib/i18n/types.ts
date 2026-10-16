import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  heading: "Defensive type matchups",
  combined: "View these types’ combined defensive matchups",
  first: "First type",
  second: "Second type (optional)",
  choose: "Choose a type",
  reset: "Reset types",
  intro:
    "Choose one or two types to see matching Pokémon and defensive matchups for the selected game.",
  empty: "Select a type to see matching Pokémon and defensive matchups.",
  invalid:
    "Invalid or unsupported type selection. Choose up to two different standard types (IDs 1–18).",
  loading: "Loading type matchups…",
  javascript: "JavaScript is required to read the selected types and game from the URL.",
  error: "Type data could not be loaded.",
  retry: "Retry",
  weaknesses: "Weaknesses",
  resistances: "Resistances",
  immunities: "Immunities",
  none: "None",
  pokemonHeading: "Pokémon with these types",
  pokemonCount: "{count} Pokémon / forms",
  pokemonEmpty: "No Pokémon or forms match these types in the selected game’s context.",
  pokemonScope:
    "One type includes both single- and dual-type Pokémon; two types require that exact pair, in either order. Includes alternate varieties using generation-based historical typing and source introduction dates; cosmetic forms with identical typing are grouped together. Introduction does not prove obtainability; this is not a regional Pokédex or a list of game-specific battle mechanics. Form icons depict the base species.",
  introductionGap:
    "{count} matching Pokémon / forms omitted: the source does not establish their introduction chronology.",
  typeGap:
    "{count} potentially introduced Pokémon / forms have no type facts for this context and cannot be classified.",
  scope:
    "Generation {generation} type chart. Multipliers show incoming damage against the selected types combined. Neutral matchups (×1) are omitted. Abilities, items, moves and battle effects are excluded; special game rules may differ.",
  unavailable:
    "One or more selected types did not exist in this game’s generation, or this generation has no supported chart. No matchup chart is shown.",
};
const fr = {
  heading: "Affinités défensives des types",
  combined: "Voir les affinités défensives combinées de ces types",
  first: "Premier type",
  second: "Second type (facultatif)",
  choose: "Choisir un type",
  reset: "Réinitialiser les types",
  intro:
    "Choisissez un ou deux types pour voir les Pokémon correspondants et leurs affinités défensives dans le jeu sélectionné.",
  empty: "Sélectionnez un type pour voir les Pokémon correspondants et leurs affinités défensives.",
  invalid:
    "Sélection de types invalide ou non prise en charge. Choisissez au maximum deux types standards différents (identifiants 1 à 18).",
  loading: "Chargement des affinités…",
  javascript: "JavaScript est nécessaire pour lire les types et le jeu sélectionnés dans l’URL.",
  error: "Impossible de charger les types.",
  retry: "Réessayer",
  weaknesses: "Faiblesses",
  resistances: "Résistances",
  immunities: "Immunités",
  none: "Aucune",
  pokemonHeading: "Pokémon de ces types",
  pokemonCount: "{count} Pokémon / formes",
  pokemonEmpty:
    "Aucun Pokémon ni aucune forme ne correspond à ces types dans le contexte du jeu sélectionné.",
  pokemonScope:
    "Un type inclut les Pokémon à un ou deux types ; deux types exigent cette paire exacte, dans n’importe quel ordre. Les variétés alternatives sont incluses selon les types historiques par génération et les dates d’introduction de la source ; les formes cosmétiques de même typage sont regroupées. Une introduction ne prouve pas l’obtention : ce n’est ni un Pokédex régional ni une liste des mécaniques propres au jeu. Les icônes représentent l’espèce de base.",
  introductionGap:
    "{count} Pokémon / formes correspondants omis : la source n’établit pas leur chronologie d’introduction.",
  typeGap:
    "{count} Pokémon / formes potentiellement introduits n’ont aucune donnée de type dans ce contexte et ne peuvent pas être classés.",
  scope:
    "Table des types de la génération {generation}. Les multiplicateurs indiquent les dégâts reçus par les types sélectionnés combinés. Les affinités neutres (×1) sont omises. Talents, objets, capacités et effets de combat exclus ; les règles spéciales de certains jeux peuvent différer.",
  unavailable:
    "Au moins un type sélectionné n’existait pas dans la génération de ce jeu, ou cette génération n’a pas de table prise en charge. Aucune affinité n’est affichée.",
} satisfies Record<keyof typeof en, string>;
const ja = {
  heading: "防御のタイプ相性",
  combined: "このタイプの複合防御相性を見る",
  first: "タイプ1",
  second: "タイプ2（任意）",
  choose: "タイプを選択",
  reset: "タイプをリセット",
  intro: "タイプを1つまたは2つ選ぶと、選択したゲームで該当するポケモンと防御相性が表示されます。",
  empty: "タイプを選ぶと、該当するポケモンと防御相性が表示されます。",
  invalid:
    "無効または未対応のタイプ指定です。異なる通常タイプを2つまで選んでください（ID 1～18）。",
  loading: "タイプ相性を読み込み中…",
  javascript: "URLのタイプとゲームを読み取るにはJavaScriptが必要です。",
  error: "タイプデータを読み込めませんでした。",
  retry: "再試行",
  weaknesses: "弱点",
  resistances: "耐性",
  immunities: "無効",
  none: "なし",
  pokemonHeading: "このタイプのポケモン",
  pokemonCount: "{count} 匹・フォルム",
  pokemonEmpty: "選択したゲームの条件で、このタイプに該当するポケモン・フォルムはありません。",
  pokemonScope:
    "タイプ1つでは単タイプと複合タイプを含み、2つでは順序を問わずその組み合わせと完全一致するものを表示します。別の姿も、世代別の過去のタイプと出典の登場時期に基づいて含めます。同じタイプの外見上のフォルムはまとめて表示します。登場済みでも入手できるとは限りません。地方図鑑やゲーム固有の戦闘仕様の一覧ではありません。アイコンは基本の種族を表します。",
  introductionGap:
    "該当する{count}匹・フォルムは、出典から登場時期を確認できないため表示していません。",
  typeGap:
    "登場している可能性のある{count}匹・フォルムは、この条件のタイプ情報がなく分類できません。",
  scope:
    "第{generation}世代のタイプ相性。倍率は選択した複合タイプで受けるダメージを示します。等倍（×1）は省略しています。特性・持ち物・技・戦闘中の効果は含みません。ゲーム固有のルールでは異なる場合があります。",
  unavailable:
    "選択したタイプがこのゲームの世代に存在しないか、この世代の相性表に対応していません。相性表は表示されません。",
} satisfies Record<keyof typeof en, string>;
export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
