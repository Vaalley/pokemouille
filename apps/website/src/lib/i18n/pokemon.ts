import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";
import type { LocalizedText, Version } from "../../../../../packages/pokemon-data/src/index.ts";
import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";
import { t as uiT } from "./messages.ts";

const en = {
  "meta.title": "{name} — #{number} — Pokémouille",
  "meta.description":
    "{name} (No. {number}), introduced in Generation {generation}. Types, base stats, abilities, Pokédex text and moves for the game you choose.",
  "meta.descriptionGenus":
    "{name} (No. {number}, {genus}), introduced in Generation {generation}. Types, base stats, abilities, Pokédex text and moves for the game you choose.",

  "identity.number": "National Pokédex No.",
  "identity.numberValue": "No. {number}",
  "identity.genus": "Category",
  "identity.introduced": "Introduced",
  "identity.generation": "Generation {number}",
  "identity.form": "Selected form",
  "identity.artworkAlt": "Artwork of {name}",
  "identity.artworkNote": "Illustrative artwork, not specific to the selected game.",
  "identity.artworkMissing": "No artwork is available for this form.",
  "identity.adjacent": "Neighbouring Pokémon",
  "identity.previous": "Previous: No. {number} {name}",
  "identity.next": "Next: No. {number} {name}",

  "context.game": "Game: {game}",
  "context.source.url": "chosen in the link",
  "context.source.preference": "your saved game",
  "context.source.default": "default game",
  "context.rejected":
    "The game “{version}” in this link is not recognized. Showing {game} instead.",
  "context.mechanics":
    "Types, stats and abilities follow the selected game’s generation; differences in game-specific rules are not verified.",
  "context.rejectedLink": "Open a link to this page for {game}",

  "state.loadingGames": "Loading the list of games…",
  "state.loading": "Loading data for {game}…",
  "state.errorHeading": "This data could not be loaded",
  "state.error.network": "The data could not be downloaded. Check your connection and try again.",
  "state.error.notFound": "This Pokémon’s data file was not found.",
  "state.error.invalidForm":
    "The form “{form}” could not be shown for this Pokémon. It may not exist.",
  "state.error.invalid": "The data for this Pokémon is invalid or incompatible.",
  "state.error.unknown": "An unexpected error occurred.",
  "state.retry": "Try again",
  "state.defaultForm": "Show the default form",

  "status.notIntroduced": "{name} had not been introduced yet in {game}.",
  "status.unknown": "The source does not establish whether {name} exists in {game}.",
  "status.alternative": "View it in {game}",

  "forms.heading": "Forms",
  "forms.label": "Form",
  "forms.status.available": "introduced",
  "forms.status.notIntroduced": "not introduced in this game",
  "forms.status.unknown": "introduction unknown",
  "forms.battleOnly": "battle only",
  "forms.mega": "Mega Evolution",

  "types.heading": "Types",

  "stats.heading": "Base stats",
  "stats.caption": "Base stats in {game}",
  "stats.stat": "Stat",
  "stats.base": "Base",
  "stats.effort": "Effort yield",
  "stats.total": "Total",
  "stats.special": "These games use a single Special stat.",

  "abilities.heading": "Abilities",
  "abilities.hidden": "Hidden ability",
  "abilities.gameText": "In-game description ({games})",
  "abilities.effect": "Effect",

  "scope.current": "Current data, not specific to the selected game.",

  "facts.heading": "Physical and species data",
  "facts.height": "Height",
  "facts.weight": "Weight",
  "facts.baseExperience": "Base experience",
  "facts.gender": "Gender ratio",
  "facts.genderless": "Genderless",
  "facts.genderSplit": "{female} female, {male} male",
  "facts.captureRate": "Capture rate",
  "facts.baseHappiness": "Base friendship",
  "facts.baby": "Baby Pokémon",
  "facts.legendary": "Legendary",
  "facts.mythical": "Mythical",
  "facts.source": "Other source fields",
  "facts.source.forms_switchable": "Forms switchable",
  "facts.source.growth_rate_id": "Growth rate (source ID)",
  "facts.source.has_gender_differences": "Has gender differences",
  "facts.source.hatch_counter": "Egg cycles",
  "facts.source.order": "Source sort order",
  "facts.source.pokemon_color_id": "Colour (source ID)",
  "facts.source.pokemon_habitat_id": "Habitat (source ID)",
  "facts.source.pokemon_shape_id": "Shape (source ID)",

  "value.yes": "Yes",
  "value.no": "No",
  "value.notRecorded": "Not recorded",
  "value.id": "#{id}",

  "dex.heading": "Pokédex entry",
  "dex.source": "From {game}",

  "fallback.english": "shown in English",
  "stat.special": "Special",
  "fallback.identifier": "untranslated identifier",

  "evolution.heading": "Evolution",
  "evolution.note":
    "Methods are shown as recorded by the source. Whether they apply in {game} is not verified.",
  "evolution.none": "This Pokémon has no recorded evolution family.",
  "evolution.missing": "The evolution data for this Pokémon is not in the dataset.",
  "evolution.current": "this page",
  "evolution.notIntroduced": "not introduced in {game}",
  "evolution.methods": "How it evolves",
  "evolution.recordedFor": "Recorded for {games}",
  "evolution.noGame": "No specific game recorded",
  "evolution.sourceDefault": "source default",
  "evolution.time.day": "day",
  "evolution.time.night": "night",
  "evolution.time.dusk": "dusk",
  "evolution.time.full-moon": "full moon",
  "evolution.gender.1": "female",
  "evolution.gender.2": "male",
  "evolution.physical.1": "Attack higher than Defense",
  "evolution.physical.0": "Attack equal to Defense",
  "evolution.physical.-1": "Attack lower than Defense",
  "evolution.percent": "{value}%",
  "evolution.form": "form #{id}",
  "condition.min_level": "Minimum level",
  "condition.evolved_pokemon_form_id": "Resulting form",
  "condition.required_pokemon_form_id": "Required form",
  "condition.time_of_day": "Time of day",
  "condition.min_happiness": "Minimum friendship",
  "condition.evolution_item_id": "Item used",
  "condition.region_id": "Region (source ID)",
  "condition.relative_physical_stats": "Attack and Defense",
  "condition.held_item_id": "Held item",
  "condition.known_move_id": "Knows move",
  "condition.party_species_id": "Pokémon in party",
  "condition.condition_expression": "Source condition expression",
  "condition.percentage_chance": "Chance",
  "condition.min_beauty": "Minimum beauty",
  "condition.gender_id": "Gender",
  "condition.location_id": "Location (source ID)",
  "condition.near_special_rock": "Near a special rock",
  "condition.trade_species_id": "Traded for",
  "condition.party_type_id": "Pokémon type in party",
  "condition.turn_upside_down": "Console held upside down",
  "condition.known_move_type_id": "Knows a move of type",
  "condition.min_affection": "Minimum affection",
  "condition.needs_overworld_rain": "Raining in the overworld",
  "condition.nature_bitmask": "Nature (source bitmask)",
  "condition.min_damage_taken": "Minimum damage taken",
  "condition.min_move_count": "Minimum move uses",
  "condition.used_move_id": "Move used",
  "condition.min_steps": "Minimum steps",
  "condition.needs_multiplayer": "Requires multiplayer",

  "moves.heading": "Moves",
  "moves.context": "Moves recorded for {games}.",
  "moves.level": "Level",
  "moves.move": "Move",
  "moves.mastery": "Mastery level",

  "coverage.heading": "Data coverage",
  "coverage.context":
    "Moves are matched to the exact version group and Pokédex text to the exact game.",
  "coverage.learnsets.present": "The source has move data for {games}.",
  "coverage.learnsets.missing":
    "The source has no move data for {games}. Missing moves do not mean this Pokémon cannot learn them.",
  "coverage.text.present": "The source has Pokédex text for {games}.",
  "coverage.text.missing": "The source has no Pokédex text for {games} in the supported languages.",
  "coverage.expansion": "Expansion: {games}",

  "reason.notIntroduced": "Not introduced in the selected game.",
  "reason.unknownIntroduction": "The source does not establish when this form was introduced.",
  "reason.noAbilitiesBeforeGen3": "Abilities did not exist before Generation III.",
  "reason.noAbilityFacts": "The source has no ability data for this Pokémon.",
  "reason.noTypeFacts": "The source has no type data for this game.",
  "reason.statsIncomplete": "The source lacks one or more stats in this generation’s stat layout.",
  "reason.noLearnset":
    "The source has no move data for this Pokémon in this game. This does not prove it cannot learn moves.",
  "reason.noText": "No text in this language or its fallback languages for this exact game.",
  "reason.availabilityUnknown":
    "Being introduced does not prove this Pokémon can be obtained in the selected game.",
  "reason.unknown": "This data is not available.",
} as const satisfies Record<string, string>;

