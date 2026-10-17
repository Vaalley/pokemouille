import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "meta.title": "{name} | Ability | Pokémouille",
  "meta.description":
    "{name}: introduction, current effects, recorded mechanics history and in-game descriptions.",
  "identity.kind": "Ability",
  "identity.number": "Ability ID",
  generation: "Introduced in Generation {generation}",
  "effect.heading": "Current effects",
  "effect.scope":
    "These effects describe how the ability works today. They may differ in the selected game or earlier ones.",
  "effect.short": "Short effect",
  "effect.full": "Full effect",
  "effect.missing": "No effect text available.",
  "history.heading": "Mechanics history",
  "history.scope":
    "Each note describes the effect before the change in the named games, not the new effect. These source notes are not a complete game-by-game mechanics history. The absence of a note does not mean there were no changes.",
  "history.before": "Before",
  "history.missing": "No prior effect text available for this recorded change.",
  "history.empty": "Our data has no recorded mechanics changes for this ability.",
  "flavor.heading": "In-game descriptions",
  "flavor.scope":
    "Descriptions are grouped by the games they come from. The wording doesn’t confirm exact mechanics in those games, or that the ability is available there.",
  "flavor.missing": "No description available for these games.",
  "flavor.empty": "Our data has no in-game descriptions for this ability.",
  "flavor.games": "Games",
  "flavor.text": "Description",
} as const satisfies Record<string, string>;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    "meta.title": "{name} | Talent | Pokémouille",
    "meta.description":
      "{name} : apparition, effets actuels, historique des mécaniques répertorié et descriptions en jeu.",
    "identity.kind": "Talent",
    "identity.number": "Identifiant du talent",
    generation: "Introduit en génération {generation}",
    "effect.heading": "Effets actuels",
    "effect.scope":
      "Ces effets décrivent le fonctionnement actuel du talent. Ils peuvent différer dans le jeu sélectionné ou dans des jeux plus anciens.",
    "effect.short": "Effet en bref",
    "effect.full": "Effet détaillé",
    "effect.missing": "Aucun texte d’effet en français ni en anglais.",
    "history.heading": "Historique des mécaniques",
    "history.scope":
      "Chaque note décrit l’effet avant le changement survenu dans les jeux indiqués, et non le nouvel effet. Ces notes de la source ne constituent pas un historique complet des mécaniques jeu par jeu. L’absence de note ne signifie pas qu’il n’y a eu aucun changement.",
    "history.before": "Avant",
    "history.missing":
      "Aucun texte d’effet antérieur en français ni en anglais pour ce changement répertorié.",
    "history.empty": "Nos données ne répertorient aucun changement de mécanique pour ce talent.",
    "flavor.heading": "Descriptions en jeu",
    "flavor.scope":
      "Les descriptions sont classées selon les jeux dont elles proviennent. Leur formulation ne confirme ni les mécaniques exactes dans ces jeux, ni que le talent y est disponible.",
    "flavor.missing": "Aucune description en français ni en anglais pour ces jeux.",
    "flavor.empty": "Nos données ne contiennent aucune description en jeu pour ce talent.",
    "flavor.games": "Jeux",
    "flavor.text": "Description",
  },
  ja: {
    "meta.title": "{name} | 特性 | Pokémouille",
    "meta.description":
      "{name}の登場世代、現在の効果、記録されている仕様の変更履歴とゲーム内説明。",
    "identity.kind": "特性",
    "identity.number": "特性ID",
    generation: "第{generation}世代で登場",
    "effect.heading": "現在の効果",
    "effect.scope":
      "現在の仕様での効果です。選択したゲームや過去のゲームでは異なる場合があります。",
    "effect.short": "効果の概要",
    "effect.full": "効果の詳細",
    "effect.missing": "日本語・英語の効果の説明はありません。",
    "history.heading": "仕様の変更履歴",
    "history.scope":
      "各記録は、表示されたゲームでの変更より前の効果を説明しています。変更後の効果ではありません。出典の記録は、ゲームごとの仕様をすべて網羅するものではありません。記録がないことは、変更がなかったことを意味しません。",
    "history.before": "次のゲームでの変更前：",
    "history.missing": "この変更について、日本語・英語の変更前の効果の説明はありません。",
    "history.empty": "データには、この特性の仕様変更の記録がありません。",
    "flavor.heading": "ゲーム内説明",
    "flavor.scope":
      "説明文は元のゲームごとにまとめています。説明文からは、そのゲームでの正確な仕様や、その特性があるかどうかまでは分かりません。",
    "flavor.missing": "このゲームには日本語・英語の説明文がありません。",
    "flavor.empty": "データには、この特性のゲーム内説明がありません。",
    "flavor.games": "ゲーム",
    "flavor.text": "説明",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
