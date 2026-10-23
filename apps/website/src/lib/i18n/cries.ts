import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  heading: "Cry",
  source: "Audio source",
  details: "About this audio",
  latest: "Current source cry",
  legacy: "Legacy source cry",
  scope:
    "Current source audio, not specific to the selected game. “Legacy” is the source label, not a verified cry from that game.",
  missing: "No cry audio is recorded for this Pokémon variety.",
  play: "Play cry",
  player: "Pokémon cry — {source}",
  error:
    "The cry could not be played. The audio may be unreachable or unsupported by your browser.",
  retry: "Retry playback",
  open: "Open audio file",
} as const;

type MessageKey = keyof typeof en;
const messages = {
  en,
  fr: {
    heading: "Cri",
    source: "Source audio",
    details: "À propos de cet audio",
    latest: "Cri actuel de la source",
    legacy: "Ancien cri de la source",
    scope:
      "Audio actuel de la source, non spécifique au jeu sélectionné. « Ancien » est le libellé de la source, pas un cri vérifié pour ce jeu.",
    missing: "Aucun fichier audio de cri n’est renseigné pour cette variété de Pokémon.",
    play: "Écouter le cri",
    player: "Cri du Pokémon — {source}",
    error:
      "Le cri n’a pas pu être lu. Le fichier audio est peut-être inaccessible ou non pris en charge par votre navigateur.",
    retry: "Réessayer la lecture",
    open: "Ouvrir le fichier audio",
  },
  ja: {
    heading: "鳴き声",
    source: "音声ソース",
    details: "音声について",
    latest: "出典の現在の鳴き声",
    legacy: "出典の旧版の鳴き声",
    scope:
      "出典の現在の音声データであり、選択中のゲーム固有のものではありません。「旧版」は出典の分類で、そのゲームの鳴き声として確認されたものではありません。",
    missing: "このポケモンの種類には鳴き声の音声データが記録されていません。",
    play: "鳴き声を再生",
    player: "ポケモンの鳴き声 — {source}",
    error:
      "鳴き声を再生できませんでした。音声に接続できないか、ブラウザーが形式に対応していない可能性があります。",
    retry: "もう一度再生",
    open: "音声ファイルを開く",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
