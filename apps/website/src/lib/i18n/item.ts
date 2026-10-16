import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "meta.title": "{name} | Item | Pokémouille",
  "meta.description": "{name}: what the item does today, and its in-game descriptions by game.",
  "identity.kind": "Item",
  "identity.number": "Item ID",
  "effect.heading": "Current effects",
  "effect.scope":
    "These effects describe how the item works today. They may differ in the selected game or earlier ones.",
  "effect.short": "Short effect",
  "effect.full": "Full effect",
  "effect.missing": "No effect text available.",
  "flavor.heading": "In-game descriptions",
  "flavor.scope":
    "Descriptions are grouped by the exact games they come from, and games without one aren’t listed. The wording doesn’t confirm exact mechanics in those games, or that the item is available there.",
  "flavor.missing": "No description available for these games.",
  "flavor.empty": "Our data has no in-game descriptions for this item.",
  "flavor.games": "Games",
  "flavor.text": "Description",
} as const satisfies Record<string, string>;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    "meta.title": "{name} | Objet | Pokémouille",
    "meta.description":
      "{name} : l’effet actuel de l’objet et ses descriptions en jeu, classées par jeu.",
    "identity.kind": "Objet",
    "identity.number": "Identifiant de l’objet",
    "effect.heading": "Effets actuels",
    "effect.scope":
      "Ces effets décrivent le fonctionnement actuel de l’objet. Ils peuvent différer dans le jeu sélectionné ou dans des jeux plus anciens.",
    "effect.short": "Effet en bref",
    "effect.full": "Effet détaillé",
    "effect.missing": "Aucun texte d’effet en français ni en anglais.",
    "flavor.heading": "Descriptions en jeu",
    "flavor.scope":
      "Les descriptions sont classées selon les jeux exacts dont elles proviennent ; les jeux sans description ne sont pas affichés. Leur formulation ne confirme ni les mécaniques exactes dans ces jeux, ni que l’objet y est disponible.",
    "flavor.missing": "Aucune description en français ni en anglais pour ces jeux.",
    "flavor.empty": "Nos données ne contiennent aucune description en jeu pour cet objet.",
    "flavor.games": "Jeux",
    "flavor.text": "Description",
  },
  ja: {
    "meta.title": "{name} | 道具 | Pokémouille",
    "meta.description": "{name}の現在の効果と、ゲームごとのゲーム内説明。",
    "identity.kind": "道具",
    "identity.number": "道具ID",
    "effect.heading": "現在の効果",
    "effect.scope":
      "現在の仕様での効果です。選択したゲームや過去のゲームでは異なる場合があります。",
    "effect.short": "効果の概要",
    "effect.full": "効果の詳細",
    "effect.missing": "日本語・英語の効果の説明はありません。",
    "flavor.heading": "ゲーム内説明",
    "flavor.scope":
      "説明文は元のゲームごとにまとめ、説明文がないゲームは表示しません。説明文からは、そのゲームでの正確な仕様や、その道具があるかどうかまでは分かりません。",
    "flavor.missing": "このゲームには日本語・英語の説明文がありません。",
    "flavor.empty": "データには、この道具のゲーム内説明がありません。",
    "flavor.games": "ゲーム",
    "flavor.text": "説明",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