type MessageKey = keyof typeof en;

const messages = {
  en,
  fr: {
    "meta.title": "{name} — #{number} — Pokémouille",
    "meta.description":
      "{name} (n° {number}), introduit en génération {generation}. Types, statistiques de base, talents, texte du Pokédex et capacités selon le jeu choisi.",
    "meta.descriptionGenus":
      "{name} (n° {number}, {genus}), introduit en génération {generation}. Types, statistiques de base, talents, texte du Pokédex et capacités selon le jeu choisi.",

    "identity.number": "N° du Pokédex National",
    "identity.numberValue": "N° {number}",
    "identity.genus": "Catégorie",
    "identity.introduced": "Apparition",
    "identity.generation": "Génération {number}",
    "identity.form": "Forme sélectionnée",
    "identity.artworkAlt": "Illustration de {name}",
    "identity.artworkNote": "Illustration indicative, non propre au jeu sélectionné.",
    "identity.artworkMissing": "Aucune illustration n’est disponible pour cette forme.",
    "identity.adjacent": "Pokémon voisins",
    "identity.previous": "Précédent : n° {number} {name}",
    "identity.next": "Suivant : n° {number} {name}",

    "context.game": "Jeu : {game}",
    "context.source.url": "choisi dans le lien",
    "context.source.preference": "votre jeu enregistré",
    "context.source.default": "jeu par défaut",
    "context.rejected":
      "Le jeu « {version} » indiqué dans ce lien n’est pas reconnu. Affichage de {game} à la place.",
    "context.rejectedLink": "Ouvrir un lien vers cette page pour {game}",
    "context.mechanics":
      "Les types, statistiques et talents suivent la génération du jeu sélectionné ; les différences de règles propres à chaque jeu ne sont pas vérifiées.",

    "state.loadingGames": "Chargement de la liste des jeux…",
    "state.loading": "Chargement des données pour {game}…",
    "state.errorHeading": "Impossible de charger ces données",
    "state.error.network":
      "Les données n’ont pas pu être téléchargées. Vérifiez votre connexion et réessayez.",
    "state.error.notFound": "Le fichier de données de ce Pokémon est introuvable.",
    "state.error.invalidForm":
      "La forme « {form} » ne peut pas être affichée pour ce Pokémon. Elle n’existe peut-être pas.",
    "state.error.invalid": "Les données de ce Pokémon sont invalides ou incompatibles.",
    "state.error.unknown": "Une erreur inattendue s’est produite.",
    "state.retry": "Réessayer",
    "state.defaultForm": "Afficher la forme par défaut",

    "status.notIntroduced": "{name} n’existait pas encore dans {game}.",
    "status.unknown": "La source ne permet pas d’établir si {name} existe dans {game}.",
    "status.alternative": "Voir dans {game}",

    "forms.heading": "Formes",
    "forms.label": "Forme",
    "forms.status.available": "introduite",
    "forms.status.notIntroduced": "pas encore introduite dans ce jeu",
    "forms.status.unknown": "introduction inconnue",
    "forms.battleOnly": "en combat uniquement",
    "forms.mega": "Méga-Évolution",

    "types.heading": "Types",

    "stats.heading": "Statistiques de base",
    "stats.caption": "Statistiques de base dans {game}",
    "stats.stat": "Statistique",
    "stats.base": "Base",
    "stats.effort": "Points d’effort donnés",
    "stats.total": "Total",
    "stats.special": "Ces jeux utilisent une seule statistique Spécial.",

    "abilities.heading": "Talents",
    "abilities.hidden": "Talent caché",
    "abilities.gameText": "Description en jeu ({games})",
    "abilities.effect": "Effet",

    "scope.current": "Données actuelles, non propres au jeu sélectionné.",

    "facts.heading": "Données physiques et d’espèce",
    "facts.height": "Taille",
    "facts.weight": "Poids",
    "facts.baseExperience": "Expérience de base",
    "facts.gender": "Répartition des sexes",
    "facts.genderless": "Asexué",
    "facts.genderSplit": "{female} femelle, {male} mâle",
    "facts.captureRate": "Taux de capture",
    "facts.baseHappiness": "Amitié de base",
    "facts.baby": "Pokémon bébé",
    "facts.legendary": "Légendaire",
    "facts.mythical": "Fabuleux",
    "facts.source": "Autres champs de la source",
    "facts.source.forms_switchable": "Formes interchangeables",
    "facts.source.growth_rate_id": "Courbe d’expérience (ID source)",
    "facts.source.has_gender_differences": "Différences entre les sexes",
    "facts.source.hatch_counter": "Cycles d’éclosion",
    "facts.source.order": "Ordre de tri de la source",
    "facts.source.pokemon_color_id": "Couleur (ID source)",
    "facts.source.pokemon_habitat_id": "Habitat (ID source)",
    "facts.source.pokemon_shape_id": "Silhouette (ID source)",

    "value.yes": "Oui",
    "value.no": "Non",
    "value.notRecorded": "Non renseigné",
    "value.id": "n° {id}",

    "dex.heading": "Entrée du Pokédex",
    "dex.source": "Issu de {game}",

    "fallback.english": "affiché en anglais",
    "stat.special": "Spécial",
    "fallback.identifier": "identifiant non traduit",

    "evolution.heading": "Évolution",
    "evolution.note":
      "Les méthodes sont affichées telles qu’enregistrées par la source. Leur validité dans {game} n’est pas vérifiée.",
    "evolution.none": "Ce Pokémon n’a pas de famille d’évolution enregistrée.",
    "evolution.missing":
      "Les données d’évolution de ce Pokémon ne figurent pas dans le jeu de données.",
    "evolution.current": "cette page",
    "evolution.notIntroduced": "pas encore introduit dans {game}",
    "evolution.methods": "Méthode d’évolution",
    "evolution.recordedFor": "Enregistrée pour {games}",
    "evolution.noGame": "Aucun jeu précis enregistré",
    "evolution.sourceDefault": "par défaut dans la source",
    "evolution.time.day": "jour",
    "evolution.time.night": "nuit",
    "evolution.time.dusk": "crépuscule",
    "evolution.time.full-moon": "pleine lune",
    "evolution.gender.1": "femelle",
    "evolution.gender.2": "mâle",
    "evolution.physical.1": "Attaque supérieure à la Défense",
    "evolution.physical.0": "Attaque égale à la Défense",
    "evolution.physical.-1": "Attaque inférieure à la Défense",
    "evolution.percent": "{value} %",
    "evolution.form": "forme n° {id}",
    "condition.min_level": "Niveau minimum",
    "condition.evolved_pokemon_form_id": "Forme obtenue",
    "condition.required_pokemon_form_id": "Forme requise",
    "condition.time_of_day": "Moment de la journée",
    "condition.min_happiness": "Amitié minimum",
    "condition.evolution_item_id": "Objet utilisé",
    "condition.region_id": "Région (ID source)",
    "condition.relative_physical_stats": "Attaque et Défense",
    "condition.held_item_id": "Objet tenu",
    "condition.known_move_id": "Connaît la capacité",
    "condition.party_species_id": "Pokémon dans l’équipe",
    "condition.condition_expression": "Expression de condition de la source",
    "condition.percentage_chance": "Probabilité",
    "condition.min_beauty": "Beauté minimum",
    "condition.gender_id": "Sexe",
    "condition.location_id": "Lieu (ID source)",
    "condition.near_special_rock": "Près d’une pierre spéciale",
    "condition.trade_species_id": "Échangé contre",
    "condition.party_type_id": "Type de Pokémon dans l’équipe",
    "condition.turn_upside_down": "Console tenue à l’envers",
    "condition.known_move_type_id": "Connaît une capacité de type",
    "condition.min_affection": "Affection minimum",
    "condition.needs_overworld_rain": "Pluie sur la carte",
    "condition.nature_bitmask": "Nature (masque de la source)",
    "condition.min_damage_taken": "Dégâts subis minimum",
    "condition.min_move_count": "Utilisations minimum de la capacité",
    "condition.used_move_id": "Capacité utilisée",
    "condition.min_steps": "Pas minimum",
    "condition.needs_multiplayer": "Multijoueur requis",

    "moves.heading": "Capacités",
    "moves.context": "Capacités enregistrées pour {games}.",
    "moves.level": "Niveau",
    "moves.move": "Capacité",
    "moves.mastery": "Niveau de maîtrise",

    "coverage.heading": "Couverture des données",
    "coverage.context":
      "Les capacités correspondent au groupe de versions exact et le texte du Pokédex au jeu exact.",
    "coverage.learnsets.present": "La source contient des données de capacités pour {games}.",
    "coverage.learnsets.missing":
      "La source ne contient aucune donnée de capacités pour {games}. Une capacité absente ne signifie pas que ce Pokémon ne peut pas l’apprendre.",
    "coverage.text.present": "La source contient des textes du Pokédex pour {games}.",
    "coverage.text.missing":
      "La source ne contient aucun texte du Pokédex pour {games} dans les langues prises en charge.",
    "coverage.expansion": "Extension : {games}",

    "reason.notIntroduced": "Pas encore introduit dans le jeu sélectionné.",
    "reason.unknownIntroduction":
      "La source ne permet pas d’établir quand cette forme a été introduite.",
    "reason.noAbilitiesBeforeGen3": "Les talents n’existaient pas avant la 3ᵉ génération.",
    "reason.noAbilityFacts": "La source ne contient aucun talent pour ce Pokémon.",
    "reason.noTypeFacts": "La source ne contient aucun type pour ce jeu.",
    "reason.statsIncomplete":
      "Il manque à la source une ou plusieurs statistiques du modèle de cette génération.",
    "reason.noLearnset":
      "La source ne contient aucune capacité pour ce Pokémon dans ce jeu. Cela ne prouve pas qu’il ne peut pas en apprendre.",
    "reason.noText": "Aucun texte dans cette langue ou ses langues de repli pour ce jeu précis.",
    "reason.availabilityUnknown":
      "Le fait qu’un Pokémon soit introduit ne prouve pas qu’il soit obtenable dans le jeu sélectionné.",
    "reason.unknown": "Cette donnée n’est pas disponible.",
  },
  ja: {
    "meta.title": "{name} — #{number} — Pokémouille",
    "meta.description":
      "{name}（No.{number}）。第{generation}世代で登場。選んだゲームに応じたタイプ・種族値・特性・図鑑説明・わざを確認できます。",
    "meta.descriptionGenus":
      "{name}（No.{number}・{genus}）。第{generation}世代で登場。選んだゲームに応じたタイプ・種族値・特性・図鑑説明・わざを確認できます。",

    "identity.number": "全国図鑑番号",
    "identity.numberValue": "No.{number}",
    "identity.genus": "分類",
    "identity.introduced": "初登場",
    "identity.generation": "第{number}世代",
    "identity.form": "選択中のすがた",
    "identity.artworkAlt": "{name}のイラスト",
    "identity.artworkNote": "イメージ用のイラストです。選択したゲーム固有のものではありません。",
    "identity.artworkMissing": "このすがたのイラストはありません。",
    "identity.adjacent": "前後のポケモン",
    "identity.previous": "前：No.{number} {name}",
    "identity.next": "次：No.{number} {name}",

    "context.game": "ゲーム：{game}",
    "context.source.url": "リンクで指定",
    "context.source.preference": "保存したゲーム",
    "context.source.default": "既定のゲーム",
    "context.rejected":
      "このリンクのゲーム「{version}」は認識できません。代わりに{game}を表示しています。",
    "context.rejectedLink": "{game}でこのページのリンクを開く",
    "context.mechanics":
      "タイプ・種族値・特性は選択したゲームの世代のデータです。ゲームごとのルールの違いは検証されていません。",

    "state.loadingGames": "ゲーム一覧を読み込み中…",
    "state.loading": "{game}のデータを読み込み中…",
    "state.errorHeading": "データを読み込めませんでした",
    "state.error.network":
      "データをダウンロードできませんでした。接続を確認して再試行してください。",
    "state.error.notFound": "このポケモンのデータファイルが見つかりません。",
    "state.error.invalidForm":
      "このポケモンのすがた「{form}」を表示できません。存在しない可能性があります。",
    "state.error.invalid": "このポケモンのデータが無効か、互換性がありません。",
    "state.error.unknown": "予期しないエラーが発生しました。",
    "state.retry": "再試行",
    "state.defaultForm": "通常のすがたを表示",

    "status.notIntroduced": "{game}の時点では、{name}はまだ登場していません。",
    "status.unknown": "{game}に{name}が存在するかどうか、データ元では確認できません。",
    "status.alternative": "{game}で表示",

    "forms.heading": "すがた",
    "forms.label": "すがた",
    "forms.status.available": "登場済み",
    "forms.status.notIntroduced": "このゲームでは未登場",
    "forms.status.unknown": "登場時期不明",
    "forms.battleOnly": "バトル中のみ",
    "forms.mega": "メガシンカ",

    "types.heading": "タイプ",

    "stats.heading": "種族値",
    "stats.caption": "{game}での種族値",
    "stats.stat": "能力",
    "stats.base": "種族値",
    "stats.effort": "得られる努力値",
    "stats.total": "合計",
    "stats.special": "これらのゲームでは「とくしゅ」がひとつの能力です。",

    "abilities.heading": "特性",
    "abilities.hidden": "隠れ特性",
    "abilities.gameText": "ゲーム内の説明（{games}）",
    "abilities.effect": "効果",

    "scope.current": "現在のデータです。選択したゲーム固有ではありません。",

    "facts.heading": "からだと種族のデータ",
    "facts.height": "高さ",
    "facts.weight": "重さ",
    "facts.baseExperience": "基礎経験値",
    "facts.gender": "性別の比率",
    "facts.genderless": "性別不明",
    "facts.genderSplit": "メス {female}・オス {male}",
    "facts.captureRate": "捕捉率",
    "facts.baseHappiness": "なつき度の初期値",
    "facts.baby": "ベイビィポケモン",
    "facts.legendary": "伝説のポケモン",
    "facts.mythical": "幻のポケモン",
    "facts.source": "その他のデータ元項目",
    "facts.source.forms_switchable": "すがたの切り替え",
    "facts.source.growth_rate_id": "経験値タイプ（データ元ID）",
    "facts.source.has_gender_differences": "オスとメスの違い",
    "facts.source.hatch_counter": "孵化サイクル",
    "facts.source.order": "データ元の並び順",
    "facts.source.pokemon_color_id": "色（データ元ID）",
    "facts.source.pokemon_habitat_id": "生息地（データ元ID）",
    "facts.source.pokemon_shape_id": "形（データ元ID）",

    "value.yes": "はい",
    "value.no": "いいえ",
    "value.notRecorded": "記録なし",
    "value.id": "ID {id}",

    "dex.heading": "図鑑の説明",
    "dex.source": "出典：{game}",

    "fallback.english": "英語で表示",
    "stat.special": "とくしゅ",
    "fallback.identifier": "未翻訳の識別子",

    "evolution.heading": "進化",
    "evolution.note":
      "進化方法はデータ元の記録どおりに表示しています。{game}で有効かどうかは検証されていません。",
    "evolution.none": "このポケモンには記録された進化系統がありません。",
    "evolution.missing": "このポケモンの進化データはデータセットに含まれていません。",
    "evolution.current": "このページ",
    "evolution.notIntroduced": "{game}では未登場",
    "evolution.methods": "進化方法",
    "evolution.recordedFor": "記録対象：{games}",
    "evolution.noGame": "特定のゲームの記録なし",
    "evolution.sourceDefault": "データ元の既定",
    "evolution.time.day": "昼",
    "evolution.time.night": "夜",
    "evolution.time.dusk": "夕方",
    "evolution.time.full-moon": "満月",
    "evolution.gender.1": "メス",
    "evolution.gender.2": "オス",
    "evolution.physical.1": "こうげきがぼうぎょより高い",
    "evolution.physical.0": "こうげきとぼうぎょが同じ",
    "evolution.physical.-1": "こうげきがぼうぎょより低い",
    "evolution.percent": "{value}%",
    "evolution.form": "すがた ID {id}",
    "condition.min_level": "最低レベル",
    "condition.evolved_pokemon_form_id": "進化後のすがた",
    "condition.required_pokemon_form_id": "必要なすがた",
    "condition.time_of_day": "時間帯",
    "condition.min_happiness": "最低なつき度",
    "condition.evolution_item_id": "使う道具",
    "condition.region_id": "地方（データ元ID）",
    "condition.relative_physical_stats": "こうげきとぼうぎょ",
    "condition.held_item_id": "持たせる道具",
    "condition.known_move_id": "覚えているわざ",
    "condition.party_species_id": "手持ちのポケモン",
    "condition.condition_expression": "データ元の条件式",
    "condition.percentage_chance": "確率",
    "condition.min_beauty": "最低うつくしさ",
    "condition.gender_id": "性別",
    "condition.location_id": "場所（データ元ID）",
    "condition.near_special_rock": "特別な岩の近く",
    "condition.trade_species_id": "交換相手",
    "condition.party_type_id": "手持ちのポケモンのタイプ",
    "condition.turn_upside_down": "本体を逆さまに持つ",
    "condition.known_move_type_id": "覚えているわざのタイプ",
    "condition.min_affection": "最低なかよし度",
    "condition.needs_overworld_rain": "フィールドで雨が降っている",
    "condition.nature_bitmask": "性格（データ元ビットマスク）",
    "condition.min_damage_taken": "受けたダメージの下限",
    "condition.min_move_count": "わざの最低使用回数",
    "condition.used_move_id": "使ったわざ",
    "condition.min_steps": "最低歩数",
    "condition.needs_multiplayer": "通信プレイが必要",

    "moves.heading": "わざ",
    "moves.context": "{games}で記録されているわざ。",
    "moves.level": "レベル",
    "moves.move": "わざ",
    "moves.mastery": "極めるレベル",

    "coverage.heading": "データの網羅状況",
    "coverage.context": "わざはバージョングループ単位、図鑑説明はゲーム単位で照合しています。",
    "coverage.learnsets.present": "データ元には{games}のわざデータがあります。",
    "coverage.learnsets.missing":
      "データ元には{games}のわざデータがありません。表示されないわざを覚えられないとは限りません。",
    "coverage.text.present": "データ元には{games}の図鑑説明があります。",
    "coverage.text.missing": "データ元には対応言語での{games}の図鑑説明がありません。",
    "coverage.expansion": "追加コンテンツ：{games}",

    "reason.notIntroduced": "選択したゲームではまだ登場していません。",
    "reason.unknownIntroduction": "このすがたの登場時期はデータ元では確認できません。",
    "reason.noAbilitiesBeforeGen3": "第3世代より前には特性は存在しませんでした。",
    "reason.noAbilityFacts": "データ元にはこのポケモンの特性データがありません。",
    "reason.noTypeFacts": "データ元にはこのゲームのタイプデータがありません。",
    "reason.statsIncomplete": "データ元には、この世代の能力構成に必要な能力値が一部ありません。",
    "reason.noLearnset":
      "データ元にはこのゲームでのこのポケモンのわざデータがありません。わざを覚えないという意味ではありません。",
    "reason.noText": "このゲームについて、この言語または代替言語の説明文がありません。",
    "reason.availabilityUnknown": "登場済みであっても、選択したゲームで入手できるとは限りません。",
    "reason.unknown": "このデータはありません。",
  },
} satisfies Record<Language, Record<MessageKey, string>>;

