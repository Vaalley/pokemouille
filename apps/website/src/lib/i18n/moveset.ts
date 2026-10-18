import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  heading: "Moveset search",
  intro:
    "Choose up to {max} moves to find every Pokémon variety that can learn all of them in the selected game.",
  scope:
    "Only learnsets recorded for the selected game’s exact version group are used, with that group’s methods and levels. Forms introduced after the selected game are left out.",
  obtainable:
    "Learnable doesn’t mean obtainable: being listed doesn’t mean the Pokémon can be caught or received in that game.",
  legality:
    "Combinations aren’t checked: some egg, event or special moves can’t be known together by the same Pokémon, even if it can learn each one.",
  picker: "Choose moves",
  search: "Find a move",
  placeholder: "e.g. Thunderbolt",
  searchHelp: "Type part of a move name, then add it from the list.",
  suggestions: "Matching moves",
  suggestionCount: "{count} matching moves",
  moreSuggestions: "Showing the first {shown}. Keep typing to narrow the list.",
  noSuggestions: "No move matches this name.",
  add: "Add {move}",
  added: "Added",
  selected: "Selected moves ({count} of {max})",
  noneSelected: "No moves selected yet.",
  remove: "Remove {move}",
  full: "You’ve chosen the maximum of {max} moves. Remove one to add another.",
  reset: "Clear all moves",
  loading: "Loading the selected game and moves…",
  javascript: "Turn on JavaScript to search movesets or use moves saved in a link.",
  gamesError: "Couldn’t load the game data. Reload the page to try again.",
  error:
    "Couldn’t load the data for the selected moves. If the site was just updated, reload the page.",
  retry: "Try again",
  invalid:
    "Some moves in the link weren’t recognized or went over the limit of {max}, so they were ignored.",
  empty: "Choose at least one move to see which Pokémon can learn it.",
  game: "Selected game:",
  count: "{count} matching Pokémon varieties",
  perMove: "Learners per move in this game",
  moveCount: "{count} varieties",
  noLearnsets:
    "Our data has no learnsets for this game, so no results can be shown. That’s a gap in the data, not a sign that these moves are unavailable.",
  noResults:
    "No Pokémon variety has all the selected moves recorded for this version group. That doesn’t prove the combination is impossible.",
  sourceGap:
    "{count} possible matches are hidden because our data can’t place their form’s introduction in this game’s timeline. The data is incomplete; these Pokémon aren’t marked as unavailable.",
  caption: "Pokémon varieties that can learn every selected move, with learning methods",
  table: "Results",
  pokemon: "Pokémon",
  number: "No. {id}",
  form: "Form:",
  level: "level {level}",
  levels: "levels {levels}",
  levelUp: "Level-up",
  missingMethod: "Learning method {id} (name not recorded)",
  unnamed: "Pokémon variety {id} (name not recorded)",
};

const fr = {
  heading: "Recherche par capacités",
  intro:
    "Choisissez jusqu’à {max} capacités pour trouver toutes les variétés de Pokémon capables de les apprendre toutes dans le jeu sélectionné.",
  scope:
    "Seuls les apprentissages enregistrés pour le groupe de versions exact du jeu sélectionné sont utilisés, avec les méthodes et niveaux de ce groupe. Les formes apparues après le jeu sélectionné ne sont pas incluses.",
  obtainable:
    "Pouvoir apprendre ne veut pas dire pouvoir obtenir : figurer dans cette liste ne veut pas dire que le Pokémon peut être capturé ou reçu dans ce jeu.",
  legality:
    "Les combinaisons ne sont pas vérifiées : certaines capacités Œuf, d’évènement ou spéciales ne peuvent pas être connues ensemble par un même Pokémon, même s’il peut apprendre chacune d’elles.",
  picker: "Choisir des capacités",
  search: "Trouver une capacité",
  placeholder: "Ex. Tonnerre",
  searchHelp: "Saisissez une partie du nom d’une capacité, puis ajoutez-la depuis la liste.",
  suggestions: "Capacités correspondantes",
  suggestionCount: "{count} capacités correspondantes",
  moreSuggestions: "Affichage des {shown} premières. Continuez à saisir pour affiner la liste.",
  noSuggestions: "Aucune capacité ne correspond à ce nom.",
  add: "Ajouter {move}",
  added: "Ajoutée",
  selected: "Capacités sélectionnées ({count} sur {max})",
  noneSelected: "Aucune capacité sélectionnée pour l’instant.",
  remove: "Retirer {move}",
  full: "Vous avez choisi le maximum de {max} capacités. Retirez-en une pour en ajouter une autre.",
  reset: "Retirer toutes les capacités",
  loading: "Chargement du jeu sélectionné et des capacités…",
  javascript:
    "Activez JavaScript pour rechercher par capacités ou utiliser les capacités enregistrées dans un lien.",
  gamesError: "Impossible de charger les données des jeux. Rechargez la page pour réessayer.",
  error:
    "Impossible de charger les données des capacités sélectionnées. Si le site vient d’être mis à jour, rechargez la page.",
  retry: "Réessayer",
  invalid:
    "Certaines capacités du lien n’ont pas été reconnues ou dépassaient la limite de {max} : elles ont été ignorées.",
  empty: "Choisissez au moins une capacité pour voir quels Pokémon peuvent l’apprendre.",
  game: "Jeu sélectionné :",
  count: "{count} variétés de Pokémon correspondantes",
  perMove: "Pokémon apprenant chaque capacité dans ce jeu",
  moveCount: "{count} variétés",
  noLearnsets:
    "Nos données ne contiennent aucun apprentissage pour ce jeu : aucun résultat ne peut être affiché. Il s’agit d’une lacune des données, pas d’un signe que ces capacités sont indisponibles.",
  noResults:
    "Aucune variété de Pokémon n’a toutes les capacités sélectionnées dans nos données pour ce groupe de versions. Cela ne prouve pas que la combinaison est impossible.",
  sourceGap:
    "{count} correspondances possibles sont masquées : nos données ne permettent pas de situer l’apparition de leur forme par rapport à ce jeu. Les données sont incomplètes ; ces Pokémon ne sont pas marqués comme indisponibles.",
  caption:
    "Variétés de Pokémon capables d’apprendre toutes les capacités sélectionnées, avec les méthodes d’apprentissage",
  table: "Résultats",
  pokemon: "Pokémon",
  number: "Nº {id}",
  form: "Forme :",
  level: "niveau {level}",
  levels: "niveaux {levels}",
  levelUp: "Montée de niveau",
  missingMethod: "Méthode d’apprentissage {id} (nom non renseigné)",
  unnamed: "Variété de Pokémon {id} (nom non renseigné)",
} satisfies Record<keyof typeof en, string>;

