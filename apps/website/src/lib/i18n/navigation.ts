import { createTranslator, type Language } from "./core.ts";

const en = {
  label: "Browse the Pokédex",
  pokemon: "Pokémon",
  moves: "Moves",
  abilities: "Abilities",
  items: "Items",
  types: "Type matchups",
};

type Key = keyof typeof en;
const dictionaries = {
  en,
  fr: {
    label: "Parcourir le Pokédex",
    pokemon: "Pokémon",
    moves: "Capacités",
    abilities: "Talents",
    items: "Objets",
    types: "Affinités des types",
  },
  ja: {
    label: "ポケモン図鑑を閲覧",
    pokemon: "ポケモン",
    moves: "わざ",
    abilities: "とくせい",
    items: "どうぐ",
    types: "タイプ相性",
  },
} satisfies Record<Language, Record<Key, string>>;

export const t = createTranslator(dictionaries);
