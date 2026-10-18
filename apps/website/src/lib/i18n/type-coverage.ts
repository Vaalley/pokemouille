import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  heading: "Type coverage",
  link: "Offensive coverage calculator and dual-type chart",
  back: "Type matchups",
  intro:
    "Pick the attacking types of a moveset to see how hard it can hit every Pokémon in the selected game, and compare every defending type combination in the type chart.",
  attackLegend: "Attacking types",
  reset: "Clear attacking types",
  loading: "Loading type coverage…",
  javascript: "Turn on JavaScript to load the attacking types and game from the link.",
  error: "Couldn’t load type data.",
  retry: "Retry",
  empty: "Pick one or more attacking types to see their combined coverage.",
  invalid:
    "This attacking type selection isn’t valid. Each attack value must be a standard type ID from 1 to 18.",
  unavailable:
    "At least one selected type didn’t exist in this game’s generation, so no coverage is shown. Clear it or pick another game.",
  coverageHeading: "Coverage",
  coverageScope:
    "Generation {generation} type chart. Each Pokémon counts once, at the best multiplier any selected type deals to the types it had in this generation. Alternate forms are included using the introduction dates in our data; cosmetic forms with the same types are grouped. Abilities, items, moves and other battle effects aren’t counted, and a Pokémon that had appeared by this game may still be impossible to obtain in it. Form icons show the base species.",
  bucketsLabel: "Pokémon by best multiplier",
  bucketCount: "{count} Pokémon",
  bucketSummary: "{multiplier}: {count} Pokémon",
  introductionGap:
    "{count} Pokémon or forms are left out because our data doesn’t say when they were introduced.",
  typeGap:
    "{count} Pokémon or forms that may be in this game have no usable type data for this generation here, so they aren’t counted.",
  resistHeading: "Type combinations resisting every selected type",
  resistScope:
    "Single and dual types found among Pokémon introduced by this game, where every selected type deals less than ×1. The multiplier shown is the best one among the selected types.",
  resistNone: "No type combination found among Pokémon in this game resists every selected type.",
  chartHeading: "Dual-type chart",
  chartScope:
    "Generation {generation} type chart: damage a move of each attacking type (columns) deals to each defending type combination (rows). Abilities, items and other battle effects aren’t counted, and special rules in some games may change the result. Selected attacking types are highlighted.",
  chartCaption: "Damage multipliers against defending type combinations, generation {generation}",
  defending: "Defending types",
  theoretical: "Show all theoretical type combinations",
  existingCount: "{count} type combinations found among Pokémon introduced by this game",
  theoreticalCount:
    "{count} possible type combinations in generation {generation}, including ones no Pokémon has",
};
const fr = {
  heading: "Couverture des types",
  link: "Calculateur de couverture offensive et table des doubles types",
  back: "Affinités des types",
  intro:
    "Choisissez les types d’attaque d’un ensemble de capacités pour voir leur efficacité contre chaque Pokémon du jeu sélectionné, et comparez toutes les combinaisons de types défensives de la table des types.",
  attackLegend: "Types d’attaque",
  reset: "Effacer les types d’attaque",
  loading: "Chargement de la couverture des types…",
  javascript:
    "Activez JavaScript pour charger les types d’attaque et le jeu indiqués dans le lien.",
  error: "Impossible de charger les types.",
  retry: "Réessayer",
  empty: "Choisissez un ou plusieurs types d’attaque pour voir leur couverture combinée.",
  invalid:
    "Cette sélection de types d’attaque n’est pas valide. Chaque valeur attack doit être un identifiant de type standard de 1 à 18.",
  unavailable:
    "Au moins un des types sélectionnés n’existait pas dans la génération de ce jeu : aucune couverture n’est affichée. Retirez-le ou choisissez un autre jeu.",
  coverageHeading: "Couverture",
  coverageScope:
    "Table des types de la génération {generation}. Chaque Pokémon est compté une fois, au meilleur multiplicateur qu’un des types sélectionnés inflige aux types qu’il avait dans cette génération. Les formes alternatives sont incluses selon les dates d’apparition de nos données ; les formes cosmétiques de mêmes types sont regroupées. Les talents, objets, capacités et autres effets de combat ne sont pas pris en compte, et un Pokémon déjà apparu dans ce jeu n’y est pas forcément obtenable. Les icônes des formes représentent l’espèce de base.",
  bucketsLabel: "Pokémon par meilleur multiplicateur",
  bucketCount: "{count} Pokémon",
  bucketSummary: "{multiplier} : {count} Pokémon",
  introductionGap:
    "{count} Pokémon ou formes sont exclus : nos données ne disent pas quand ils sont apparus.",
  typeGap:
    "{count} Pokémon ou formes peut-être présents dans ce jeu n’ont pas de données de type utilisables pour cette génération ici et ne sont pas comptés.",
  resistHeading: "Combinaisons de types résistant à tous les types sélectionnés",
  resistScope:
    "Types simples et doubles présents chez les Pokémon apparus dans ce jeu, contre lesquels chaque type sélectionné inflige moins de ×1. Le multiplicateur affiché est le meilleur parmi les types sélectionnés.",
  resistNone:
    "Aucune combinaison de types présente chez les Pokémon de ce jeu ne résiste à tous les types sélectionnés.",
  chartHeading: "Table des doubles types",
  chartScope:
    "Table des types de la génération {generation} : dégâts infligés par une capacité de chaque type d’attaque (colonnes) à chaque combinaison de types défensive (lignes). Les talents, objets et autres effets de combat ne sont pas pris en compte, et les règles spéciales de certains jeux peuvent changer le résultat. Les types d’attaque sélectionnés sont mis en évidence.",
  chartCaption:
    "Multiplicateurs de dégâts contre les combinaisons de types défensives, génération {generation}",
  defending: "Types défensifs",
  theoretical: "Afficher toutes les combinaisons de types théoriques",
  existingCount: "{count} combinaisons de types présentes chez les Pokémon apparus dans ce jeu",
  theoreticalCount:
    "{count} combinaisons de types possibles en génération {generation}, y compris celles qu’aucun Pokémon n’a",
} satisfies Record<keyof typeof en, string>;
const ja = {
  heading: "タイプ範囲",
  link: "攻撃範囲の計算と複合タイプ相性表",
  back: "タイプ相性",
  intro:
    "わざの攻撃タイプを選ぶと、選択したゲームのすべてのポケモンにどれだけダメージを与えられるかが分かります。タイプ相性表で、防御側のすべてのタイプの組み合わせも比較できます。",
  attackLegend: "攻撃タイプ",
  reset: "攻撃タイプをクリア",
  loading: "タイプ範囲を読み込み中…",
  javascript: "リンクの攻撃タイプとゲームを読み込むにはJavaScriptを有効にしてください。",
  error: "タイプデータを読み込めませんでした。",
  retry: "再試行",
  empty: "攻撃タイプを1つ以上選ぶと、組み合わせた攻撃範囲が表示されます。",
  invalid: "この攻撃タイプ指定は無効です。attack の値は1から18の通常タイプIDにしてください。",
  unavailable:
    "選択したタイプのいずれかがこのゲームの世代に存在しないため、攻撃範囲は表示されません。そのタイプを外すか、別のゲームを選んでください。",
  coverageHeading: "攻撃範囲",
  coverageScope:
    "第{generation}世代のタイプ相性表。各ポケモンは、この世代でのタイプに対して選択したタイプのうち最も高い倍率で1回だけ数えます。別の姿もデータ上の登場時期に基づいて含め、タイプが同じ外見違いのフォルムはまとめて表示します。特性・持ち物・わざなどの戦闘中の効果は含みません。このゲームまでに登場していても、入手できるとは限りません。フォルムのアイコンは基本の種族の姿です。",
  bucketsLabel: "最高倍率ごとのポケモン",
  bucketCount: "{count} 匹・フォルム",
  bucketSummary: "{multiplier}：{count} 匹・フォルム",
  introductionGap: "{count}匹・フォルムは、データに登場時期がないため含めていません。",
  typeGap:
    "このゲームにいる可能性のある{count}匹・フォルムは、この世代で使えるタイプのデータがないため数えていません。",
  resistHeading: "選択したすべてのタイプを半減以下にするタイプの組み合わせ",
  resistScope:
    "このゲームまでに登場したポケモンが持つ単タイプ・複合タイプのうち、選択したどのタイプの倍率も×1未満になるもの。表示する倍率は選択したタイプの中で最も高いものです。",
  resistNone:
    "このゲームのポケモンが持つタイプの組み合わせで、選択したすべてのタイプを半減以下にするものはありません。",
  chartHeading: "複合タイプ相性表",
  chartScope:
    "第{generation}世代のタイプ相性表。各攻撃タイプ（列）のわざが、防御側の各タイプの組み合わせ（行）に与えるダメージです。特性・持ち物などの戦闘中の効果は含まず、ゲームによっては特別なルールで結果が変わることがあります。選択した攻撃タイプは強調表示します。",
  chartCaption: "防御側のタイプの組み合わせに対するダメージ倍率（第{generation}世代）",
  defending: "防御タイプ",
  theoretical: "理論上のすべてのタイプの組み合わせを表示",
  existingCount: "このゲームまでに登場したポケモンが持つタイプの組み合わせ：{count}通り",
  theoreticalCount:
    "第{generation}世代で可能なタイプの組み合わせ：{count}通り（どのポケモンも持たないものを含む）",
} satisfies Record<keyof typeof en, string>;
export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
