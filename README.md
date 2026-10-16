# Pokémouille

A multilingual, game-aware Pokédex built with Vite+ and SvelteKit. The data pipeline, localized Pokémon detail pages, and instant global search (Ctrl/Cmd+K) are implemented and release-verified locally (see POKEDEX_PLAN.md §13). See [POKEDEX_PLAN.md](POKEDEX_PLAN.md) for product decisions and audit evidence.

## Setup and verification

Use Node 24+ and the repository's Vite+/pnpm versions.

```sh
vp install
vp check
vp test
vp run -r build
```

The workspace uses copied/hoisted dependencies and disables automatic workspace-package hoisting to avoid untrusted Windows directory junction traversal. TypeScript 6 is shared through the catalog. On a restricted Windows process where the global `current` junction is blocked, invoke the installed versioned `vp.exe` directly and put its bin directory and the installed Node runtime directory on the process PATH. This does not require changing Windows security settings.

## Website

`apps/website` is a SvelteKit 3 static site (`adapter-static`, config in `apps/website/vite.config.ts`). It reads the published snapshot from `apps/website/static/data`, so publish a dataset first (`vp run data:publish` reuses cached responses without requests).

```sh
vp run dev               # development server
vp run website#build     # svelte-check + prerender to apps/website/build
cd apps/website && vp preview
```

Development ignores the adapter's generated `apps/website/build/` tree when installing file watchers. A full static export contains thousands of page directories; watching that old output caused multi-minute Windows startup stalls even after Vite reported “ready.” Keep this exclusion if the dev-server configuration changes, and update it if the adapter output directory is renamed. Source files and `static/data/` remain watched; no build deletion or dataset refresh is required.

Routes: `/` (language choice; redirects with JavaScript), `/{lang}/` (National Pokédex list), `/{lang}/pokemon/{speciesId}/?version=<game>&form=<form>`. All 3 × 1,025 species pages are prerendered with game-independent identity only; game/form panels resolve in the browser (game precedence: URL → saved preference → Scarlet). The site header provides global search (Ctrl/Cmd+K, or start typing) across Pokémon/forms, moves, abilities, and items. Ranking is local in `apps/website/src/lib/search/rank.ts`, combining the per-language Pokémon index with resource names from the published references, so typing never fetches. Results have localized resource labels and preserve the selected game when navigating. Search accepts names, English/canonical aliases, and numeric IDs (National Pokédex numbers for Pokémon); shared IDs return multiple labeled categories. Only Pokémon results carry game-introduction status: move/ability/item detail data remains current, not historical or proof of game availability. Interactive controls (`Dialog`, `Command`, `Select`, `Tabs`, `Collapsible`, `Meter`, `Button`, `Label`) use headless Bits UI with minimal layout and functional `data-*` CSS until a visual theme is chosen.

