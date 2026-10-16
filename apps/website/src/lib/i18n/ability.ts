import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "meta.title": "{name} | Ability | Pokémouille",
  "meta.description": "{name}: what the ability does today, and its in-game descriptions by game.",
  "identity.kind": "Ability",
  "identity.number": "Ability ID",
  "effect.heading": "Current effects",
  "effect.scope":
    "These effects describe how the ability works today. They may differ in the selected game or earlier ones.",
  "effect.short": "Short effect",
  "effect.full": "Full effect",
  "effect.missing": "No effect text available.",
  "flavor.heading": "In-game descriptions",
  "flavor.scope":
    "Descriptions are grouped by the games they come from. The wording doesn’t confirm exact mechanics in those games, or that the ability is available there.",
  "flavor.missing": "No description available for these games.",
  "flavor.empty": "Our data has no in-game descriptions for this ability.",
} as const satisfies Record<string, string>;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    "meta.title": "{name} | Talent | Pokémouille",
    "meta.description":
      "{name} : l’effet actuel du talent et ses descriptions en jeu, classées par jeu.",
    "identity.kind": "Talent",
    "identity.number": "Identifiant du talent",
    "effect.heading": "Effets actuels",
    "effect.scope":
      "Ces effets décrivent le fonctionnement actuel du talent. Ils peuvent différer dans le jeu sélectionné ou dans des jeux plus anciens.",
    "effect.short": "Effet en bref",
    "effect.full": "Effet détaillé",
    "effect.missing": "Aucun texte d’effet en français ni en anglais.",
    "flavor.heading": "Descriptions en jeu",
    "flavor.scope":
      "Les descriptions sont classées selon les jeux dont elles proviennent. Leur formulation ne confirme ni les mécaniques exactes dans ces jeux, ni que le talent y est disponible.",
    "flavor.missing": "Aucune description en français ni en anglais pour ces jeux.",
    "flavor.empty": "Nos données ne contiennent aucune description en jeu pour ce talent.",
  },
  ja: {
    "meta.title": "{name} | 特性 | Pokémouille",
    "meta.description": "{name}の現在の効果と、ゲームごとのゲーム内説明。",
    "identity.kind": "特性",
    "identity.number": "特性ID",
    "effect.heading": "現在の効果",
    "effect.scope":
      "現在の仕様での効果です。選択したゲームや過去のゲームでは異なる場合があります。",
    "effect.short": "効果の概要",
    "effect.full": "効果の詳細",
    "effect.missing": "日本語・英語の効果の説明はありません。",
    "flavor.heading": "ゲーム内説明",
    "flavor.scope":
      "説明文は元のゲームごとにまとめています。説明文からは、そのゲームでの正確な仕様や、その特性があるかどうかまでは分かりません。",
    "flavor.missing": "このゲームには日本語・英語の説明文がありません。",
    "flavor.empty": "データには、この特性のゲーム内説明がありません。",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
