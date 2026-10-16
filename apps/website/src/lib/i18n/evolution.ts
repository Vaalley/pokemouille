import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  or: "OR",
  and: "AND",
  dex: "National Pokédex",
  requirements: "All requirements below must be met",
  scope:
    "Evolution methods come from our data and don’t confirm that this evolution works in the selected game. A method recorded for specific games was introduced in those games. A method marked “default” is the one expected in the latest main-series generation and may not apply to older games.",
} as const;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    or: "OU",
    and: "ET",
    dex: "Pokédex National",
    requirements: "Toutes les conditions ci-dessous doivent être remplies",
    scope:
      "Les méthodes d’évolution viennent de nos données et ne confirment pas que cette évolution fonctionne dans le jeu sélectionné. Une méthode enregistrée pour des jeux précis a été introduite dans ces jeux. Une méthode marquée « par défaut » est celle prévue dans la dernière génération principale et peut ne pas s’appliquer aux jeux plus anciens.",
  },
  ja: {
    or: "または",
    and: "かつ",
    dex: "全国図鑑",
    requirements: "以下の条件をすべて満たす必要があります",
    scope:
      "進化方法はデータ上の記録で、選択したゲームでその進化ができることを保証するものではありません。特定のゲームの記録がある方法は、そのゲームで導入されたものです。「既定」と付いた方法は最新の本編世代で想定されるもので、過去のゲームには当てはまらない場合があります。",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
