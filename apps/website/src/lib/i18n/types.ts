import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  heading: "Defensive matchups",
  hint: "Hover, focus, or tap the types to see combined matchups.",
  weaknesses: "Weaknesses",
  resistances: "Resistances",
  immunities: "Immunities",
  none: "None",
  scope:
    "Generation {generation} type chart. Multipliers show incoming damage against both types combined. Neutral matchups (×1) are omitted. Abilities, items, and battle effects are not included; special game rules may differ.",
  unavailable: "The type chart is not available for these types or this generation.",
  close: "Close matchups",
};
const fr = {
  heading: "Affinités défensives",
  hint: "Survolez, sélectionnez au clavier ou touchez les types pour voir les affinités combinées.",
  weaknesses: "Faiblesses",
  resistances: "Résistances",
  immunities: "Immunités",
  none: "Aucune",
  scope:
    "Table des types de la génération {generation}. Les multiplicateurs indiquent les dégâts reçus en combinant les deux types. Les affinités neutres (×1) sont omises. Talents, objets et effets de combat exclus ; les règles spéciales de certains jeux peuvent différer.",
  unavailable: "La table des types n’est pas disponible pour ces types ou cette génération.",
  close: "Fermer les affinités",
} satisfies Record<keyof typeof en, string>;
const ja = {
  heading: "防御のタイプ相性",
  hint: "タイプにカーソルを合わせるか、キーボードでフォーカスするか、タップすると、複合タイプの相性を確認できます。",
  weaknesses: "弱点",
  resistances: "耐性",
  immunities: "無効",
  none: "なし",
  scope:
    "第{generation}世代のタイプ相性。倍率は複合タイプで受けるダメージを示します。等倍（×1）は省略しています。特性・持ち物・戦闘中の効果は含みません。ゲーム固有のルールでは異なる場合があります。",
  unavailable: "このタイプまたは世代の相性表はありません。",
  close: "相性を閉じる",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
