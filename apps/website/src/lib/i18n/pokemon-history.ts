import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "entries.summary": "All Pokédex entries ({count})",
  "entries.caption":
    "Pokédex entries by game, in release order. Games with identical text share a row.",
  "entries.games": "Games",
  "entries.entry": "Entry",
  "entries.selected": "selected game",
  "entries.empty": "No game has a Pokédex entry for this Pokémon in this language or English.",
  "entries.scope":
    "Each game shows its own text in this language, otherwise in English. Games without either are not listed; another game’s text is never used instead.",
  "entries.form":
    "Pokédex entries are recorded for the species as a whole, so this form shares them.",
  "history.heading": "Changes across generations",
  "history.scope":
    "Built from the source’s historical records of types, base stats, effort values and abilities. These are generation-based values, not a reconstruction of special game mechanics or proof of obtainability.",
  "history.none":
    "No type, base stat, effort value or ability change is recorded for this Pokémon.",
  "history.incomplete":
    "Missing history doesn’t prove that nothing changed: the source may not record every change.",
  "history.unknownIntroduction":
    "The source doesn’t establish when this form was introduced, so its values can’t be placed in generations.",
  "history.types": "Types",
  "history.effort": "{stat} (effort value)",
  "history.ability": "Ability {slot}",
  "history.hiddenAbility": "Hidden ability",
  "history.noAbility": "none",
  "history.unknown": "unknown",
  "history.single": "Gen {from}",
  "history.range": "Gen {from}–{to}",
  "history.open": "Gen {from}+",
  "history.current": "current",
  "history.special":
    "Generation I games use a single Special stat. Generation II replaced it with Sp. Atk and Sp. Def.",
  "compare.link": "Compare with other Pokémon",
};
const fr = {
  "entries.summary": "Toutes les entrées du Pokédex ({count})",
  "entries.caption":
    "Entrées du Pokédex par jeu, dans l’ordre de sortie. Les jeux au texte identique partagent une ligne.",
  "entries.games": "Jeux",
  "entries.entry": "Entrée",
  "entries.selected": "jeu sélectionné",
  "entries.empty": "Aucun jeu n’a d’entrée du Pokédex pour ce Pokémon en français ni en anglais.",
  "entries.scope":
    "Chaque jeu affiche son propre texte en français, sinon en anglais. Les jeux sans l’un ni l’autre ne sont pas listés ; le texte d’un autre jeu n’est jamais utilisé à la place.",
  "entries.form":
    "Les entrées du Pokédex sont enregistrées pour l’espèce entière : cette forme les partage.",
  "history.heading": "Évolutions au fil des générations",
  "history.scope":
    "Établi à partir des données historiques de la source sur les types, les statistiques de base, les points d’effort et les talents. Ces valeurs par génération ne reconstituent pas les mécaniques particulières de chaque jeu et ne prouvent pas qu’un Pokémon peut y être obtenu.",
  "history.none":
    "Aucun changement de type, de statistique de base, de points d’effort ou de talent n’est enregistré pour ce Pokémon.",
  "history.incomplete":
    "L’absence d’historique ne prouve pas que rien n’a changé : la source n’enregistre pas forcément chaque changement.",
  "history.unknownIntroduction":
    "La source n’établit pas quand cette forme est apparue : ses valeurs ne peuvent pas être situées par génération.",
  "history.types": "Types",
  "history.effort": "{stat} (points d’effort)",
  "history.ability": "Talent {slot}",
  "history.hiddenAbility": "Talent caché",
  "history.noAbility": "aucun",
  "history.unknown": "inconnu",
  "history.single": "Gén. {from}",
  "history.range": "Gén. {from}–{to}",
  "history.open": "Gén. {from}+",
  "history.current": "actuel",
  "history.special":
    "Les jeux de 1re génération utilisent une seule statistique Spécial. La 2e génération l’a remplacée par Attaque Spéciale et Défense Spéciale.",
  "compare.link": "Comparer avec d’autres Pokémon",
} satisfies Record<keyof typeof en, string>;
const ja = {
  "entries.summary": "すべての図鑑の説明（{count}件）",
  "entries.caption": "ゲームごとの図鑑の説明（発売順）。同じ文章のゲームは1行にまとめています。",
  "entries.games": "ゲーム",
  "entries.entry": "説明",
  "entries.selected": "選択中のゲーム",
  "entries.empty": "このポケモンの図鑑の説明は、日本語でも英語でもどのゲームにもありません。",
  "entries.scope":
    "各ゲームの文章を日本語で、なければ英語で表示します。どちらもないゲームは載せず、ほかのゲームの文章で代用することはありません。",
  "entries.form": "図鑑の説明は種ごとに記録されているため、このすがたも同じ説明です。",
  "history.heading": "世代ごとの変更",
  "history.scope":
    "タイプ・種族値・努力値・特性について、データソースの過去の記録から作成しています。世代単位の値であり、各ゲーム固有の仕様や、そのゲームで入手できることを示すものではありません。",
  "history.none": "このポケモンのタイプ・種族値・努力値・特性の変更は記録されていません。",
  "history.incomplete":
    "記録がないことは、変更がなかったことの証明にはなりません。データソースがすべての変更を記録しているとは限りません。",
  "history.unknownIntroduction":
    "このすがたの初登場がデータソースで確認できないため、値を世代ごとに示せません。",
  "history.types": "タイプ",
  "history.effort": "{stat}（努力値）",
  "history.ability": "特性{slot}",
  "history.hiddenAbility": "隠れ特性",
  "history.noAbility": "なし",
  "history.unknown": "不明",
  "history.single": "第{from}世代",
  "history.range": "第{from}〜{to}世代",
  "history.open": "第{from}世代以降",
  "history.current": "現在",
  "history.special":
    "第1世代のゲームでは「とくしゅ」がひとつの能力です。第2世代で「とくこう」と「とくぼう」に分かれました。",
  "compare.link": "ほかのポケモンと比較",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);

const ROMAN: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** Generation number as written in each language: Roman numerals in en/fr, digits in ja. */
export function generationNumeral(lang: Language, generationId: number): string {
  if (lang === "ja") return String(generationId);
  let rest = generationId;
  let numeral = "";
  for (const [value, symbol] of ROMAN) for (; rest >= value; rest -= value) numeral += symbol;
  return numeral;
}

/** "Gen II–V", "Gen VI+" (open: the range reaches the latest generation). */
export function generationRange(lang: Language, from: number, to: number, open: boolean): string {
  const params = { from: generationNumeral(lang, from), to: generationNumeral(lang, to) };
  return t(lang, open ? "history.open" : from === to ? "history.single" : "history.range", params);
}
