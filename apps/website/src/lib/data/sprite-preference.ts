import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
import type { Language } from "../i18n/core.ts";
import { t, versionName } from "../i18n/pokemon.ts";

// Explicit source paths, never constructed image URLs. Styles remain selectable even
// when the current Pokémon lacks one, so a saved preference works across the Pokédex.
const historical = [
  ["i", "red-green-japan"],
  ["i", "red-blue"],
  ["i", "yellow"],
  ["ii", "gold"],
  ["ii", "silver"],
  ["ii", "crystal"],
  ["iii", "ruby-sapphire"],
  ["iii", "emerald"],
  ["iii", "firered-leafgreen"],
  ["iv", "diamond-pearl"],
  ["iv", "platinum"],
  ["iv", "heartgold-soulsilver"],
  ["v", "black-white"],
  ["vi", "x-y"],
  ["vi", "omegaruby-alphasapphire"],
  ["vii", "ultra-sun-ultra-moon"],
  ["vii", "lets-go-pikachu-lets-go-eevee"],
  ["viii", "sword-shield"],
  ["viii", "brilliant-diamond-shining-pearl"],
  ["viii", "legends-arceus"],
  ["ix", "scarlet-violet"],
  ["ix", "champions"],
] as const;
const animatedGames: Record<string, true> = {
  crystal: true,
  emerald: true,
  "diamond-pearl": true,
  platinum: true,
  "heartgold-soulsilver": true,
  "black-white": true,
};
export const spriteStyles = [
  {
    id: "official",
    path: ["other", "official-artwork"],
    label: "sprites.official" as const,
    pixelated: false,
  },
  { id: "pixel", path: [], label: "sprites.pixel" as const, pixelated: true },
  {
    id: "animated",
    path: ["other", "showdown"],
    label: "sprites.animated" as const,
    pixelated: true,
  },
  { id: "home", path: ["other", "home"], label: "sprites.home" as const, pixelated: false },
  {
    id: "dream",
    path: ["other", "dream_world"],
    label: "sprites.dream" as const,
    pixelated: false,
  },
  ...historical.flatMap(([generation, game]) => {
    const path = ["versions", `generation-${generation}`, game];
    const base = { id: game, path, game, pixelated: true, animated: false };
    return animatedGames[game]
      ? [base, { ...base, id: `${game}-animated`, path: [...path, "animated"], animated: true }]
      : [base];
  }),
];
export type SpriteStyle = (typeof spriteStyles)[number];

export function spriteStyle(value: string | null): SpriteStyle {
  return spriteStyles.find((style) => style.id === value) ?? spriteStyles[0]!;
}

export function spriteStyleName(
  style: SpriteStyle,
  lang: Language,
  games: readonly GameOption[],
): string {
  if ("label" in style) return t(lang, style.label);
  const identifier =
    style.game === "omegaruby-alphasapphire" ? "omega-ruby-alpha-sapphire" : style.game;
  const version = games.find((entry) => entry.version.identifier === identifier);
  const names = version
    ? [versionName(lang, version.version)]
    : games
        .filter((entry) => entry.group.identifier === identifier)
        .map((entry) => versionName(lang, entry.version));
  const name = names.join(" / ") || (identifier === "champions" ? "Pokémon Champions" : identifier);
  return style.animated ? `${name} · ${t(lang, "sprites.animated")}` : name;
}

function front(sprites: unknown, path: readonly string[]): string | null {
  let value = sprites;
  for (const key of [...path, "front_default"]) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function resolveMainSprite(sprites: unknown, artwork: string | null, style: SpriteStyle) {
  const preferred = front(sprites, style.path) ?? (style.id === "official" ? artwork : null);
  return {
    url: preferred ?? artwork,
    fallback: preferred === null && style.id !== "official",
    pixelated: preferred !== null && style.pixelated,
  };
}
