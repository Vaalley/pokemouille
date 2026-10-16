import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  or: "OR",
  and: "AND",
  dex: "National Pokédex",
  requirements: "All requirements below must be met",
  scope:
    "Evolution methods are source records, not confirmation that this evolution is available in the selected game. A source version group indicates when a method was introduced; a default record reflects the latest main-generation expectation, not historical applicability.",
} as const;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    or: "OU",
    and: "ET",
    dex: "Pokédex national",
    requirements: "Toutes les conditions ci-dessous doivent être remplies",
    scope:
      "Les méthodes d’évolution sont des données de la source et ne confirment pas leur disponibilité dans le jeu sélectionné. Le groupe de versions indique l’introduction d’une méthode ; un enregistrement par défaut reflète la dernière génération principale, et non son applicabilité historique.",
  },
  ja: {
    or: "または",
    and: "かつ",
    dex: "全国図鑑",
    requirements: "以下の条件をすべて満たす必要があります",
    scope:
      "進化方法は出典の記録であり、選択中のゲームでの進化を保証しません。出典のバージョングループは方法の導入時期を示します。既定の記録は最新の本編世代で想定される方法であり、過去のゲームへの適用を意味しません。",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
