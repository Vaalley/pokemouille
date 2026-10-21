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
  "flavor.count": "Game groups: {count}",
  "evolution.heading": "Used in evolutions",
  "evolution.scope":
    "These source records require using or holding this item, together with every other listed requirement. Recorded games are provenance, not proof of applicability to the selected game; unscoped and default records are not universal rules. Pokémon links keep your selected game. Missing records do not prove that an evolution is impossible.",
  "evolution.empty": "No evolution requiring this item is recorded in our data.",
  "evolution.loading": "Loading the selected game…",
  "evolution.error": "Couldn’t resolve the selected game. Try reloading the page.",
  "evolution.context": "Game context for Pokémon links:",
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
    "flavor.count": "Groupes de jeux : {count}",
    "evolution.heading": "Utilisé pour des évolutions",
    "evolution.scope":
      "Ces données exigent d’utiliser ou de faire tenir cet objet, avec toutes les autres conditions indiquées. Les jeux enregistrés indiquent la provenance, pas la validité dans le jeu sélectionné ; les données sans jeu précis ou par défaut ne sont pas des règles universelles. Les liens Pokémon conservent le jeu sélectionné. L’absence de données ne prouve pas qu’une évolution est impossible.",
    "evolution.empty": "Nos données ne mentionnent aucune évolution nécessitant cet objet.",
    "evolution.loading": "Chargement du jeu sélectionné…",
    "evolution.error": "Impossible de déterminer le jeu sélectionné. Rechargez la page.",
    "evolution.context": "Jeu conservé dans les liens Pokémon :",
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
    "flavor.count": "ゲームグループ数：{count}",
    "evolution.heading": "進化に使う道具",
    "evolution.scope":
      "この道具を使う・持たせる条件を含む記録です。記載された他の条件もすべて必要です。記録対象のゲームは出典を示し、選択中のゲームで有効だと保証するものではありません。ゲームの指定がない記録や既定の記録も、全ゲーム共通のルールではありません。ポケモンへのリンクには選択中のゲームを引き継ぎます。記録がないことは、進化できないことの証明ではありません。",
    "evolution.empty": "この道具が必要な進化はデータに記録されていません。",
    "evolution.loading": "選択中のゲームを読み込み中…",
    "evolution.error": "選択中のゲームを確認できませんでした。ページを再読み込みしてください。",
    "evolution.context": "ポケモンへのリンクで引き継ぐゲーム：",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
