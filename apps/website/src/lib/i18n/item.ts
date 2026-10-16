import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "meta.title": "{name} — Item — Pokémouille",
  "meta.description":
    "{name}: current item effects and in-game descriptions grouped by game version group.",
  "identity.kind": "Item",
  "identity.number": "Item ID",
  "effect.heading": "Current effects",
  "effect.scope":
    "These effects describe the current reference data. They are not specific to the selected game or any historical version group.",
  "effect.short": "Short effect (current data)",
  "effect.full": "Detailed effect (current data)",
  "effect.missing": "No effect text is available in this language or its fallback languages.",
  "flavor.heading": "In-game descriptions",
  "flavor.scope":
    "Descriptions are grouped by their exact source game version group. Their wording does not establish the exact mechanics or availability in those games. Version groups without source descriptions are not listed.",
  "flavor.missing":
    "No description is available in this language or its fallback languages for this version group.",
  "flavor.empty": "The source contains no in-game descriptions for this item.",
} as const satisfies Record<string, string>;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    "meta.title": "{name} — Objet — Pokémouille",
    "meta.description":
      "{name} : effets actuels de l’objet et descriptions en jeu regroupées par groupe de versions.",
    "identity.kind": "Objet",
    "identity.number": "Identifiant de l’objet",
    "effect.heading": "Effets actuels",
    "effect.scope":
      "Ces effets décrivent les données de référence actuelles. Ils ne sont propres ni au jeu sélectionné ni à un groupe de versions historique.",
    "effect.short": "Effet résumé (données actuelles)",
    "effect.full": "Effet détaillé (données actuelles)",
    "effect.missing":
      "Aucun texte d’effet n’est disponible dans cette langue ou ses langues de repli.",
    "flavor.heading": "Descriptions en jeu",
    "flavor.scope":
      "Les descriptions sont regroupées selon leur groupe de versions d’origine exact. Leur formulation n’établit ni les mécaniques exactes ni la disponibilité dans ces jeux. Les groupes sans description dans la source ne sont pas affichés.",
    "flavor.missing":
      "Aucune description n’est disponible dans cette langue ou ses langues de repli pour ce groupe de versions.",
    "flavor.empty": "La source ne contient aucune description en jeu pour cet objet.",
  },
  ja: {
    "meta.title": "{name} — 道具 — Pokémouille",
    "meta.description": "{name}の現在の効果と、バージョングループ別のゲーム内説明。",
    "identity.kind": "道具",
    "identity.number": "道具ID",
    "effect.heading": "現在の効果",
    "effect.scope":
      "ここに示す効果は現在の参照データに基づきます。選択中のゲームや過去の特定のバージョングループに対応するものではありません。",
    "effect.short": "効果の概要（現在のデータ）",
    "effect.full": "効果の詳細（現在のデータ）",
    "effect.missing": "この言語とフォールバック言語には、効果の説明がありません。",
    "flavor.heading": "ゲーム内説明",
    "flavor.scope":
      "説明文は出典の正確なバージョングループごとに表示しています。説明文だけでは、そのゲームでの正確な仕様や利用可否は確認できません。出典に説明文がないグループは表示しません。",
    "flavor.missing":
      "このバージョングループについて、この言語とフォールバック言語には説明文がありません。",
    "flavor.empty": "出典には、この道具のゲーム内説明がありません。",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
