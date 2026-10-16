import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "meta.title": "{name} — Ability — Pokémouille",
  "meta.description":
    "{name}: current ability effects and in-game descriptions grouped by game version group.",
  "identity.kind": "Ability",
  "identity.number": "Ability ID",
  "effect.heading": "Current effects",
  "effect.scope":
    "These effects describe the current reference data. They are not specific to the selected game or any historical version group.",
  "effect.short": "Short effect (current data)",
  "effect.full": "Detailed effect (current data)",
  "effect.missing": "No effect text is available in this language or its fallback languages.",
  "flavor.heading": "In-game descriptions",
  "flavor.scope":
    "Descriptions are grouped by their source game version group. Their wording does not establish the exact mechanics or availability in those games.",
  "flavor.missing":
    "No description is available in this language or its fallback languages for this version group.",
  "flavor.empty": "The source contains no in-game descriptions for this ability.",
} as const satisfies Record<string, string>;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    "meta.title": "{name} — Talent — Pokémouille",
    "meta.description":
      "{name} : effets actuels du talent et descriptions en jeu regroupées par groupe de versions.",
    "identity.kind": "Talent",
    "identity.number": "Identifiant du talent",
    "effect.heading": "Effets actuels",
    "effect.scope":
      "Ces effets décrivent les données de référence actuelles. Ils ne sont propres ni au jeu sélectionné ni à un groupe de versions historique.",
    "effect.short": "Effet résumé (données actuelles)",
    "effect.full": "Effet détaillé (données actuelles)",
    "effect.missing":
      "Aucun texte d’effet n’est disponible dans cette langue ou ses langues de repli.",
    "flavor.heading": "Descriptions en jeu",
    "flavor.scope":
      "Les descriptions sont regroupées selon leur groupe de versions d’origine. Leur formulation n’établit ni les mécaniques exactes ni la disponibilité dans ces jeux.",
    "flavor.missing":
      "Aucune description n’est disponible dans cette langue ou ses langues de repli pour ce groupe de versions.",
    "flavor.empty": "La source ne contient aucune description en jeu pour ce talent.",
  },
  ja: {
    "meta.title": "{name} — 特性 — Pokémouille",
    "meta.description": "{name}の現在の特性の効果と、バージョングループ別のゲーム内説明。",
    "identity.kind": "特性",
    "identity.number": "特性ID",
    "effect.heading": "現在の効果",
    "effect.scope":
      "ここに示す効果は現在の参照データに基づきます。選択中のゲームや過去の特定のバージョングループに対応するものではありません。",
    "effect.short": "効果の概要（現在のデータ）",
    "effect.full": "効果の詳細（現在のデータ）",
    "effect.missing": "この言語とフォールバック言語には、効果の説明がありません。",
    "flavor.heading": "ゲーム内説明",
    "flavor.scope":
      "説明文は出典のバージョングループごとに表示しています。説明文だけでは、そのゲームでの正確な仕様や利用可否は確認できません。",
    "flavor.missing":
      "このバージョングループについて、この言語とフォールバック言語には説明文がありません。",
    "flavor.empty": "出典には、この特性のゲーム内説明がありません。",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
