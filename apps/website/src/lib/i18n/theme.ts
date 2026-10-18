import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  label: "Theme",
  auto: "Automatic (system)",
  light: "Light",
  dark: "Dark",
};
const fr = {
  label: "Thème",
  auto: "Automatique (système)",
  light: "Clair",
  dark: "Sombre",
} satisfies Record<keyof typeof en, string>;
const ja = {
  label: "テーマ",
  auto: "自動（システム設定）",
  light: "ライト",
  dark: "ダーク",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<Language, typeof en>);