The National Pokédex list uses compact, decorative 40 × 30px box-style icons for all 1,025 species. `PokemonIcon.svelte` reads National Dex slots from one locally served [Pokémon Showdown sprite sheet](https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png?v22), so the list adds one image request rather than one per Pokémon and works without JavaScript. The vendored `static/pokemon-icons.png` has SHA-256 `81c713b8f4d94f7f577c546974e3d562d90b38c98b38b1b63b2a953b9acfca2a`; its layout is 12 columns of 40 × 30px cells. These are illustrative base-species icons, not selected-game or form-specific sprites. Pokémon imagery belongs to Nintendo / Creatures Inc. / GAME FREAK; sprite contributors and minisprite resizing are credited by [Pokémon Showdown](https://pokemonshowdown.com/credits) (including leparagon, the Smogon sprite projects, and Kalalokki). No dataset refresh is required.

Homepage filters combine localized name/National Dex number, current default-variety type, and species introduction generation. Their `q`, `type`, and `generation` query parameters support shared links, refresh, reset, and Back/Forward; filtering is local with no per-keystroke requests. SvelteKit 3 shallow navigation exposes its current URL through `page.shallow.url`, so controls and results derive from that URL before falling back to `page.url`. Filters require JavaScript; without it the full unfiltered species list remains available. Types are explicitly current, not historical selected-game typing. Pokémon result links preserve the selected game and clear unrelated form selections.

Pokémon detail pages also include a localized sprite gallery using the resolved variety's existing `media.sprites`: pixel sprites, opt-in animated sprites, and Pokémon HOME renders, with front/back, shiny, and female variants wherever the source supplies them. Tabs mount only the active source's images; images load lazily, unavailable views are omitted, and failed downloads show an explicit error. Changing Pokémon or form replaces the gallery with the newly resolved media; it never synthesizes sprite URLs or falls back to another variety. These source images are illustrative, not historical sprites for the selected game. Detail images remain hosted by PokéAPI's sprite repository; the homepage icon sheet is local.

Evolution chains render as full-width branching cards with species icons, National Dex numbers, current-node markers, and game-preserving links. Branches stay in a single-column tree so connectors follow the actual ancestry: each child owns its connector, and the rail stops at the final child's heading rather than trailing below its card. Each method keeps its localized conditions, trigger, source version group, and default-row provenance; requirements combine with AND and alternative source methods with OR. Later-introduced species remain visible with a badge. Source evolution applicability remains unresolved: a method's version group records introduction, and a default row describes the latest main-generation expectation—not a verified method for every selected game.

Move details live at `/{lang}/move/{moveId}/` and ability details at `/{lang}/ability/{abilityId}/`. Both are statically prerendered for English, French, and Japanese, and linked from Pokémon learnsets and ability sections. Links preserve an explicit `?version=` selection; language switching keeps the detail route and game context.

Move pages show type, damage category, generation, power, accuracy, PP, priority, effect chance, effects, and in-game descriptions by version group. Ability pages show current effects and descriptions by version group. Current move stats and effects are **not historical game-specific mechanics**, and a description does not prove availability in that game. Null move values remain explicitly “not applicable or variable”; missing descriptions/effects are shown as unavailable. Localization uses the same marked fallback as Pokémon pages (Japanese → kana Japanese → English; French → English). The source does not provide Japanese effect translations.

Item details live at `/{lang}/item/{itemId}/`, prerendered for all 2,223 items in English, French, and Japanese. Pages show current short/full effects and descriptions grouped by their exact source version group; absent translations use marked fallbacks, and missing source text remains explicitly unavailable. These records do not establish historical mechanics or game availability. Item prices are not presented as a single global cost: upstream prices vary by game and currency.

`ItemLink.svelte` combines the localized name, a decorative 30 × 30px icon, and a game-preserving item link without unrelated form parameters. Evolution item/held-item requirements use it; global search also includes items with icons. Structured item references are linked by source ID, not guessed from arbitrary localized effect prose. Icons are served locally from `static/item-icons/`, vendored from [PokeAPI/sprites commit `6e7928dcbd547d50b5c644fe76e093e8da98ac3f`](https://github.com/PokeAPI/sprites/tree/6e7928dcbd547d50b5c644fe76e093e8da98ac3f/sprites/items). There are 863 exact identifier matches in the current item dataset; 1,360 items without matching sprites use a neutral placeholder, never another item's image or a missing-asset request. The upstream CC0 notice is retained in `static/item-icons/LICENCE.txt`; image contents remain copyright The Pokémon Company, as the notice states.

Moves show a TM disc colored by the move's current source type (`MoveIcon.svelte`, reusing the vendored `tm-<type>.png` sprites) on move pages, learnsets, evolution move conditions, and search. The disc only illustrates type; it does not imply the move is available as a TM. Abilities have no per-ability icons in the games, so `AbilityIcon.svelte` uses the Ability Capsule sprite as a category marker on ability pages, Pokémon ability lists, and search. Search results also show Pokémon box icons and item icons, and the result list scrolls inside a viewport-bounded dialog.

Move catalogue category labels include locally served 32 × 14px Physical, Special, and Status symbols (`DamageClassIcon.svelte`). These unchanged game-style assets come from [Pokémon Showdown's category sprites](https://play.pokemonshowdown.com/sprites/categories/); localized text remains alongside the decorative icons, and native filter options remain text. The upstream asset directory does not supply an explicit asset license; Pokémon artwork rights remain with their respective owners.

Move pages list Pokémon varieties with learnsets in the selected game's **exact version group**, including recorded methods and levels. Ability pages list generation-resolved ordinary and hidden assignments, preserving per-slot historical upper bounds and explicit nulls; hidden abilities are excluded before Generation V, and all abilities before Generation III. These lists preserve selected game/form links and exclude forms introduced later according to release order rather than numeric group IDs. Unknown form-introduction chronology is reported as a source gap, not unavailability. Assignments do not prove obtainability or special-game battle mechanics.

`apps/website/src/lib/server/catalogue.ts` derives catalogue and reverse-relationship indexes from the existing published snapshot, with four concurrent species reads, shared compact identities, and a revision-aware in-flight cache. Full species records are discarded after projection; browsers receive only catalogue metadata or the requested resource's relationships, never a 1,025-detail-file fetch. These features require no dataset schema change, refresh, or upstream API requests.

Resource catalogues live at `/{lang}/move/`, `/{lang}/ability/`, and `/{lang}/item/`, with persistent header navigation. All support local localized/English/canonical-name search through `?q=`; moves also support current `?type=<typeId>&category=<damageClassId>` filters (1 status, 2 physical, 3 special). Filters combine, support reset and Back/Forward, and survive language/game changes. Detail links keep the selected game but omit catalogue filters and unrelated forms. Catalogues contain current source records, not verified selected-game availability; without JavaScript the complete unfiltered lists remain available. Only compact metadata is projected from the existing snapshot.

Types use the reusable linked `TypeBadge.svelte` component with local [partywhale/pokemon-type-icons](https://github.com/partywhale/pokemon-type-icons) SVGs (MIT © James Watkins; license retained in `static/type-icons/LICENSE`). On Pokémon pages, clicking either type badge opens the Pokémon's full resolved type combination with `?type=<typeId>&type2=<typeId>` (or just `type` for a single-type Pokémon). Elsewhere, individual badges open `/{lang}/types/?type=<typeId>`. Links preserve the selected game through `version`. The types page has URL-backed selectors and shows combined **defensive** weaknesses, resistances, and immunities with incoming-damage multipliers. Both defending types are multiplied, including ×4, ×¼, immunity overrides, and neutral cancellation; neutral results are omitted. The chart follows the selected game's generation, and types not introduced then produce an explicit unavailable state. Invalid/nonstandard type selections do not receive an invented chart. Abilities, items, moves, battle effects, and special game rules are excluded explicitly. Query-dependent charts require JavaScript.

The compact chart in `apps/website/src/lib/data/type-matchups.ts` is based on PokéAPI's [current](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/type_efficacy.csv) and [historical](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/type_efficacy_past.csv) efficacy tables, including Generation I differences and Steel's pre-Generation VI resistances. Dark/Steel start in Generation II and Fairy in Generation VI. Nonstandard types have no invented matchup chart. No dataset refresh or runtime API request is needed.

Type selectors disable choices that did not exist in the selected game's generation, using the same introduction rule as the matchup engine. A deep link selecting an unavailable type keeps that selection visible with the explicit unavailable state, so it can be corrected without silently changing the URL.

The types page also lists matching Pokémon and alternate varieties, with cosmetic forms of identical typing grouped into one entry per variety. One selected type includes both mono- and dual-type Pokémon containing it; two types require the exact pair in either order. Compact variety identities and historical type rows are projected during the existing bounded server snapshot pass; the browser filters this metadata locally, without fetching individual Pokémon records. Membership shares historical type selection with the detail resolver and respects species/form introduction chronology. Unknown chronology or missing type facts are reported explicitly. Introduction does not establish obtainability or special-game mechanics. Links preserve game and form; decorative icons illustrate the base species rather than the form.

Existing datasets generated before move or item details must be refreshed with the updated queries before starting the website. Item references now require `effects` and `flavorTexts` arrays. For an old completed refresh, use the documented `refresh --fresh` command once, preserving the rate ledger, then resume without `--fresh` as needed.

## Generate the real dataset

Run from the repository root:

```sh
vp run data:refresh
vp run data:status
```

These tasks deliberately disable Vite Task caching: the pipeline owns its durable response cache and rate ledger. They use `.data/state` for state and `apps/website/static/data` for static output. Both are ignored generated files. Normal website builds never call PokéAPI.

The first refresh collects the complete dataset, validates all bounded collections/census relationships, and publishes only after successful validation. Current extraction uses 25-species pages, including per-variety learnsets. Changing upstream counts can increase request requirements.

### Resume, limits, and new refreshes

Use the CLI directly for options; do not pass an extra literal `--` to its argument parser:

```sh
node tools/data/src/cli.ts refresh --state-dir .data/state --out-dir apps/website/static/data --max-requests 3
```

Exit **0** means success, **2** means resumable/incomplete, and **1** means failure. After an incomplete run, repeat the same command without `--fresh`. Completed successful pages are reused. `status` reports cooldown and the next budget time. There is no automatic retry loop or waiting process.

The durable cap is **60 attempts per rolling hour**, including failed requests. HTTP 429/Retry-After persists a cooldown. All callers on the same public IP share PokéAPI's allowance; different state directories do not create independent upstream quotas. Use one shared state directory for all jobs targeting that endpoint. Do not delete the rate ledger to evade throttling.

Start a weekly or manually requested update with:

```sh
node tools/data/src/cli.ts refresh --state-dir .data/state --out-dir apps/website/static/data --fresh
```

Use `--fresh` **once** to start the new refresh; subsequent resumptions omit it. It deliberately discards reuse of previous-run responses, not the last-good published snapshot or rate ledger. Do not start a new refresh every website deployment. A CI scheduler is not configured until the provider is chosen. Persist state between CI runners, including successful responses, active-run metadata, and rate/cooldown timestamps.

To validate and republish cached complete input without network access:

```sh
vp run data:publish
```

Missing cached pages exit incomplete; invalid or truncated data never replaces a working manifest. A writer lock with stale-lock recovery prevents concurrent updates to the same state/output directories. Use the same output directory for one deployment channel.

## Published files

`manifest.json` points to immutable content-versioned assets under `revisions/{datasetRevision}/`:

- `references.json`: game mappings, localized labels, complete move detail records, ability/item effects and descriptions, source counts, and coverage.
- `pokemon/{speciesId}.json`: one complete locale-independent species/variety bundle.
- `search/{en,fr,ja}.json`: compact names, aliases, and stable species/variety/form identities.
- `evolution/{chainId}.json`: chain membership and incoming source methods, with unresolved game applicability explicitly preserved.

Every manifest entry includes a relative path, SHA-256, and byte count. Publish assets first and atomically switch the manifest only after validation. Keep previous revisions available for active visitors; a failed refresh leaves the last-good manifest unchanged. Do not garbage-collect older revisions without an explicit retention policy.

For hosting, revalidate the root manifest, all prerendered HTML, and `_app/version.json` (`Cache-Control: no-cache` plus an `ETag` or `Last-Modified` validator). Serve `data/revisions/*` and `_app/immutable/*` with `Cache-Control: public, max-age=31536000, immutable`, and keep the previous deploy's `_app/immutable/*` files, as with data revisions, so open tabs keep working after a redeploy. With these headers, a repeat visit costs 304s for the manifest and HTML plus only the species files not yet seen. `vp preview` sends neither header, so it cannot demonstrate repeat-visit caching. The browser pins one manifest revision per page session. No host/CDN is chosen yet, so these headers are not configured anywhere.

## GraphQL types and schema updates

Queries live in `tools/data/graphql/*.graphql`. Operation types are genuinely generated from the saved upstream schema, not hand-written source types. Refresh that schema only when needed; this consumes the same durable request budget:

```sh
vp run data:schema
vp run data:codegen
```

Schema acquisition writes an ignored local `schema.json` and updates committed `schema-revision.json`; generated operation types are also committed. Ordinary ingestion/publication need only the committed metadata/types, not the local introspection file. Query documents are normalized with GraphQL parsing/printing and schema identity ignores JSON whitespace, so formatting does not discard usable cached responses. Actual schema/query changes invalidate existing refresh compatibility: finish the current run first, or deliberately start `--fresh` while retaining the request ledger.

## Data semantics

`packages/pokemon-data` exports `resolvePokemon`, `validateSnapshot`, `buildSearchIndex`, and `getMainSeriesGames` with normalized JSON types. The module has no network, filesystem, or UI dependency. Treat loaded reference/detail objects as immutable; reference and learnset indexes are reused by object identity.

```ts
import { resolvePokemon } from "./packages/pokemon-data/src/index.ts";

const result = resolvePokemon(speciesRecord, references, {
  language: "fr",
  version: "platinum",
  form: "rotom-wash",
});
```

Supply objects loaded from the manifest's detail/reference files. Unsupported language, unknown game, or unrelated form identifiers are errors. `status: available` means introduced, **not** proven obtainable. Missing rows, unintroduced entities, unresolved evolution applicability, and unknown game-specific mechanics are distinct states. Physical/species scalars and detailed ability prose are labeled current/non-game-specific where no historical source exists.

Game-specific text falls back in language, never to another game. Japanese tries standard Japanese, then kana Japanese, then English. Evolution defaults do not establish historical applicability. DLC metadata attaches to base games without pretending empty expansion datasets are complete; side titles are not automatically selectable.