const ja = {
  heading: "覚えるわざ検索",
  intro: "わざを{max}つまで選ぶと、選択したゲームでそのすべてを覚えられるポケモンを探せます。",
  scope:
    "選択したゲームと同じバージョングループで記録された習得データだけを、そのグループでの方法とレベルで使います。選択したゲームより後に登場したフォルムは含みません。",
  obtainable:
    "覚えられることは入手できることを意味しません。一覧にいても、そのゲームで捕まえたりもらったりできるとは限りません。",
  legality:
    "組み合わせは確認していません。タマゴわざや配信限定のわざなどは、それぞれ覚えられても同じポケモンが同時に覚えられない場合があります。",
  picker: "わざを選ぶ",
  search: "わざを探す",
  placeholder: "例：10まんボルト",
  searchHelp: "わざの名前の一部を入力し、一覧から追加してください。",
  suggestions: "一致するわざ",
  suggestionCount: "一致するわざ：{count}件",
  moreSuggestions: "最初の{shown}件を表示しています。さらに入力すると絞り込めます。",
  noSuggestions: "この名前に一致するわざはありません。",
  add: "{move}を追加",
  added: "追加済み",
  selected: "選択したわざ（{count}/{max}）",
  noneSelected: "まだわざを選んでいません。",
  remove: "{move}を外す",
  full: "わざは最大{max}つまでです。別のわざを追加するには、どれかを外してください。",
  reset: "すべてのわざを外す",
  loading: "選択したゲームとわざを読み込み中…",
  javascript: "覚えるわざ検索や、リンクに保存されたわざの利用にはJavaScriptを有効にしてください。",
  gamesError: "ゲームデータを読み込めませんでした。ページを再読み込みしてください。",
  error:
    "選択したわざのデータを読み込めませんでした。サイトが更新された直後の場合は、ページを再読み込みしてください。",
  retry: "再試行",
  invalid: "リンク内の一部のわざは認識できないか、上限の{max}つを超えていたため無視しました。",
  empty: "わざを1つ以上選ぶと、覚えられるポケモンが表示されます。",
  game: "選択したゲーム：",
  count: "該当するポケモン：{count}種類",
  perMove: "このゲームでのわざごとの習得ポケモン数",
  moveCount: "{count}種類",
  noLearnsets:
    "このゲームの習得データがないため、結果を表示できません。データの不足であり、これらのわざが使えないという意味ではありません。",
  noResults:
    "このバージョングループで、選択したすべてのわざが記録されているポケモンはいません。組み合わせが不可能だという証明ではありません。",
  sourceGap:
    "{count}件の候補は、フォルムの登場時期をこのゲームの時系列に位置づけられないため非表示です。データが不完全なだけで、入手不可とは判断していません。",
  caption: "選択したすべてのわざを覚えられるポケモンと習得方法",
  table: "結果",
  pokemon: "ポケモン",
  number: "No.{id}",
  form: "フォルム：",
  level: "レベル{level}",
  levels: "レベル{levels}",
  levelUp: "レベルアップ",
  missingMethod: "習得方法{id}（名前の記録なし）",
  unnamed: "ポケモンのバリエーション{id}（名前の記録なし）",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
