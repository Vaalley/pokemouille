import { createTranslator, type Language } from "./core.ts";

const en = {
  selector: "Pokédex",
  national: "National Pokédex",
  heading: "Regional Pokédex numbers — {game}",
  regionalNumber: "Regional No.",
  nationalNumber: "National No.",
  sortNumber: "Selected Pokédex number",
  list: "{dex} Pokémon",
  table: "{dex} with current base stats",
  invalid:
    "The Pokédex selected in this link ({dex}) is not mapped to the selected game. Choose one of this game’s Pokédexes or reset to National.",
  invalidOption: "{dex} — invalid for this game",
  unknownDex: "Pokédex ID {id}",
  reset: "Use National Pokédex",
  noMapped:
    "The source maps no regional Pokédex to this game. This is missing mapping data, not evidence that the game has no regional Pokédex.",
  noEntry:
    "The source records no entry for this species in any regional Pokédex mapped to this game.",
  scope:
    "Regional membership and numbers follow the selected game’s exact version group, including its mapped DLC Pokédexes. Membership does not establish obtainability; missing entries do not establish unavailability.",
  loading: "Waiting for the selected game’s Pokédex mapping…",
};
const fr = {
  selector: "Pokédex",
  national: "Pokédex National",
  heading: "Numéros des Pokédex régionaux — {game}",
  regionalNumber: "Nº régional",
  nationalNumber: "Nº national",
  sortNumber: "Numéro du Pokédex sélectionné",
  list: "Pokémon du {dex}",
  table: "{dex} avec les stats de base actuelles",
  invalid:
    "Le Pokédex sélectionné dans ce lien ({dex}) n’est pas associé au jeu sélectionné. Choisissez un Pokédex de ce jeu ou revenez au National.",
  invalidOption: "{dex} — non associé à ce jeu",
  unknownDex: "Pokédex nº {id}",
  reset: "Utiliser le Pokédex National",
  noMapped:
    "La source n’associe aucun Pokédex régional à ce jeu. Il manque une association ; cela ne prouve pas que le jeu n’a pas de Pokédex régional.",
  noEntry: "La source ne répertorie cette espèce dans aucun Pokédex régional associé à ce jeu.",
  scope:
    "L’appartenance et les numéros suivent le groupe de versions exact du jeu sélectionné, y compris les Pokédex de ses DLC associés. Figurer au Pokédex ne prouve pas qu’un Pokémon est obtenable ; une entrée absente ne prouve pas son indisponibilité.",
  loading: "En attente des Pokédex associés au jeu sélectionné…",
} satisfies Record<keyof typeof en, string>;
const ja = {
  selector: "図鑑",
  national: "全国図鑑",
  heading: "地方図鑑番号 — {game}",
  regionalNumber: "地方図鑑No.",
  nationalNumber: "全国図鑑No.",
  sortNumber: "選択した図鑑の番号",
  list: "{dex}のポケモン",
  table: "現在の種族値つき{dex}",
  invalid:
    "リンクで選択された図鑑（{dex}）は、選択したゲームに対応付けられていません。このゲームの図鑑を選ぶか、全国図鑑に戻してください。",
  invalidOption: "{dex} — このゲームとの対応なし",
  unknownDex: "図鑑ID {id}",
  reset: "全国図鑑に戻す",
  noMapped:
    "データ元には、このゲームに対応する地方図鑑の情報がありません。対応情報の不足であり、ゲームに地方図鑑が存在しない証拠ではありません。",
  noEntry: "データ元には、このゲームに対応する地方図鑑への、この種の登録がありません。",
  scope:
    "図鑑への登録と番号は、選択したゲームの正確なバージョングループに従い、対応するDLCの図鑑も含みます。図鑑への登録は入手可能である証拠ではなく、登録がなくても入手不可能とは限りません。",
  loading: "選択したゲームの図鑑情報を待っています…",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
