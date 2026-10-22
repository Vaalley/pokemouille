import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  label: "Theme",
  auto: "Automatic (system)",
  light: "Light",
  dark: "Dark · Green",
  "dark-red": "Dark · Red",
  "dark-blue": "Dark · Blue",
  "dark-yellow": "Dark · Yellow",
};
const fr = {
  label: "Thème",
  auto: "Automatique (système)",
  light: "Clair",
  dark: "Sombre · Vert",
  "dark-red": "Sombre · Rouge",
  "dark-blue": "Sombre · Bleu",
  "dark-yellow": "Sombre · Jaune",
} satisfies Record<keyof typeof en, string>;
const ja = {
  label: "テーマ",
  auto: "自動（システム設定）",
  light: "ライト",
  dark: "ダーク · 緑",
  "dark-red": "ダーク · 赤",
  "dark-blue": "ダーク · 青",
  "dark-yellow": "ダーク · 黄",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<Language, typeof en>);
