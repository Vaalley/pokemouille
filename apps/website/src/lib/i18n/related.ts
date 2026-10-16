import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "move.heading": "Pokémon that learn this move",
  "ability.heading": "Pokémon with this ability",
  "move.scope":
    "Only learnsets recorded for the selected game’s exact version group are shown, with that group’s methods and levels. Being on this list doesn’t mean a Pokémon can be obtained in that game.",
  "ability.scope":
    "Abilities come from the selected game’s generation and aren’t checked game by game. They don’t confirm that a Pokémon can be obtained or how it behaves in battle, especially in games like Let's Go and Pokémon Legends. Forms introduced after the selected game are left out.",
  game: "Selected game:",
  count: "{count} matching Pokémon varieties",
  loading: "Loading the selected game and related Pokémon…",
  error:
    "Couldn’t load the game data, so related Pokémon can’t be shown. Reload the page to try again.",
  "move.empty":
    "No matching learnsets recorded for this version group. That doesn’t mean the move is unavailable.",
  "ability.empty":
    "No Pokémon have this ability recorded for this generation, counting forms introduced by then. That doesn’t mean it’s unavailable in the selected game.",
  noSource: "Our data doesn’t link any Pokémon to this entry.",
  beforeAbilities: "Abilities didn’t exist in Generations I and II.",
  sourceGap:
    "{count} possible matches are hidden because our data can’t place their form’s introduction in this game’s timeline. The data is incomplete; these Pokémon aren’t marked as unavailable.",
  number: "National Pokédex No. {id}",
  form: "Form:",
  ordinary: "Ordinary ability",
  hidden: "Hidden ability",
  level: "level {level}",
  levelUp: "Level-up",
  missingMethod: "Learning method {id} (name not recorded)",
};

const fr = {
  "move.heading": "Pokémon apprenant cette capacité",
  "ability.heading": "Pokémon possédant ce talent",
  "move.scope":
    "Seuls les apprentissages enregistrés pour le groupe de versions exact du jeu sélectionné sont affichés, avec les méthodes et niveaux de ce groupe. Figurer dans cette liste ne veut pas dire qu’un Pokémon peut être obtenu dans ce jeu.",
  "ability.scope":
    "Les talents viennent de la génération du jeu sélectionné et ne sont pas vérifiés jeu par jeu. Ils ne confirment ni qu’un Pokémon peut être obtenu, ni son comportement en combat, notamment dans les jeux Let's Go et Légendes Pokémon. Les formes apparues après le jeu sélectionné ne sont pas incluses.",
  game: "Jeu sélectionné :",
  count: "{count} variétés de Pokémon correspondantes",
  loading: "Chargement du jeu sélectionné et des Pokémon associés…",
  error:
    "Impossible de charger les données des jeux : les Pokémon associés ne peuvent pas être affichés. Rechargez la page pour réessayer.",
  "move.empty":
    "Aucun apprentissage correspondant n’est enregistré pour ce groupe de versions. Cela ne veut pas dire que la capacité est indisponible.",
  "ability.empty":
    "Aucun Pokémon n’a ce talent dans nos données pour cette génération, en comptant les formes apparues jusque-là. Cela ne veut pas dire qu’il est indisponible dans le jeu sélectionné.",
  noSource: "Nos données ne relient aucun Pokémon à cette entrée.",
  beforeAbilities: "Les talents n’existaient pas dans les générations I et II.",
  sourceGap:
    "{count} correspondances possibles sont masquées : nos données ne permettent pas de situer l’apparition de leur forme par rapport à ce jeu. Les données sont incomplètes ; ces Pokémon ne sont pas marqués comme indisponibles.",
  number: "Pokédex National nº {id}",
  form: "Forme :",
  ordinary: "Talent ordinaire",
  hidden: "Talent caché",
  level: "niveau {level}",
  levelUp: "Montée de niveau",
  missingMethod: "Méthode d’apprentissage {id} (nom non renseigné)",
} satisfies Record<keyof typeof en, string>;

const ja = {
  "move.heading": "このわざを覚えるポケモン",
  "ability.heading": "このとくせいを持つポケモン",
  "move.scope":
    "選択したゲームと同じバージョングループで記録された習得データだけを、そのグループでの方法とレベルで表示します。一覧にいても、そのゲームでポケモンを入手できるとは限りません。",
  "ability.scope":
    "とくせいは選択したゲームの世代のデータで、ゲームごとには確認していません。入手できるかどうかや戦闘での動きを保証するものではありません。特に『Let's Go』や『Pokémon LEGENDS』などでは注意してください。選択したゲームより後に登場したフォルムは含みません。",
  game: "選択したゲーム：",
  count: "該当するポケモン：{count}種類",
  loading: "選択したゲームと関連するポケモンを読み込み中…",
  error:
    "ゲームデータを読み込めなかったため、関連するポケモンを表示できません。ページを再読み込みしてください。",
  "move.empty":
    "このバージョングループには該当する習得データがありません。このわざを使えないという意味ではありません。",
  "ability.empty":
    "この世代（その時点までに登場したフォルムを含む）で、このとくせいを持つポケモンの記録はありません。選択したゲームで使えないという意味ではありません。",
  noSource: "データには、この項目に関連するポケモンがありません。",
  beforeAbilities: "第1・第2世代には、とくせいは存在しませんでした。",
  sourceGap:
    "フォルムの登場時期をこのゲームの時系列に当てはめられないため、候補のうち{count}種類を表示していません。データが不完全なためで、使えないと判定したわけではありません。",
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
