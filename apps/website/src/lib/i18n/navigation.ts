import { createTranslator, type Language } from "./core.ts";

const en = {
  label: "Browse the Pokédex",
  pokemon: "Pokémon",
  moves: "Moves",
  abilities: "Abilities",
  items: "Items",
  types: "Type matchups",
  compare: "Compare",
  moveset: "Moveset search",
  locations: "Locations",
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
    compare: "Comparer",
    moveset: "Recherche par capacités",
    locations: "Lieux",
  },
  ja: {
    label: "ポケモン図鑑を閲覧",
    pokemon: "ポケモン",
    moves: "わざ",
    abilities: "とくせい",
    items: "どうぐ",
    types: "タイプ相性",
    compare: "ポケモン比較",
    moveset: "わざで探す",
    locations: "場所",
  },
} satisfies Record<Language, Record<Key, string>>;

export const t = createTranslator(dictionaries);
