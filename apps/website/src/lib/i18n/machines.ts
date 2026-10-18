import { createTranslator, type Language } from "./core.ts";

const en = {
  "item.heading": "Machine-taught move",
  "move.heading": "Machines teaching this move",
  scope:
    "Source machine mappings and machine learnsets use the selected game's exact version group. Missing records do not prove that an item or Pokémon is unavailable in that game.",
  game: "Selected game:",
  loading: "Loading the selected game…",
  error: "Couldn’t resolve the selected game. Try reloading the page.",
  nojs: "Enable JavaScript to resolve your selected game and show its machine mappings.",
  empty: "No machine mapping is recorded for this selection in our data.",
  teaches: "Teaches",
  learners: "Compatible Pokémon",
  noLearners:
    "No confirmed Pokémon with a machine learnset for this move and these exact games is recorded in our data.",
  sourceGap:
    "{count} Pokémon with exact-game machine learnsets are excluded from the confirmed list because their introduction chronology is missing. This does not mean they are unavailable.",
} as const;

type MessageKey = keyof typeof en;
const messages = {
  en,
  fr: {
    "item.heading": "Capacité enseignée par la machine",
    "move.heading": "Machines enseignant cette capacité",
    scope:
      "Les correspondances de machines et les apprentissages par machine proviennent du groupe exact du jeu sélectionné. L’absence de données ne prouve pas qu’un objet ou un Pokémon est indisponible dans ce jeu.",
    game: "Jeu sélectionné :",
    loading: "Chargement du jeu sélectionné…",
    error: "Impossible de déterminer le jeu sélectionné. Rechargez la page.",
    nojs: "Activez JavaScript pour déterminer le jeu sélectionné et afficher ses correspondances de machines.",
    empty: "Nos données ne contiennent aucune correspondance de machine pour cette sélection.",
    teaches: "Enseigne",
    learners: "Pokémon compatibles",
    noLearners:
      "Nos données ne confirment aucun Pokémon apprenant cette capacité par machine dans ces jeux exacts.",
    sourceGap:
      "{count} Pokémon ayant un apprentissage par machine dans ces jeux exacts sont exclus de la liste confirmée, car leur chronologie d’introduction est inconnue. Cela ne signifie pas qu’ils sont indisponibles.",
  },
  ja: {
    "item.heading": "マシンで覚える技",
    "move.heading": "この技を教えるマシン",
    scope:
      "マシンの対応とマシンでの習得は、選択中のゲームと同じバージョングループの記録に基づきます。記録がないことは、そのゲームで道具やポケモンが入手できないことの証明ではありません。",
    game: "選択中のゲーム：",
    loading: "選択中のゲームを読み込み中…",
    error: "選択中のゲームを確認できませんでした。ページを再読み込みしてください。",
    nojs: "選択中のゲームとマシンの対応を表示するには、JavaScriptを有効にしてください。",
    empty: "この選択に対応するマシンの記録はデータにありません。",
    teaches: "覚えられる技：",
    learners: "対応するポケモン",
    noLearners:
      "このゲームで、この技をマシンで覚えることが確認されたポケモンの記録はデータにありません。",
    sourceGap:
      "このゲームでのマシン習得記録がある{count}匹は、登場時期が不明なため確認済みの一覧から除外しています。入手できないことを意味するものではありません。",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
