import { createTranslator } from "./core.ts";
import type { Language } from "./core.ts";

const en = {
  "list.title": "Locations",
  "list.metaTitle": "Locations | Pokémouille",
  "list.intro":
    "Places where the source records at least one Pokémon encounter in some game, grouped by the region the source assigns.",
  "list.scope":
    "Being listed does not mean a location has records for the selected game. Each location page shows only the records of the selected game.",
  "list.filters": "Filter locations",
  "list.query": "Location name",
  "list.placeholder": "e.g. Viridian Forest",
  "list.searchHint": "Search by the local name, English name or source identifier.",
  "list.reset": "Reset filter",
  "list.count": "{filtered} of {total} locations",
  "list.activeQuery": "Search: “{query}”",
  "list.empty": "No location matches this filter.",
  "list.emptyHint": "Try another location name, or reset the filter to show all locations.",
  "list.loading": "Loading the filter from the link…",
  "list.javascript": "Turn on JavaScript to filter locations or use a filter saved in a link.",
  "list.regionCount": "{count} locations",
  noRegion: "No region recorded",
  noRegionNote: "The source assigns no region to these locations.",
  "meta.title": "{name} | Location | Pokémouille",
  "meta.description": "{name}: Pokémon encounter records by game, area and method.",
  kind: "Location",
  back: "All locations",
  region: "Region",
  game: "Encounter records for {game}",
  loading: "Loading the selected game…",
  gamesFailed: "The game list could not be loaded, so records cannot be matched to a game.",
  retry: "Try again",
  noscript: "Turn on JavaScript to show this location’s encounter records for the selected game.",
  "state.location-empty":
    "The source has encounter records for {game}, but none at this location. This does not mean no Pokémon can be found here in that game.",
  "state.game-empty":
    "The source contains no encounter records for any location in {game}. Encounters for this game are missing from these data.",
  "state.coverage-unknown":
    "Global encounter-data coverage for {game} is not recorded. We cannot establish whether the source covers this game.",
  otherGames: "Games with records at this location:",
  pokemon: "Pokémon",
  table: "{area} — {method}",
  formsNote:
    "Records belong to Pokémon varieties. Cosmetic forms of a variety share its records, so a listed Pokémon does not confirm any particular cosmetic form.",
  limits:
    "This is not a complete list of what can be obtained here: gifts, trades, events and other methods may be absent. Missing records do not mean a Pokémon cannot be found here or is unobtainable in this game.",
};
const fr = {
  "list.title": "Lieux",
  "list.metaTitle": "Lieux | Pokémouille",
  "list.intro":
    "Lieux où la source enregistre au moins une rencontre de Pokémon dans un jeu, regroupés selon la région attribuée par la source.",
  "list.scope":
    "Figurer dans cette liste ne veut pas dire qu’un lieu a des données pour le jeu sélectionné. Chaque page de lieu n’affiche que les données du jeu sélectionné.",
  "list.filters": "Filtrer les lieux",
  "list.query": "Nom du lieu",
  "list.placeholder": "Ex. Forêt de Jade",
  "list.searchHint": "Recherchez le nom local, le nom anglais ou l’identifiant de la source.",
  "list.reset": "Réinitialiser le filtre",
  "list.count": "{filtered} lieux sur {total}",
  "list.activeQuery": "Recherche : « {query} »",
  "list.empty": "Aucun lieu ne correspond à ce filtre.",
  "list.emptyHint":
    "Essayez un autre nom de lieu ou réinitialisez le filtre pour afficher tous les lieux.",
  "list.loading": "Chargement du filtre du lien…",
  "list.javascript":
    "Activez JavaScript pour filtrer les lieux ou utiliser un filtre enregistré dans un lien.",
  "list.regionCount": "{count} lieux",
  noRegion: "Aucune région enregistrée",
  noRegionNote: "La source n’attribue aucune région à ces lieux.",
  "meta.title": "{name} | Lieu | Pokémouille",
  "meta.description": "{name} : rencontres de Pokémon enregistrées par jeu, zone et méthode.",
  kind: "Lieu",
  back: "Tous les lieux",
  region: "Région",
  game: "Rencontres enregistrées pour {game}",
  loading: "Chargement du jeu sélectionné…",
  gamesFailed:
    "La liste des jeux n’a pas pu être chargée : impossible d’associer les données à un jeu.",
  retry: "Réessayer",
  noscript: "Activez JavaScript pour afficher les rencontres de ce lieu pour le jeu sélectionné.",
  "state.location-empty":
    "La source contient des rencontres pour {game}, mais aucune dans ce lieu. Cela ne veut pas dire qu’aucun Pokémon ne s’y trouve dans ce jeu.",
  "state.game-empty":
    "La source ne contient aucune rencontre, dans aucun lieu, pour {game}. Les rencontres de ce jeu sont absentes de ces données.",
  "state.coverage-unknown":
    "La couverture globale des rencontres pour {game} n’est pas enregistrée. Impossible de savoir si la source couvre ce jeu.",
  otherGames: "Jeux avec des rencontres dans ce lieu :",
  pokemon: "Pokémon",
  table: "{area} — {method}",
  formsNote:
    "Les données concernent des variétés de Pokémon. Les formes cosmétiques d’une variété partagent ses données : un Pokémon listé ne confirme aucune forme cosmétique en particulier.",
  limits:
    "Ce n’est pas une liste complète de ce qu’on peut obtenir ici : les cadeaux, échanges, événements et d’autres méthodes peuvent manquer. L’absence de données ne signifie pas qu’un Pokémon est introuvable ici ou impossible à obtenir dans ce jeu.",
} satisfies Record<keyof typeof en, string>;
const ja = {
  "list.title": "場所",
  "list.metaTitle": "場所 | Pokémouille",
  "list.intro":
    "いずれかのゲームでポケモンの出現記録がデータに1件以上ある場所です。データが割り当てた地方ごとにまとめています。",
  "list.scope":
    "一覧にあっても、選択したゲームの記録があるとは限りません。各場所のページには選択したゲームの記録だけを表示します。",
  "list.filters": "場所を絞り込む",
  "list.query": "場所の名前",
  "list.placeholder": "例：トキワのもり",
  "list.searchHint": "現地名・英語名・データの識別名で検索できます。",
  "list.reset": "絞り込みをリセット",
  "list.count": "全{total}か所中{filtered}か所",
  "list.activeQuery": "検索：「{query}」",
  "list.empty": "条件に一致する場所はありません。",
  "list.emptyHint":
    "別の場所の名前で検索するか、絞り込みをリセットしてすべての場所を表示してください。",
  "list.loading": "リンクの絞り込み条件を読み込み中…",
  "list.javascript":
    "場所の絞り込みや、リンクに保存された条件の利用にはJavaScriptを有効にしてください。",
  "list.regionCount": "{count}か所",
  noRegion: "地方の記録なし",
  noRegionNote: "データではこれらの場所に地方が割り当てられていません。",
  "meta.title": "{name} | 場所 | Pokémouille",
  "meta.description": "{name}：ゲーム・エリア・方法ごとのポケモン出現記録。",
  kind: "場所",
  back: "すべての場所",
  region: "地方",
  game: "{game}の出現記録",
  loading: "選択したゲームを読み込み中…",
  gamesFailed: "ゲーム一覧を読み込めなかったため、記録をゲームに対応付けられません。",
  retry: "再試行",
  noscript: "選択したゲームでのこの場所の出現記録を表示するには、JavaScriptを有効にしてください。",
  "state.location-empty":
    "データには{game}の出現記録がありますが、この場所の記録はありません。そのゲームでここにポケモンが出ないという意味ではありません。",
  "state.game-empty":
    "データには{game}の出現記録がどの場所にもありません。このゲームの出現情報はデータに含まれていません。",
  "state.coverage-unknown":
    "{game}の出現データの収録状況は記録されていません。データがこのゲームを扱っているかは確認できません。",
  otherGames: "この場所に記録があるゲーム：",
  pokemon: "ポケモン",
  table: "{area} — {method}",
  formsNote:
    "記録はポケモンの種類（バリエーション）単位です。見た目だけが違うすがたは記録を共有するため、特定のすがたが出現するとは限りません。",
  limits:
    "ここで入手できるものの完全な一覧ではありません。もらえるポケモン、交換、イベントなどの方法が含まれていない場合があります。記録がなくても、ここで出現しない、またはこのゲームで入手できないという意味ではありません。",
} satisfies Record<keyof typeof en, string>;

export const t = createTranslator({ en, fr, ja } satisfies Record<
  Language,
  Record<keyof typeof en, string>
>);
