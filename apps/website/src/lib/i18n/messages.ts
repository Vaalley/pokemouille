import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

/** Language names in their own language: link text must stay recognizable to its readers. */
export const LANGUAGE_ENDONYMS: Record<Language, string> = {
  en: "English",
  fr: "Français",
  ja: "日本語",
};

const en = {
  "site.name": "Pokémouille",
  "site.skipToContent": "Skip to main content",
  "site.controls": "Site settings",
  "language.label": "Language",
  "game.label": "Game",
  "game.loading": "Loading games…",
  "game.error": "The list of games could not be loaded. Reload the page to try again.",
  "game.generation": "Generation {number}",
  "game.japanVersion": "{name} (Japan)",
  "noscript.notice":
    "Game- and form-specific details require JavaScript. Without it, only Pokémon names and numbers are shown.",
  "home.title": "National Pokédex",
  "home.intro":
    "Browse every Pokémon and see its types, stats, abilities and Pokédex entries as they were in the game you choose.",
  "home.count": "{count} Pokémon, in National Pokédex order.",
  "home.listLabel": "Pokémon by National Pokédex number",
  "home.number": "No. {number}",
  "search.label": "Search Pokémon",
  "search.input": "Pokémon name or National Pokédex number",
  "search.results": "Matching Pokémon",
  "search.close": "Close",
  "search.loading": "Loading the Pokémon list…",
  "search.hint": "Type a Pokémon name or its National Pokédex number.",
  "search.empty": "No Pokémon matches “{query}”.",
  "search.count.one": "1 result",
  "search.count.other": "{count} results",
  "search.error": "The Pokémon list could not be loaded.",
  "search.retry": "Try again",
  "search.notIntroduced": "Not introduced in {game}",
  "search.unknownIntroduction": "Introduction unknown in {game}",
  "root.title": "Pokémouille – choose a language",
  "root.choose": "Choose a language",
} as const satisfies Record<string, string>;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    "site.name": "Pokémouille",
    "site.skipToContent": "Aller au contenu principal",
    "site.controls": "Réglages du site",
    "language.label": "Langue",
    "game.label": "Jeu",
    "game.loading": "Chargement des jeux…",
    "game.error": "Impossible de charger la liste des jeux. Rechargez la page pour réessayer.",
    "game.generation": "Génération {number}",
    "game.japanVersion": "{name} (Japon)",
    "noscript.notice":
      "Les informations propres à chaque jeu et à chaque forme nécessitent JavaScript. Sans JavaScript, seuls les noms et les numéros des Pokémon sont affichés.",
    "home.title": "Pokédex National",
    "home.intro":
      "Parcourez tous les Pokémon et consultez leurs types, statistiques, talents et descriptions du Pokédex tels qu’ils étaient dans le jeu de votre choix.",
    "home.count": "{count} Pokémon, dans l’ordre du Pokédex National.",
    "home.listLabel": "Pokémon par numéro du Pokédex National",
    "home.number": "N° {number}",
    "search.label": "Rechercher un Pokémon",
    "search.input": "Nom du Pokémon ou numéro du Pokédex National",
    "search.results": "Pokémon correspondants",
    "search.close": "Fermer",
    "search.loading": "Chargement de la liste des Pokémon…",
    "search.hint": "Saisissez le nom d’un Pokémon ou son numéro du Pokédex National.",
    "search.empty": "Aucun Pokémon ne correspond à « {query} ».",
    "search.count.one": "1 résultat",
    "search.count.other": "{count} résultats",
    "search.error": "Impossible de charger la liste des Pokémon.",
    "search.retry": "Réessayer",
    "search.notIntroduced": "Pas encore apparu dans {game}",
    "search.unknownIntroduction": "Apparition inconnue dans {game}",
    "root.title": "Pokémouille – choisissez une langue",
    "root.choose": "Choisissez une langue",
  },
  ja: {
    "site.name": "Pokémouille",
    "site.skipToContent": "メインコンテンツへスキップ",
    "site.controls": "サイト設定",
    "language.label": "言語",
    "game.label": "ゲーム",
    "game.loading": "ゲームを読み込み中…",
    "game.error": "ゲーム一覧を読み込めませんでした。ページを再読み込みしてください。",
    "game.generation": "第{number}世代",
    "game.japanVersion": "{name}（日本版）",
    "noscript.notice":
      "ゲームやフォームごとの詳細を表示するには JavaScript が必要です。JavaScript が無効な場合は、ポケモンの名前と図鑑番号のみが表示されます。",
    "home.title": "全国図鑑",
    "home.intro":
      "すべてのポケモンを閲覧し、選んだゲームでのタイプ・種族値・特性・図鑑説明を確認できます。",
    "home.count": "全{count}種のポケモン（全国図鑑番号順）",
    "home.listLabel": "全国図鑑番号順のポケモン一覧",
    "home.number": "No.{number}",
    "search.label": "ポケモンを検索",
    "search.input": "ポケモンの名前または全国図鑑番号",
    "search.results": "該当するポケモン",
    "search.close": "閉じる",
    "search.loading": "ポケモン一覧を読み込み中…",
    "search.hint": "ポケモンの名前か全国図鑑番号を入力してください。",
    "search.empty": "「{query}」に一致するポケモンはいません。",
    "search.count.one": "1件",
    "search.count.other": "{count}件",
    "search.error": "ポケモン一覧を読み込めませんでした。",
    "search.retry": "再試行",
    "search.notIntroduced": "{game}には未登場",
    "search.unknownIntroduction": "{game}での登場は不明",
    "root.title": "Pokémouille – 言語を選択",
    "root.choose": "言語を選択してください",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
