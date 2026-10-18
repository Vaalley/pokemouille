import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  rangesHeading: "Stat ranges",
  rangesCaption: "Lowest and highest possible stats in {game}",
  level: "Level {level}",
  range: "{min}–{max}",
  rangesModern:
    "Lowest: IV 0, no EVs and a hindering Nature. Highest: IV 31, 252 EVs and a beneficial Nature. Nature doesn’t affect HP.",
  rangesClassic:
    "Lowest: DV 0 and no stat experience. Highest: DV 15 and full stat experience (65,535). There are no Natures in this generation.",
  rangesIndependent:
    "Each range is for one stat independently, not a spread achievable in every stat at once.",
  rangesShedinja: "A Pokémon with a base HP of 1 always has exactly 1 HP.",
  rangesGoPower:
    "Stat ranges aren’t computed for {game}: this game replaces EVs with its own stat bonus (Go Power) and adds a friendship bonus.",
  rangesEffortLevels:
    "Stat ranges aren’t computed for {game}: this game calculates stats with effort levels instead of EVs.",
  rangesSpecialGame:
    "Stat ranges aren’t computed for {game}: we don’t have a verified formula for this game’s mechanics.",

  calcHeading: "Calculated for {game}",
  calcScope:
    "Calculated with this game’s formulas from the current capture rate and Egg cycles above, which may differ from this game’s own values.",
  captureChance: "Capture chance",
  captureValue: "{percent}",
  captureApproximate: "≈ {percent}",
  captureRange: "{min} to {max}",
  captureAssumptions:
    "Capture chance: one ordinary Poké Ball in a normal wild encounter at full HP, no status condition and no other modifier (no critical capture, dark-grass penalty, capture power or level-based bonus or penalty). Guaranteed or scripted captures are excluded.",
  captureHpRange:
    "In Generation II, the result depends slightly on the wild Pokémon’s maximum HP, so a range is shown.",
  captureRounding:
    "From Generation V on, the games round intermediate values: the result is approximate.",
  captureNotComputed:
    "Not computed: this game uses a different capture system and may use different capture rates.",
  captureNotVerified:
    "Not computed: the capture formula hasn’t been verified for this game. The current source rate is shown above.",
  eggSteps: "Steps to hatch",
  eggStepsValue: "≈ {steps} steps ({cycles} cycles × {perCycle} steps)",
  eggStepsNote:
    "Approximate steps for one Egg, without hatching Abilities or Powers, on an ordinary date. The first cycle may already be partly walked. This does not mean an Egg can be obtained for this Pokémon.",
  eggExtraCycle:
    "In this generation, an Egg hatches one cycle after its counter reaches 0, so one extra cycle is counted.",
  eggSpecialDates: "In this game, Egg cycles are shorter on some special dates.",
  eggCyclesOnly: "{cycles} Egg cycles",
  eggCyclesOnlyNote:
    "Steps aren’t computed: the source hasn’t fully confirmed this game’s counter or hatching mechanics (including Egg Powers in Scarlet/Violet). Only the current source Egg cycles are shown.",
  eggNoBreeding: "No Eggs in this game",
  eggNotRecorded: "Egg cycles not recorded",
};
const fr = {
  rangesHeading: "Fourchettes de statistiques",
  rangesCaption: "Statistiques minimales et maximales possibles dans {game}",
  level: "Niveau {level}",
  range: "{min}–{max}",
  rangesModern:
    "Minimum : IV 0, aucun EV et une nature défavorable. Maximum : IV 31, 252 EV et une nature favorable. La nature n’affecte pas les PV.",
  rangesClassic:
    "Minimum : DV 0 et aucune expérience de statistique. Maximum : DV 15 et expérience de statistique complète (65 535). Les natures n’existent pas dans cette génération.",
  rangesIndependent:
    "Chaque fourchette concerne une seule statistique indépendamment : tous les maximums ne sont pas réalisables à la fois.",
  rangesShedinja: "Un Pokémon avec 1 PV de base a toujours exactement 1 PV.",
  rangesGoPower:
    "Fourchettes non calculées pour {game} : ce jeu remplace les EV par son propre bonus de statistiques (Go Power) et ajoute un bonus d’amitié.",
  rangesEffortLevels:
    "Fourchettes non calculées pour {game} : ce jeu calcule les statistiques avec des niveaux d’effort au lieu des EV.",
  rangesSpecialGame:
    "Fourchettes non calculées pour {game} : nous n’avons pas de formule vérifiée pour les mécaniques de ce jeu.",

  calcHeading: "Calculs pour {game}",
  calcScope:
    "Calculés avec les formules de ce jeu à partir du taux de capture et des cycles d’éclosion actuels ci-dessus, qui peuvent différer des valeurs propres à ce jeu.",
  captureChance: "Chance de capture",
  captureValue: "{percent}",
  captureApproximate: "≈ {percent}",
  captureRange: "de {min} à {max}",
  captureAssumptions:
    "Chance de capture : une Poké Ball ordinaire lors d’une rencontre sauvage normale, avec tous les PV, sans altération de statut ni autre modificateur (pas de capture critique, de malus des herbes sombres, de bonus de capture, ni de bonus ou malus lié au niveau). Les captures garanties ou scénarisées sont exclues.",
  captureHpRange:
    "En 2ᵉ génération, le résultat dépend légèrement des PV maximum du Pokémon sauvage : une fourchette est donc affichée.",
  captureRounding:
    "À partir de la 5ᵉ génération, les jeux arrondissent des valeurs intermédiaires : le résultat est approximatif.",
  captureNotComputed:
    "Non calculée : ce jeu utilise un autre système de capture et peut utiliser d’autres taux de capture.",
  captureNotVerified:
    "Non calculée : la formule de capture n’a pas été vérifiée pour ce jeu. Le taux actuel de la source reste affiché ci-dessus.",
  eggSteps: "Pas avant l’éclosion",
  eggStepsValue: "≈ {steps} pas ({cycles} cycles × {perCycle} pas)",
  eggStepsNote:
    "Nombre de pas approximatif pour un seul Œuf, sans talent ni pouvoir d’éclosion, à une date ordinaire. Le premier cycle peut être déjà entamé. Ce calcul ne signifie pas qu’un Œuf de ce Pokémon peut être obtenu.",
  eggExtraCycle:
    "Dans cette génération, un Œuf éclot un cycle après que son compteur atteint 0 : un cycle supplémentaire est donc compté.",
  eggSpecialDates:
    "Dans ce jeu, les cycles d’éclosion sont plus courts à certaines dates spéciales.",
  eggCyclesOnly: "{cycles} cycles d’éclosion",
  eggCyclesOnlyNote:
    "Pas non calculés : la source n’a pas entièrement confirmé le compteur ou les mécaniques d’éclosion de ce jeu (dont les Bonus Œuf dans Écarlate/Violet). Seuls les cycles d’éclosion actuels de la source sont affichés.",
  eggNoBreeding: "Pas d’Œufs dans ce jeu",
  eggNotRecorded: "Cycles d’éclosion non renseignés",
} satisfies Record<keyof typeof en, string>;
const ja = {
  rangesHeading: "能力値の範囲",
  rangesCaption: "{game}での能力値の最小値と最大値",
  level: "レベル{level}",
  range: "{min}〜{max}",
  rangesModern:
    "最小：個体値0、努力値なし、下降補正の性格。最大：個体値31、努力値252、上昇補正の性格。HPは性格の影響を受けません。",
  rangesClassic:
    "最小：個体値（DV）0、基礎ポイントなし。最大：個体値15、基礎ポイント最大（65,535）。この世代には性格がありません。",
  rangesIndependent:
    "各範囲は能力ごとに独立した値です。すべての能力を同時に最大値にできるわけではありません。",
  rangesShedinja: "HPの種族値が1のポケモンは、HPが常に1です。",
  rangesGoPower:
    "{game}では能力値の範囲を計算していません。このゲームでは努力値の代わりに独自の能力ボーナス（AV）があり、なつき度によるボーナスも加わります。",
  rangesEffortLevels:
    "{game}では能力値の範囲を計算していません。このゲームでは努力値の代わりにがんばレベルで能力値が決まります。",
  rangesSpecialGame:
    "{game}では能力値の範囲を計算していません。このゲームの仕様に合った計算式を確認できていないためです。",

  calcHeading: "{game}での計算",
  calcScope:
    "上の現在の捕捉率と孵化サイクルから、このゲームの計算式で求めた値です。このゲーム固有の値とは異なる場合があります。",
  captureChance: "捕獲確率",
  captureValue: "{percent}",
  captureApproximate: "約{percent}",
  captureRange: "{min}〜{max}",
  captureAssumptions:
    "捕獲確率の条件：通常の野生ポケモンとの遭遇で、HP満タン・状態異常なしの相手に普通のモンスターボールを1個投げた場合。捕獲クリティカル、濃い草むらのペナルティ、捕獲パワー、レベル補正などはありません。捕獲が保証される場面や特殊なイベントは対象外です。",
  captureHpRange:
    "第2世代では野生のポケモンの最大HPによって結果がわずかに変わるため、範囲で表示しています。",
  captureRounding: "第5世代以降は途中の値が丸められるため、結果は概算です。",
  captureNotComputed:
    "計算していません。このゲームは捕獲の仕組みが異なり、捕捉率も異なる場合があります。",
  captureNotVerified:
    "計算していません。このゲームの捕獲計算式を確認できていません。現在の捕捉率は上に表示しています。",
  eggSteps: "孵化までの歩数",
  eggStepsValue: "約{steps}歩（{cycles}サイクル × {perCycle}歩）",
  eggStepsNote:
    "通常の日付に、孵化を早める特性やパワーなしでタマゴ1個を孵化させる場合の概算です。最初のサイクルは一部進んでいる場合があります。この計算は、そのポケモンのタマゴを入手できることを意味しません。",
  eggExtraCycle:
    "この世代では、カウンターが0になった次のサイクルで孵化するため、1サイクル多く数えています。",
  eggSpecialDates: "このゲームでは、特定の日付に孵化サイクルが短くなります。",
  eggCyclesOnly: "{cycles}サイクル",
  eggCyclesOnlyNote:
    "参照元でこのゲームのカウンターや孵化の仕組み（スカーレット・バイオレットのタマゴパワーなど）が完全には確認されていないため、歩数は計算せず、現在のデータの孵化サイクルのみ表示しています。",
  eggNoBreeding: "このゲームにはタマゴがありません",
  eggNotRecorded: "孵化サイクルの記録なし",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