export const t = createTranslator<MessageKey>(messages);

/** `Field.reason` strings are fixed English text from resolvePokemon; map each to a UI message. */
const REASONS: Record<string, MessageKey> = {
  "Species or form was not introduced in the selected context": "reason.notIntroduced",
  "The source does not establish this form’s introduction": "reason.unknownIntroduction",
  "Abilities did not exist before Generation III": "reason.noAbilitiesBeforeGen3",
  "No ability facts for this Pokémon": "reason.noAbilityFacts",
  "No type facts for this context": "reason.noTypeFacts",
  "Source lacks one or more stats in the selected generation’s stat layout":
    "reason.statsIncomplete",
  "No learnset rows for this exact Pokémon and version group; this does not prove unavailability":
    "reason.noLearnset",
  "No text in the selected language or its fallback languages for this exact source context":
    "reason.noText",
  "Introduction and source-row existence do not establish obtainability in a particular game":
    "reason.availabilityUnknown",
};

export function reasonText(lang: Language, reason: string): string {
  return t(lang, REASONS[reason] ?? "reason.unknown");
}

/** Message key for a dynamic sub-key (source column, enum value); null when untranslated. */
export function messageKey(key: string): MessageKey | null {
  return key in en ? (key as MessageKey) : null;
}

/**
 * The single source of displayed game names. Japan-only releases share their localized names
 * with the international versions, so they get a qualifier to stay distinguishable.
 * Keeps `localize`'s fallback info so callers can mark English fallbacks with `lang="en"`.
 */
export function localizeVersion(lang: Language, version: Version): LocalizedText {
  const name = localize(version.names, lang, version.identifier);
  return version.identifier.endsWith("-japan")
    ? { ...name, text: uiT(lang, "game.japanVersion", { name: name.text }) }
    : name;
}

export function versionName(lang: Language, version: Version): string {
  return localizeVersion(lang, version).text;
}

/** Localized names of every version in a version group, e.g. "Diamond / Pearl". */
export function versionGroupName(
  lang: Language,
  versions: readonly Version[],
  versionGroupId: number,
): string {
  return versions
    .filter((version) => version.versionGroupId === versionGroupId)
    .map((version) => versionName(lang, version))
    .join(" / ");
}
