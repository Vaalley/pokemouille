import { createTranslator, type Language } from "./core.ts";

const en = {
  heading: "Breeding & egg moves",
  index: "Egg groups",
  members: "Group members",
  other: "Other egg group",
  gender: "Current sex ratio",
  genderless: "Genderless",
  ratio: "♂ {male}% / ♀ {female}%",
  unknown: "Missing source data",
  current:
    "Egg groups and sex ratios are current source assignments, not reconstructed historical facts. Group membership does not establish obtainability, form inheritance, or a legal combination in the selected game.",
  chronology:
    "Introduction chronology only; introduced does not mean obtainable. Historical egg-group changes are unknown.",
  introduced: "Introduced by this game",
  later: "Not introduced yet",
  undated: "Introduction chronology unknown",
  loading: "Loading recorded candidates…",
  error: "Couldn’t load the candidate data.",
  retry: "Retry",
  open: "Show recorded egg-move candidates",
  nojs: "Enable JavaScript to resolve the selected game's egg moves.",
  scope:
    "Candidates use a learnset in this exact version group. Non-egg methods are recorded starting points, not proof the Pokémon can obtain or combine these moves. Egg-only sources need an unresolved inheritance chain. No complete legal chain is verified; an empty list does not mean impossible.",
  rulesOld:
    "Generations II–V: the move donor must be male, share a current egg group, and pair with a female recipient-species parent.",
  rulesNew:
    "Generation VI onward: either parent may pass egg moves. Different-species donors are listed only as male with a female recipient; a female donor is listed only within the same species with a possible male partner. Species, special offspring, form, item and full-chain legality remain unverified.",
  none: "Egg mechanics do not apply in Generation I, Let's Go or Legends games.",
  blocked:
    "No ordinary breeding candidates are asserted for the current No Eggs Discovered / Ditto assignment or a genderless recipient. Ditto cannot supply inherited egg moves. This is not a historical availability claim.",
  baby: "This baby cannot breed. The snapshot does not verify which evolved parent's groups and offspring conditions apply in this game, so no evolved-parent substitute is guessed. Inheritance chains remain unresolved.",
  missingGroups: "The source has no egg-group assignment; compatibility is unknown.",
  noMoves:
    "No egg-move rows are recorded for this selected variety and exact version group. Missing rows do not establish impossibility.",
  direct: "Recorded non-egg move sources",
  chain: "Egg-only sources — chain required",
  empty: "No recorded candidate in this category; other chains or source gaps remain possible.",
  transfer: "Mirror Herb egg-move transfer — not breeding",
  transferDirect: "Recorded non-egg donor sources",
  transferChain: "Egg-only donor sources — acquisition chain required",
  mirror:
    "Scarlet/Violet: give the recipient a Mirror Herb, leave an empty move slot, and hold a picnic with a Pokémon that knows this recorded egg move. Sex and egg groups do not need to match. The donor's listed learnset is source evidence, not proof it currently knows the move; availability and acquisition chains remain unverified.",
  gap: "{count} relevant sources have unknown introduction chronology and are omitted, not declared unavailable.",
  groupsLink: "Browse all egg groups",
  move: "Move",
  formScope:
    "Group membership and sex ratio are species-level current facts, shared by forms; form-specific breeding eligibility is unverified.",
  gamePending: "Loading the selected game…",
  gameError: "Couldn’t resolve the selected game. Reload the page.",
  selectedUnknown:
    "The selected form is not confirmed introduced in this game; no parent candidates are asserted.",
} as const;
type Key = keyof typeof en;
const messages = {
  en,
  fr: {
    heading: "Reproduction et capacités Œuf",
    index: "Groupes d’Œufs",
    members: "Membres du groupe",
    other: "Autre groupe d’Œufs",
    gender: "Ratio des sexes actuel",
    genderless: "Asexué",
    ratio: "♂ {male}% / ♀ {female}%",
    unknown: "Données source manquantes",
    current:
      "Les groupes d’Œufs et ratios des sexes sont les valeurs actuelles de la source, sans reconstitution historique. Ils ne prouvent ni l’obtention, ni l’hérédité des formes, ni la légalité d’une combinaison dans le jeu choisi.",
    chronology:
      "Chronologie d’introduction uniquement ; introduit ne signifie pas obtenable. Les changements historiques de groupes d’Œufs sont inconnus.",
    introduced: "Déjà introduit dans ce jeu",
    later: "Pas encore introduit",
    undated: "Chronologie d’introduction inconnue",
    loading: "Chargement des candidats enregistrés…",
    error: "Impossible de charger les candidats.",
    retry: "Réessayer",
    open: "Afficher les candidats pour les capacités Œuf",
    nojs: "Activez JavaScript pour déterminer les capacités Œuf du jeu choisi.",
    scope:
      "Les candidats ont un apprentissage dans ce groupe de versions exact. Les méthodes hors Œuf sont des points de départ enregistrés, pas une preuve d’obtention ou de compatibilité de toutes les capacités. Les sources Œuf seules nécessitent une chaîne non vérifiée. Aucune chaîne légale complète n’est confirmée ; une liste vide ne signifie pas impossible.",
    rulesOld:
      "Générations II à V : le donneur doit être mâle, partager un groupe d’Œufs actuel et être associé à une femelle de l’espèce destinataire.",
    rulesNew:
      "À partir de la génération VI, les deux parents peuvent transmettre les capacités Œuf. Un donneur d’une autre espèce n’est listé que comme mâle avec une femelle destinataire ; une femelle donneuse doit être de la même espèce avec un partenaire mâle possible. Espèce, descendance spéciale, forme, objet et chaîne complète restent non vérifiés.",
    none: "Les mécanismes d’Œufs ne s’appliquent pas à la génération I, à Let's Go ou aux jeux Légendes.",
    blocked:
      "Aucun candidat ordinaire n’est affirmé pour le groupe actuel Inconnu / Métamorph ou un destinataire asexué. Métamorph ne fournit pas de capacités Œuf héritées. Ce n’est pas une affirmation de disponibilité historique.",
    baby: "Ce bébé ne peut pas se reproduire. La source ne vérifie pas les groupes du parent évolué et les conditions de descendance pour ce jeu ; aucun remplacement n’est deviné. Les chaînes d’hérédité restent indéterminées.",
    missingGroups: "La source ne fournit aucun groupe d’Œufs ; la compatibilité est inconnue.",
    noMoves:
      "Aucune capacité Œuf n’est enregistrée pour cette variété et ce groupe de versions exact. L’absence de lignes ne prouve pas l’impossibilité.",
    direct: "Sources enregistrées hors Œuf",
    chain: "Sources Œuf seules — chaîne requise",
    empty:
      "Aucun candidat enregistré dans cette catégorie ; d’autres chaînes ou lacunes restent possibles.",
    transfer: "Transfert de capacité Œuf par Herbe Miroir — sans reproduction",
    transferDirect: "Donneurs avec source hors Œuf",
    transferChain: "Donneurs Œuf seuls — chaîne d’acquisition requise",
    mirror:
      "Écarlate/Violet : donnez une Herbe Miroir au destinataire, laissez un emplacement de capacité vide et organisez un pique-nique avec un Pokémon connaissant cette capacité Œuf. Le sexe et les groupes d’Œufs n’ont pas à correspondre. L’apprentissage listé ne prouve pas que le donneur connaît actuellement la capacité ; obtention et chaînes restent non vérifiées.",
    gap: "{count} sources pertinentes sont omises car leur chronologie est inconnue, sans être déclarées indisponibles.",
    groupsLink: "Voir tous les groupes d’Œufs",
    move: "Capacité",
    formScope:
      "Groupes et ratio des sexes sont des faits actuels de l’espèce, partagés entre les formes ; la reproduction propre aux formes n’est pas vérifiée.",
    gamePending: "Chargement du jeu sélectionné…",
    gameError: "Impossible de déterminer le jeu choisi. Rechargez la page.",
    selectedUnknown:
      "L’introduction de la forme choisie dans ce jeu n’est pas confirmée ; aucun candidat parent n’est affirmé.",
  },
  ja: {
    heading: "タマゴ・タマゴ技",
    index: "タマゴグループ",
    members: "グループのポケモン",
    other: "もう一つのタマゴグループ",
    gender: "現在の性別比",
    genderless: "性別不明",
    ratio: "♂ {male}% / ♀ {female}%",
    unknown: "出典データなし",
    current:
      "タマゴグループと性別比は現在の出典の値で、過去の値を復元したものではありません。グループは入手可能性、フォルムの遺伝、選択中のゲームでの組み合わせの合法性を証明しません。",
    chronology:
      "登場時期のみを示します。登場済みでも入手可能とは限りません。過去のタマゴグループの変更は不明です。",
    introduced: "このゲームまでに登場済み",
    later: "まだ登場していない",
    undated: "登場時期不明",
    loading: "記録のある候補を読み込み中…",
    error: "候補データを読み込めませんでした。",
    retry: "再試行",
    open: "記録のあるタマゴ技の候補を表示",
    nojs: "選択中のゲームのタマゴ技を表示するにはJavaScriptを有効にしてください。",
    scope:
      "候補は同じバージョングループの習得記録に基づきます。タマゴ以外の習得方法は記録上の出発点であり、入手や技の両立を証明しません。タマゴのみの候補には未確認の遺伝経路が必要です。完全に合法な経路は検証していません。空の一覧も不可能を意味しません。",
    rulesOld:
      "第II〜V世代：技を渡す親は♂で、現在のタマゴグループを共有し、受け手の種族の♀と組み合わせられる必要があります。",
    rulesNew:
      "第VI世代以降はどちらの親からもタマゴ技を遺伝できます。別種の候補は受け手の♀と組む♂のみ、♀の候補は同種で♂の相手が存在する場合のみ表示します。種族、特殊な子、フォルム、道具、完全な経路は未確認です。",
    none: "第I世代、Let's Go、Pokémon LEGENDSではタマゴの仕組みは適用されません。",
    blocked:
      "現在のタマゴ未発見・メタモングループ、または性別不明の受け手には通常の親候補を示しません。メタモンはタマゴ技の遺伝元になりません。過去の入手可能性を示すものではありません。",
    baby: "このベビィポケモンはタマゴを作れません。このゲームで使う進化後の親のグループや子の条件を出典で確認できないため、代わりの親を推測しません。遺伝経路は未確認です。",
    missingGroups: "出典にタマゴグループがないため、相性は不明です。",
    noMoves:
      "この姿と同じバージョングループのタマゴ技の記録はありません。記録がないことは不可能の証明ではありません。",
    direct: "タマゴ以外の習得記録がある候補",
    chain: "タマゴのみの候補 — 遺伝経路が必要",
    empty: "この分類には記録された候補がありません。他の経路やデータの不足は否定できません。",
    transfer: "ものまねハーブによるタマゴ技の横遺伝 — タマゴ作りではありません",
    transferDirect: "タマゴ以外の習得記録がある渡し手",
    transferChain: "タマゴのみの渡し手 — 習得経路が必要",
    mirror:
      "スカーレット・バイオレット：受け手にものまねハーブを持たせ、技の空き枠を用意し、このタマゴ技を覚えているポケモンとピクニックをします。性別やタマゴグループは一致する必要がありません。習得記録は現在その技を覚えていることの証明ではなく、入手や習得経路は未確認です。",
    gap: "関連する{count}件は登場時期が不明なため除外しています。入手不可能という意味ではありません。",
    groupsLink: "すべてのタマゴグループを見る",
    move: "技",
    formScope:
      "グループと性別比は種族単位の現在の値で、各フォルムで共有します。フォルムごとのタマゴ作りの可否は未確認です。",
    gamePending: "選択中のゲームを読み込み中…",
    gameError: "選択中のゲームを確認できませんでした。ページを再読み込みしてください。",
    selectedUnknown: "選択中の姿がこのゲームまでに登場したと確認できないため、親候補は示しません。",
  },
} satisfies Record<Language, Record<Key, string>>;
export const t = createTranslator<Key>(messages);
