import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  heading: "Encounter locations",
  game: "Source records for {game}",
  scope:
    "These records belong to the Pokémon variety “{variety}”. They do not distinguish cosmetic forms within that variety and do not confirm a location for the selected cosmetic form.",
  limits:
    "This is not a complete guide to obtaining this Pokémon: gifts, trades, transfers and other methods may be absent. Missing encounter records do not mean the Pokémon is unobtainable.",
  rarityNote:
    "Each percentage is the source rarity of one encounter slot, not an overall encounter rate. Slots may overlap or depend on conditions; their percentages are not added.",
  defaultNote:
    "“Default” identifies a condition value marked as default by the source, not an unconditional encounter.",
  "state.not-introduced":
    "The selected Pokémon or form had not been introduced in {game}. Encounter records are not shown for this selection.",
  "state.unknown":
    "The selected form’s status in {game} is unknown. Encounter records are not shown as applicable to this form.",
  "state.variety-unknown":
    "The selected Pokémon variety could not be matched to encounter records.",
  "state.coverage-unknown":
    "Global encounter-data coverage for {game} is not recorded. We cannot establish whether the source covers this game.",
  "state.game-empty":
    "The source contains no encounter rows for any Pokémon in {game}. Locations for this game are missing from these data.",
  "state.variety-empty":
    "The source has encounter rows for {game}, but none for this Pokémon variety in that exact game.",
  levels: "Levels",
  rarity: "Slot rarity (source)",
  conditions: "Recorded conditions",
  slot: "Source slot / row",
  slotNumber: "Slot {slot}",
  slotUnknown: "Slot number not recorded",
  sourceRow: "Row {id}",
  sourceSlot: "Slot ID {id}",
  default: "default",
  nonDefault: "non-default",
  noConditions: "No conditions recorded",
  incompleteConditions: "Some source conditions are missing from this record.",
  table: "Encounter slots — {method}",
} as const;

type MessageKey = keyof typeof en;
const messages = {
  en,
  fr: {
    heading: "Lieux de rencontre",
    game: "Données source pour {game}",
    scope:
      "Ces données concernent la variété de Pokémon « {variety} ». Elles ne distinguent pas les formes cosmétiques de cette variété et ne confirment pas de lieu pour la forme cosmétique sélectionnée.",
    limits:
      "Ce n’est pas un guide exhaustif d’obtention : les cadeaux, échanges, transferts et d’autres méthodes peuvent manquer. L’absence de rencontres ne signifie pas que ce Pokémon est impossible à obtenir.",
    rarityNote:
      "Chaque pourcentage est la rareté d’un seul emplacement de rencontre dans la source, pas un taux global de rencontre. Les emplacements peuvent se chevaucher ou dépendre de conditions ; leurs pourcentages ne sont pas additionnés.",
    defaultNote:
      "« Par défaut » indique une valeur de condition marquée comme telle par la source, pas une rencontre sans condition.",
    "state.not-introduced":
      "Le Pokémon ou la forme sélectionnée n’avait pas encore été introduit dans {game}. Les rencontres ne sont pas affichées pour cette sélection.",
    "state.unknown":
      "Le statut de la forme sélectionnée dans {game} est inconnu. Les rencontres ne sont pas présentées comme applicables à cette forme.",
    "state.variety-unknown":
      "La variété de Pokémon sélectionnée n’a pas pu être associée aux données de rencontre.",
    "state.coverage-unknown":
      "La couverture globale des données de rencontre pour {game} n’est pas renseignée. Nous ne pouvons pas déterminer si la source couvre ce jeu.",
    "state.game-empty":
      "La source ne contient aucune ligne de rencontre, tous Pokémon confondus, pour {game}. Les lieux de ce jeu manquent dans ces données.",
    "state.variety-empty":
      "La source contient des rencontres pour {game}, mais aucune pour cette variété de Pokémon dans ce jeu précis.",
    levels: "Niveaux",
    rarity: "Rareté de l’emplacement (source)",
    conditions: "Conditions enregistrées",
    slot: "Emplacement / ligne source",
    slotNumber: "Emplacement {slot}",
    slotUnknown: "Numéro d’emplacement non renseigné",
    sourceRow: "Ligne {id}",
    sourceSlot: "ID d’emplacement {id}",
    default: "par défaut",
    nonDefault: "non par défaut",
    noConditions: "Aucune condition renseignée",
    incompleteConditions: "Certaines conditions source manquent dans cet enregistrement.",
    table: "Emplacements de rencontre — {method}",
  },
  ja: {
    heading: "出会える場所",
    game: "{game}の出典データ",
    scope:
      "この記録はポケモンの種類「{variety}」に属します。同じ種類の見た目だけが異なるフォルムは区別されておらず、選択中の見た目のフォルムの出現場所を保証するものではありません。",
    limits:
      "入手方法の完全な一覧ではありません。もらえるポケモン、交換、転送などの方法が含まれていない場合があります。出現記録がないことは、入手不可能であることを意味しません。",
    rarityNote:
      "各割合は出典の出現枠1つのレア度であり、全体の出現率ではありません。出現枠は重複したり条件に依存したりするため、割合は合計しません。",
    defaultNote:
      "「既定」は出典で既定とされた条件の値を示します。無条件で出現するという意味ではありません。",
    "state.not-introduced":
      "選択中のポケモンまたはフォルムは{game}ではまだ登場していません。この選択の出現記録は表示しません。",
    "state.unknown":
      "{game}での選択中のフォルムの状況は不明です。出現記録がこのフォルムに当てはまるとは表示しません。",
    "state.variety-unknown": "選択中のポケモンの種類に対応する出現記録を特定できませんでした。",
    "state.coverage-unknown":
      "{game}の出現データ全体の収録状況は記録されていません。出典がこのゲームに対応しているか判断できません。",
    "state.game-empty":
      "出典には{game}の出現記録が、どのポケモンについてもありません。このゲームの出現場所はデータに含まれていません。",
    "state.variety-empty":
      "出典には{game}の出現記録がありますが、このポケモンの種類については、このゲームの記録がありません。",
    levels: "レベル",
    rarity: "出現枠のレア度（出典）",
    conditions: "記録された条件",
    slot: "出典の出現枠・行",
    slotNumber: "出現枠 {slot}",
    slotUnknown: "出現枠番号の記録なし",
    sourceRow: "行 {id}",
    sourceSlot: "出現枠ID {id}",
    default: "既定",
    nonDefault: "既定以外",
    noConditions: "条件の記録なし",
    incompleteConditions: "この記録には出典の条件の一部が含まれていません。",
    table: "出現枠 — {method}",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);
