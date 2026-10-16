import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "move.heading": "Pokémon that learn this move",
  "ability.heading": "Pokémon with this ability",
  "move.scope":
    "Only learnsets recorded for the selected game's exact version group are shown. Methods and levels belong to that group; this does not establish that a Pokémon can be obtained in that game.",
  "ability.scope":
    "Ability assignments are resolved for the selected game's generation, not independently verified for each game. This does not establish obtainability or battle mechanics, especially in games such as Let's Go and Pokémon Legends. Forms introduced after the selected game are excluded.",
  game: "Selected game:",
  count: "{count} matching Pokémon varieties",
  loading: "Loading the selected game and Pokémon relationships…",
  error:
    "The game data could not be loaded. Pokémon relationships cannot be determined. Reload the page to try again.",
  "move.empty":
    "No matching learnsets are recorded for this version group. This is not evidence that the move is unavailable.",
  "ability.empty":
    "No matching ability assignments are recorded for this generation and these form introductions. This is not evidence of unavailability in the selected game.",
  noSource: "No Pokémon relationships for this entry are recorded in the local dataset.",
  beforeAbilities: "Abilities did not exist in Generations I and II.",
  sourceGap:
    "{count} candidate varieties were omitted because their form introduction could not be placed in the game's chronology. The source is incomplete; these varieties are not marked unavailable.",
  number: "National Pokédex No. {id}",
  form: "Form:",
  ordinary: "Ordinary ability",
  hidden: "Hidden ability",
  level: "Level {level}",
  levelUp: "Level-up",
  missingMethod: "Learning method {id} (name not recorded)",
};

const fr = {
  "move.heading": "Pokémon apprenant cette capacité",
  "ability.heading": "Pokémon possédant ce talent",
  "move.scope":
    "Seuls les apprentissages renseignés pour le groupe de versions exact du jeu sélectionné sont affichés. Les méthodes et niveaux concernent ce groupe ; ils ne garantissent pas qu’un Pokémon puisse être obtenu dans ce jeu.",
  "ability.scope":
    "Les talents sont déterminés pour la génération du jeu sélectionné, sans vérification propre à chaque jeu. Cela ne garantit ni l’obtention ni les mécaniques de combat, notamment dans les jeux Let's Go et Légendes Pokémon. Les formes apparues après le jeu sélectionné sont exclues.",
  game: "Jeu sélectionné :",
  count: "{count} variétés de Pokémon correspondantes",
  loading: "Chargement du jeu sélectionné et des Pokémon associés…",
  error:
    "Les données des jeux n’ont pas pu être chargées. Les Pokémon associés ne peuvent pas être déterminés. Rechargez la page pour réessayer.",
  "move.empty":
    "Aucun apprentissage correspondant n’est renseigné pour ce groupe de versions. Cela ne signifie pas que la capacité est indisponible.",
  "ability.empty":
    "Aucun talent correspondant n’est renseigné pour cette génération et ces introductions de formes. Cela ne signifie pas qu’il est indisponible dans le jeu sélectionné.",
  noSource:
    "Aucune relation avec des Pokémon n’est renseignée pour cette entrée dans les données locales.",
  beforeAbilities: "Les talents n’existaient pas dans les générations I et II.",
  sourceGap:
    "{count} variétés candidates ont été omises car l’apparition de leur forme n’a pas pu être située dans la chronologie du jeu. La source est incomplète ; ces variétés ne sont pas indiquées comme indisponibles.",
  number: "Pokédex national nº {id}",
  form: "Forme :",
  ordinary: "Talent ordinaire",
  hidden: "Talent caché",
  level: "Niveau {level}",
  levelUp: "Montée de niveau",
  missingMethod: "Méthode d’apprentissage {id} (nom non renseigné)",
} satisfies Record<keyof typeof en, string>;

const ja = {
  "move.heading": "このわざを覚えるポケモン",
  "ability.heading": "このとくせいを持つポケモン",
  "move.scope":
    "選択したゲームと同じバージョングループに記録された習得データのみを表示します。方法とレベルはそのグループの情報であり、そのゲームでポケモンを入手できることを示すものではありません。",
  "ability.scope":
    "選択したゲームの世代におけるとくせいの割り当てです。ゲームごとの検証ではなく、入手可能性や戦闘の仕様を保証しません。特に『Let's Go』や『Pokémon LEGENDS』などでは注意が必要です。選択したゲームより後に登場したフォルムは除外しています。",
  game: "選択したゲーム：",
  count: "該当するポケモン：{count}種類",
  loading: "選択したゲームと関連するポケモンを読み込み中…",
  error:
    "ゲームデータを読み込めなかったため、関連するポケモンを判定できません。ページを再読み込みしてください。",
  "move.empty":
    "このバージョングループには該当する習得データが記録されていません。このわざを使えないことを示すものではありません。",
  "ability.empty":
    "この世代とフォルムの登場時期に該当するとくせいの割り当ては記録されていません。選択したゲームで利用できないことを示すものではありません。",
  noSource: "ローカルデータには、この項目に関連するポケモンの記録がありません。",
  beforeAbilities: "第1・第2世代には、とくせいは存在しませんでした。",
  sourceGap:
    "フォルムの登場時期をゲームの時系列で確認できないため、候補のうち{count}種類を表示していません。元データが不完全であり、利用不可と判定したものではありません。",
  number: "全国図鑑番号 {id}",
  form: "フォルム：",
  ordinary: "通常のとくせい",
  hidden: "隠れ特性",
  level: "レベル{level}",
  levelUp: "レベルアップ",
  missingMethod: "習得方法 {id}（名称の記録なし）",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
