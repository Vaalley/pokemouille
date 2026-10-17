# Pokémouille

A multilingual, game-aware Pokédex built with Vite+ and SvelteKit, live at <https://pokemouille.vaaleyou.workers.dev>. The data pipeline, localized Pokémon, move, ability and item pages, and instant global search (Ctrl/Cmd+K) are implemented.

**Architecture:** [text guide](docs/architecture.md) · [SVG](docs/architecture.svg) · [PNG](docs/architecture.png). Start here when changing data ingestion, prerendering, browser-side resolution, or Cloudflare delivery.

## Product rules

- **Scope:** all main-series games (remakes, Let's Go, Legends), selector grouped by generation, default **Scarlet**. Languages **en, fr, ja**, interface included. No accounts, favorites, team building or collection tracking.
- **Data source:** public PokéAPI GraphQL `v1beta2`, ingested in bounded, resumable weekly/manual refreshes. No Docker or database operations; CSV/REST sources only with explicit agreement.
- **Historical correctness:** never let modern types, stats, abilities, learnsets or effects leak into older games. Resolve each field by its real generation / version group / version semantics, never from numeric ID order. Unsupported facts are shown as unknown or omitted with an explanation, never guessed (no guessed inheritance, availability or modern-data substitutes).
- **Missing states stay distinct:** not introduced yet, unavailable in this game, missing source data, missing translation.
- **Text fallback:** requested language → English → identifier (Japanese: `ja` → `ja-hrkt` → English). Never substitute another game's text to get a translation.
- **URLs carry meaning:** language, game and form live in the URL; navigation and search results preserve them; explicit localized links are never redirected to the visitor's language.
- **Static delivery:** visitors never call PokéAPI. Game/form panels resolve in the browser (no default-game mechanics in prerendered HTML) and need JavaScript.

## Open items

- Visual direction and layout (current CSS is minimal layout only).
- Game-specific evolution applicability and special game-mechanics rules: need sufficient source evidence before display.
- Native-speaker review of the fr/ja "not introduced" wording.
- Validate `@sveltejs/kit@3.1.0` before removing it from `minimumReleaseAgeExclude`.

## Setup and verification

Use the repository's pinned toolchain: Node 26 (`.node-version`; `vp` downloads it) and the Vite+/pnpm versions.

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
vp run cf:dev            # production-like Workers preview with real cache headers (see Deployment)
```

Development ignores the adapter's generated `apps/website/build/` tree when installing file watchers. A full static export contains thousands of page directories; watching that old output caused multi-minute Windows startup stalls even after Vite reported “ready.” Keep this exclusion if the dev-server configuration changes, and update it if the adapter output directory is renamed. Source files and `static/data/` remain watched; no build deletion or dataset refresh is required.

Routes: `/` (language choice; redirects with JavaScript), `/{lang}/` (National Pokédex list), `/{lang}/pokemon/{speciesId}/?version=<game>&form=<form>`. All 3 × 1,025 species pages are prerendered with game-independent identity only; game/form panels resolve in the browser (game precedence: URL → saved preference → Scarlet). The site header provides global search (Ctrl/Cmd+K, or start typing) across Pokémon/forms, moves, abilities, and items. Ranking is local in `apps/website/src/lib/search/rank.ts`, combining the per-language Pokémon index with resource names from the published references, so typing never fetches. Results have localized resource labels and preserve the selected game when navigating. Search accepts names, English/canonical aliases, and numeric IDs (National Pokédex numbers for Pokémon); shared IDs return multiple labeled categories. Only Pokémon results carry game-introduction status: move/ability/item detail data remains current, not historical or proof of game availability. Interactive controls (`Dialog`, `Command`, `Select`, `Tabs`, `Collapsible`, `Meter`, `Button`, `Label`) use headless Bits UI with minimal layout and functional `data-*` CSS until a visual theme is chosen.

Layout is theme-free and shared through `apps/website/src/app.css`: `.page-header` (kind/number, name, one context line), `.properties` (label/value fact sheets), `.figures` (short labelled numbers), `.definitions` (stacked long text), `.filters`/`.filter-field` (Pokédex, catalogue and type filters), `.note` (smaller scope and caveat text) and `.result-count`. Pokémon pages open with previous/next links, the identity summary (game context and form picker) beside the artwork, an on-page section index, then a two-column overview (types, stats and physical data; abilities and Pokédex text) followed by full-width evolution, sprites, moves and data coverage.

Pokémon pages start species data, compact detail references, and games in parallel after mount; game/form resolution still waits for URL → saved preference → Scarlet context. Evolution starts as soon as the species record arrives, independently of references and games. The overview does not wait for the chain: evolution has its own localized loading/error state and retry button, and late results from a previous species are ignored. Global search lazily loads compact resource metadata rather than full reference prose; the type-matchup page receives its small type-name list in prerendered page data and downloads only games.

The header's search trigger and keyboard shortcuts are lightweight. `SearchDialogContent.svelte`, result renderers, and search-only icon mappings load on the first opening, with draft input preserved while the module arrives; closing/reopening reuses the loaded component and prepared index. Data failures retry in place. A failed JavaScript module download offers a localized page-reload action because the browser caches failed imports. Pages that otherwise need item icons still load their mapping normally.

The National Pokédex list uses compact, decorative 40 × 30px box-style icons for all 1,025 species. `PokemonIcon.svelte` reads National Dex slots from one locally served [Pokémon Showdown sprite sheet](https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png?v22), so the list adds one image request rather than one per Pokémon and works without JavaScript. The vendored `static/pokemon-icons.png` has SHA-256 `81c713b8f4d94f7f577c546974e3d562d90b38c98b38b1b63b2a953b9acfca2a`; its layout is 12 columns of 40 × 30px cells. These are illustrative base-species icons, not selected-game or form-specific sprites. Pokémon imagery belongs to Nintendo / Creatures Inc. / GAME FREAK; sprite contributors and minisprite resizing are credited by [Pokémon Showdown](https://pokemonshowdown.com/credits) (including leparagon, the Smogon sprite projects, and Kalalokki). No dataset refresh is required.

Homepage filters combine localized name/National Dex number, current default-variety type, and species introduction generation. Their `q`, `type`, and `generation` query parameters support shared links, refresh, reset, and Back/Forward; filtering is local with no per-keystroke requests. SvelteKit 3 shallow navigation exposes its current URL through `page.shallow.url`, so controls and results derive from that URL before falling back to `page.url`. Filters require JavaScript; without it every species remains reachable through unfiltered static pages. Types are explicitly current, not historical selected-game typing. Pokémon result links preserve the selected game and clear unrelated form selections.

Pokémon detail pages also include a localized sprite gallery using the resolved variety's existing `media.sprites`: pixel sprites, opt-in animated sprites, and Pokémon HOME renders, with front/back, shiny, and female variants wherever the source supplies them. Tabs mount only the active source's images; images load lazily, unavailable views are omitted, and failed downloads show an explicit error. Changing Pokémon or form replaces the gallery with the newly resolved media; it never synthesizes sprite URLs or falls back to another variety. These source images are illustrative, not historical sprites for the selected game. Detail images remain hosted by PokéAPI's sprite repository; the homepage icon sheet is local.

Evolution chains render as full-width branching cards with species icons, National Dex numbers, current-node markers, and game-preserving links. Branches stay in a single-column tree so connectors follow the actual ancestry: each child owns its connector, and the rail stops at the final child's heading rather than trailing below its card. Each method keeps its localized conditions, trigger, source version group, and default-row provenance; requirements combine with AND and alternative source methods with OR. Later-introduced species remain visible with a badge. Source evolution applicability remains unresolved: a method's version group records introduction, and a default row describes the latest main-generation expectation—not a verified method for every selected game.

A method whose resulting form belongs to a non-default variety gets its own card beside the species card, linking to that form; cosmetic results stay on the species card. A regional base form that no method produces still gets a card beside its species card when a later stage requires it, so Alolan Vulpix → Alolan Ninetales and Galarian Meowth → Perrserker branch apart from Vulpix → Ninetales and Meowth → Persian. A stage whose methods all require one such variety hangs under its card (Galarian Mr. Mime → Mr. Rime), otherwise under the species card. Required/resulting form conditions show localized form names. `apps/website/src/lib/server/evolution-forms.ts` projects these form identities from the chain's species records at prerender time, so the dataset schema is unchanged; `apps/website/src/lib/data/evolution-tree.ts` builds the display tree.

Move details live at `/{lang}/move/{moveId}/` and ability details at `/{lang}/ability/{abilityId}/`. Both are statically prerendered for English, French, and Japanese, and linked from Pokémon learnsets and ability sections. Links preserve an explicit `?version=` selection; language switching keeps the detail route and game context.

Move pages show type, damage category, generation, power, accuracy, PP, priority, effect chance, effects, and in-game descriptions by version group. Ability pages show current effects and descriptions by version group. Current move stats and effects are **not historical game-specific mechanics**, and a description does not prove availability in that game. Null move values remain explicitly “not applicable or variable”; missing descriptions/effects are shown as unavailable. Localization uses the same marked fallback as Pokémon pages (Japanese → kana Japanese → English; French → English). The source does not provide Japanese effect translations.

Item details live at `/{lang}/item/{itemId}/`, prerendered for all 2,223 items in English, French, and Japanese. Pages show current short/full effects and descriptions grouped by their exact source version group; absent translations use marked fallbacks, and missing source text remains explicitly unavailable. These records do not establish historical mechanics or game availability. Item prices are not presented as a single global cost: upstream prices vary by game and currency.

`ItemLink.svelte` combines the localized name, a decorative 30 × 30px icon, and a game-preserving item link without unrelated form parameters. Evolution item/held-item requirements use it; global search also includes items with icons. Structured item references are linked by source ID, not guessed from arbitrary localized effect prose. `ItemIcon.svelte` reads every item icon from one locally served sprite sheet, so item lists add one image request rather than one per item. The 898 source icons are vendored in `tools/sprites/item-icons/` from [PokeAPI/sprites commit `6e7928dcbd547d50b5c644fe76e093e8da98ac3f`](https://github.com/PokeAPI/sprites/tree/6e7928dcbd547d50b5c644fe76e093e8da98ac3f/sprites/items); `vp run sprites:item-icons` packs them losslessly into `static/item-icons/sheet.png` (SHA-256 `62450fcc176536d4fe56273f2fefe02dad3a36f539b0ae386065ff1b83de5a7e`, 960 × 870px RGBA: 30 × 30px cells, 32 columns, sorted identifiers) and regenerates the identifier → slot map in `src/lib/data/item-icons.ts`. Most sources are 30 × 30px; 62 older 24 × 24px icons are centred unscaled, and 11 Legends: Arceus 32 × 32px balls lose only their fully transparent 1px margin. There are 863 exact identifier matches in the current item dataset; 1,360 items without matching sprites use a neutral placeholder, never another item's image or a missing-asset request. The upstream CC0 notice is retained in `static/item-icons/LICENCE.txt` and `tools/sprites/item-icons/LICENCE.txt`; image contents remain copyright The Pokémon Company, as the notice states.

Moves show a TM disc colored by the move's current source type (`MoveIcon.svelte`, reusing the vendored `tm-<type>.png` sprites) on move pages, learnsets, evolution move conditions, and search. The disc only illustrates type; it does not imply the move is available as a TM. Abilities have no per-ability icons in the games, so `AbilityIcon.svelte` uses the Ability Capsule sprite as a category marker on ability pages, Pokémon ability lists, and search. Search results also show Pokémon box icons and item icons, and the result list scrolls inside a viewport-bounded dialog.

Move catalogue category labels include locally served 32 × 14px Physical, Special, and Status symbols (`DamageClassIcon.svelte`). These unchanged game-style assets come from [Pokémon Showdown's category sprites](https://play.pokemonshowdown.com/sprites/categories/); localized text remains alongside the decorative icons, and native filter options remain text. The upstream asset directory does not supply an explicit asset license; Pokémon artwork rights remain with their respective owners.

Move pages list Pokémon varieties with learnsets in the selected game's **exact version group**, including recorded methods and levels. Ability pages list generation-resolved ordinary and hidden assignments, preserving per-slot historical upper bounds and explicit nulls; hidden abilities are excluded before Generation V, and all abilities before Generation III. These lists preserve selected game/form links and exclude forms introduced later according to release order rather than numeric group IDs. Unknown form-introduction chronology is reported as a source gap, not unavailability. Assignments do not prove obtainability or special-game battle mechanics.

`apps/website/src/lib/server/catalogue.ts` derives catalogue and reverse-relationship indexes from the existing published snapshot, with four concurrent species reads, shared compact identities, and a revision-aware in-flight cache. Full species records are discarded after projection; browsers receive only catalogue metadata or the requested resource's relationships, never a 1,025-detail-file fetch. These features require no dataset schema change, refresh, or upstream API requests.

Resource catalogues live at `/{lang}/move/`, `/{lang}/ability/`, and `/{lang}/item/`, with persistent header navigation. All support local localized/English/canonical-name search through `?q=`; moves also support current `?type=<typeId>&category=<damageClassId>` filters (1 status, 2 physical, 3 special). Filters combine, support reset and Back/Forward, and survive language/game changes. Detail links keep the selected game but omit catalogue filters and unrelated forms. Catalogues contain current source records, not verified selected-game availability; without JavaScript every entry remains reachable through unfiltered static pages. Only compact metadata is projected from the existing snapshot.

The National Pokédex and resource catalogues render 50 entries per page, including their no-JavaScript HTML lists. Page one uses the base URL; later pages use `/{lang}/page/{page}/` or `/{lang}/{move,ability,item}/page/{page}/`. Every valid page is prerendered from the actual catalogue count; page-one duplicates, noncanonical numbers, and out-of-range numbered routes return 404. Previous/next links work without JavaScript and preserve filters and game context when hydrated. Local filtering still uses the complete compact metadata before slicing; filter changes reset to page one, Back/Forward restores page and filters, and shared filters with fewer pages replace the path with the last valid result page.

Types use the reusable linked `TypeBadge.svelte` component with local [partywhale/pokemon-type-icons](https://github.com/partywhale/pokemon-type-icons) SVGs (MIT © James Watkins; license retained in `static/type-icons/LICENSE`). On Pokémon pages, clicking either type badge opens the Pokémon's full resolved type combination with `?type=<typeId>&type2=<typeId>` (or just `type` for a single-type Pokémon). Elsewhere, individual badges open `/{lang}/types/?type=<typeId>`. Links preserve the selected game through `version`. The types page has URL-backed selectors and shows combined **defensive** weaknesses, resistances, and immunities with incoming-damage multipliers. Both defending types are multiplied, including ×4, ×¼, immunity overrides, and neutral cancellation; neutral results are omitted. The chart follows the selected game's generation, and types not introduced then produce an explicit unavailable state. Invalid/nonstandard type selections do not receive an invented chart. Abilities, items, moves, battle effects, and special game rules are excluded explicitly. Query-dependent charts require JavaScript.

On Pokémon details, both type badges share one hover region and one defensive-matchup preview. Moving between the badges or focusing either link keeps a single combined chart; both links still open the full type combination for the selected game.

The compact chart in `apps/website/src/lib/data/type-matchups.ts` is based on PokéAPI's [current](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/type_efficacy.csv) and [historical](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/type_efficacy_past.csv) efficacy tables, including Generation I differences and Steel's pre-Generation VI resistances. Dark/Steel start in Generation II and Fairy in Generation VI. Nonstandard types have no invented matchup chart. No dataset refresh or runtime API request is needed.

Type selectors disable choices that did not exist in the selected game's generation, using the same introduction rule as the matchup engine. A deep link selecting an unavailable type keeps that selection visible with the explicit unavailable state, so it can be corrected without silently changing the URL.

The types page also lists matching Pokémon and alternate varieties, with cosmetic forms of identical typing grouped into one entry per variety. One selected type includes both mono- and dual-type Pokémon containing it; two types require the exact pair in either order. Compact variety identities and historical type rows are projected during the existing bounded server snapshot pass; the browser filters this metadata locally, without fetching individual Pokémon records. Membership shares historical type selection with the detail resolver and respects species/form introduction chronology. Unknown chronology or missing type facts are reported explicitly. Introduction does not establish obtainability or special-game mechanics. Links preserve game and form; decorative icons illustrate the base species rather than the form.

If a grouped variety has multiple cosmetic forms but no default, its type-list entry selects the earliest form with a known introduction, using that form's identifier, localized name, and introduction order. The detail link therefore resolves the same form and chronology. Missing or unmapped dates do not erase known chronology; when none are known, the variety-identifier fallback and explicit chronology gap remain. This establishes that the selected form existed, not that every cosmetic form was available then.

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

Use `--fresh` **once** to start the new refresh; subsequent resumptions omit it. It deliberately discards reuse of previous-run responses, not the last-good published snapshot or rate ledger. Do not start a new refresh every website deployment. In CI, `.github/workflows/deploy.yml` restores and saves `.data/state` (successful responses, active-run metadata, rate/cooldown timestamps) as one archive in R2; see [Deployment](#deployment-cloudflare).

To validate and republish cached complete input without network access:

```sh
vp run data:publish
```

Missing cached pages exit incomplete; invalid or truncated data never replaces a working manifest. A writer lock with stale-lock recovery prevents concurrent updates to the same state/output directories. Use the same output directory for one deployment channel.

To regenerate derived assets from an existing published dataset without ingestion state or upstream requests:

```sh
node tools/data/src/cli.ts republish --out-dir apps/website/static/data
```

Run this once before using a dataset published before the compact browser projections existed. It verifies the full reference/species assets against manifest hashes and sizes, validates the snapshot, preserves source provenance and previous revisions, and atomically publishes the new manifest. Repeating it on unchanged input produces the same revision. Normal deployment runs this step automatically after downloading the published dataset.

## Published files

`manifest.json` points to immutable content-versioned assets under `revisions/{datasetRevision}/`:

- `references.json`: game mappings, localized labels, complete move detail records, ability/item effects and descriptions, source counts, and coverage.
- `pokemon-references.json`: detail-page references, retaining full abilities and historical mappings but only names/identities/type IDs for moves and names/identities for items.
- `search/references.json`: move, ability, and item names/aliases/identities plus move type IDs, without effects or descriptions.
- `games.json`: the precomputed main-series game list (selector options and coverage), so `getGames()` no longer downloads `references.json`.
- `pokemon/{speciesId}.json`: one complete locale-independent species/variety bundle.
- `search/{en,fr,ja}.json`: compact names, aliases, and stable species/variety/form identities.
- `evolution/{chainId}.json`: chain membership and incoming source methods, with unresolved game applicability explicitly preserved.

Every manifest entry includes a relative path, SHA-256, and byte count. Publish assets first and atomically switch the manifest only after validation. Keep previous revisions available for active visitors; a failed refresh leaves the last-good manifest unchanged. Do not garbage-collect older revisions without an explicit retention policy.

Each emitted asset is canonically serialized once; that same text is hashed, measured, and atomically written, keeping immutable identities unchanged without duplicate serialization.

Caching contract: revalidate the root manifest, all prerendered HTML, and `_app/version.json` (`no-cache`/`must-revalidate` plus an `ETag`). Serve `data/revisions/*` and `_app/immutable/*` with `Cache-Control: public, max-age=31536000, immutable`, and keep the previous deploy's `_app/immutable/*` files, as with data revisions, so open tabs keep working after a redeploy. With these headers, a repeat visit costs 304s for the manifest and HTML plus only the species files not yet seen. `vp preview` sends neither header, so it cannot demonstrate repeat-visit caching; use `vp run cf:dev`. The browser pins one manifest revision per page session.

## Deployment (Cloudflare)

The site runs as a Cloudflare Worker with static assets (Workers Paid plan: the build has ~27k files, over the free plan's 20,000). Config: `apps/website/wrangler.jsonc`.

- **Pages and app code** are uploaded from `apps/website/build`. `static/_headers` marks `_app/immutable/*` immutable; everything else keeps the Workers default `public, max-age=0, must-revalidate` with an ETag.
- **The dataset is not uploaded with the Worker** (`static/.assetsignore` excludes `/data`). It lives in the R2 bucket `pokemouille-data` under the same keys (`data/manifest.json`, `data/revisions/...`). `apps/website/worker/index.ts` serves those keys, plus `_app/immutable/*` chunks from earlier deploys, only for requests no static asset matched. The manifest is `no-cache` with ETag/304; everything else is immutable and cached at the edge with the Cache API (a no-op on `*.workers.dev`, active on a custom domain).
- **Retention:** R2 keeps every published revision and every deploy's immutable chunks; nothing is garbage-collected. One revision is ~100 MB, so R2's 10 GB free storage holds ~100 refreshes.

`apps/website/scripts/r2.ts` moves files:

| Command                     | Effect                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `sync`                      | Uploads missing revision files and `_app/immutable/*` (never overwrites; size mismatch fails), then `data/manifest.json` last. |
| `data-pull`                 | Downloads the files listed in the R2 manifest into `static/data`, verifying each SHA-256.                                      |
| `state-pull` / `state-push` | Restores / saves `.data/state` as `state/state.tar.gz` (not served by the Worker).                                             |

Add `--local` to use Wrangler's local bucket instead of R2. Local Workers preview: `vp run website#build`, `node apps/website/scripts/r2.ts sync --local`, `vp run cf:dev`.

**CI** (`.github/workflows/deploy.yml`, one run at a time): on push to `main` it downloads the published dataset, republishes derived assets offline, builds, runs `sync`, then `vp run cf:deploy`. Order matters: files before the manifest, manifest before the Worker. The weekly schedule (and manual runs with `refresh`) first restores `.data/state`, starts a `--fresh` refresh (or resumes an incomplete one), and saves state even when the refresh stops early; an incomplete refresh deploys the last-good dataset and warns.

One-time setup:

1. Subscribe to Workers Paid; enable R2; `wrangler r2 bucket create pokemouille-data`.
2. Create an API token with **Workers Scripts: Edit** and **Workers R2 Storage: Edit** (dashboard → My Profile → API Tokens).
3. Add GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. Seed R2 from a machine holding the current state, after `wrangler login`: `vp run website#build`, `node apps/website/scripts/r2.ts sync`, `node apps/website/scripts/r2.ts state-push`.

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
