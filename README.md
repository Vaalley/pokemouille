# Pokémouille

A multilingual, game-aware Pokédex built with Vite+ and SvelteKit, live at <https://pokemouille.vaaleyou.workers.dev>. Localized browsing, Pokémon histories and calculated figures, regional dexes, breeding references, moveset search, locations, comparison, type coverage, opt-in cries, and instant global search are implemented in English, French, and Japanese.

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

- Further visual direction and layout refinement.
- Game-specific evolution applicability and special game-mechanics rules: need sufficient source evidence before display.
- Native-speaker review of the fr/ja "not introduced" wording.
- Validate `@sveltejs/kit@3.1.0` before removing it from `minimumReleaseAgeExclude`.
- **Later — installable offline mode (PWA):** not started. Add a service worker that caches the app shell and the immutable `data/revisions/*` files the visitor has opened, a web app manifest, and an "update ready" banner when a new deployment or dataset revision is available. Keep revision pinning and the caching contract below intact.

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

Routes: `/` (language choice; redirects with JavaScript), `/{lang}/` (Pokédex list/table), `/{lang}/pokemon/{speciesId}/?version=<game>&form=<form>`, and the exploration routes below. All 3 × 1,025 species pages are prerendered with game-independent identity only; game/form panels resolve in the browser (game precedence: URL → saved preference → Scarlet). Header navigation exposes the exploration tools alongside global search (Ctrl/Cmd+K, or start typing). Ranking in `apps/website/src/lib/search/rank.ts` combines the per-language Pokémon index with compact resource names, so typing never fetches. Results accept localized names, English/canonical aliases and numeric IDs, carry localized category labels, and preserve game context. Only Pokémon results carry introduction status; resource records remain current, not proof of game availability. Interactive controls use headless Bits UI with shared functional styling.

Layout and light/dark colors are shared through `apps/website/src/app.css`: `.page-header` (kind/number, name, one context line), `.properties` (label/value fact sheets), `.figures` (short labelled numbers), `.definitions` (stacked long text), `.filters`/`.filter-field` (Pokédex, catalogue and type filters), `.note` (smaller scope and caveat text) and `.result-count`. Pokémon pages place identity and imagery before evolution, overview, and the remaining detail sections.

The shared palette uses warm paper backgrounds, off-white raised surfaces, green-black text and a muted teal accent; dark mode uses deep green-charcoal surfaces and a lighter teal. Theme tokens in `app.css` cover surfaces, secondary text, links, control borders, focus rings and overlays. Automatic mode follows the OS; forced-colour mode restores system colours. Pokémon and type artwork supply most of the brighter colour rather than decorative gradients.

The default Pokédex list uses compact 12px cards with one full-card Pokémon link, the existing sprite sheet, quiet dex numbers, a prominent name and current type badges. Regional cards retain both regional and National numbers. The table keeps its existing layout. `TypeBadge` uses labelled, icon-backed type tints for all 18 types; linked badges retain type navigation and matchup previews, while `linked={false}` renders a non-interactive badge inside card links, avoiding nested anchors. Unknown type IDs use a neutral badge.

The Pokédex catalogue keeps search and Pokédex selection visible, with type, introduction generation, current ability, status and stat-total bounds in a closed-by-default Filters disclosure. Its count covers active advanced criteria; all active search, dex and advanced criteria remain visible as individually removable chips. Scope explanations live inside the disclosure, and display/sort/order controls sit immediately above the results (a compact two-row toolbar on phones). Filters, chips and results derive from the existing URL state, including shared links and Back/Forward; removing one chip preserves the other criteria, game and display options. Reset clears filters but retains display/sorting. With JavaScript disabled, the full National Pokédex remains available and the native disclosure still exposes the scope notes.

Pokémon details use one rounded identity panel: artwork beside the number, name, resolved types and species facts on desktop; a stacked layout on narrow screens. The game selector moves from the site header into this panel beside the form selector, with one shared layout-owned game-change handler preserving URL and saved-preference behavior. Type links retain their combined defensive-matchup preview. Cry controls form a compact panel footer and remain opt-in; image, audio and availability caveats remain visible. Language, default-sprite and theme settings stay in the site header.

Pokémon history combines base-stat and effort timelines in one table, with separate compact type/ability panels. Every recorded range, value, ability slot and missing-history caveat remains available. The overview balances stats/abilities against physical facts/Pokédex text. Move methods show row counts and bounded keyboard-scrollable tables; encounter location groups are native disclosures, with source explanations under “About these records.” Full Pokédex entries and expanded breeding references also use bounded regions rather than stretching the page.

Item, ability and move details share `.resource-detail` headers and section spacing, `.detail-panel` information groups, `.detail-grid` responsive layouts and `.detail-table` description regions with sticky headers. Short and full effects remain separate; ability effect history is grouped by game. Move figures and battle metadata retain variable/zero/missing distinctions and every raw source field. Machine learners, related Pokémon and item evolution families keep all records and game/form links while using bounded lists or native disclosures for long content.

The site header separates browsing from display preferences. Desktop keeps the browsing links visible; at 56rem and below they move into a labelled Browse disclosure. Intermediate widths keep brand, search, Browse and Settings on one row; at 40rem and below they use two compact rows. Disclosure buttons share the search control's border and 44px minimum height, with CSS-drawn chevrons rather than baseline-dependent text glyphs. A Settings disclosure contains language, default sprite and theme, while game selection remains visible outside Settings (inside the identity panel on Pokémon pages). Header game controls are left-aligned and use the same 44px minimum height and field padding as other selectors. The identity panel stacks at 48rem to avoid a tall, mostly empty artwork column beside wrapped controls. Both disclosures use native `details` so navigation and no-JavaScript language links remain reachable; only one opens at a time. With JavaScript, outside pointer presses, Escape and route navigation dismiss the panels, while nested select menus retain their own Escape handling.

Stat-table headings can wrap on narrow screens; numeric ranges stay unbroken. This keeps translated headings from widening the entire page and shifting the header or Settings panel sideways.

Corner styling uses shared tokens in `app.css`: `--radius-panel` (12px) for cards, menus and dialogs, `--radius-control` (8px) for buttons and fields, and `--radius-pill` for type badges and small tags. `--border-width` sets the shared UI border width to 2px; existing stronger keyboard-focus rings are retained. Tables and stat bars stay square; native checkbox and radio shapes are unchanged.

Legendary and Mythical Pokémon show a compact star badge beside their name: gold for Legendary, violet for Mythical. Labels are localized in English, French, and Japanese, and species-level classification is included in the static page so the badge appears before client-side data loads. Ordinary Pokémon have no badge.

Pokémon pages start species data, compact detail references, and games in parallel after mount; game/form resolution still waits for URL → saved preference → Scarlet context. Evolution starts as soon as the species record arrives, independently of references and games. The overview does not wait for the chain: evolution has its own localized loading/error state and retry button, and late results from a previous species are ignored. Global search lazily loads compact resource metadata rather than full reference prose; the type-matchup page receives its small type-name list in prerendered page data and downloads only games.

The header's search trigger and keyboard shortcuts are lightweight. `SearchDialogContent.svelte`, result renderers, and search-only icon mappings load on the first opening, with draft input preserved while the module arrives; closing/reopening reuses the loaded component and prepared index. Data failures retry in place. A failed JavaScript module download offers a localized page-reload action because the browser caches failed imports. Pages that otherwise need item icons still load their mapping normally.

Search results preserve the selected Pokémon form even while the game list is loading or unavailable. Without a resolved or explicit game, the result link carries `?form=` alone and lets the detail page resolve the game normally; default-form results omit `form`.

Pokémon detail Previous/Next links retain an explicit `?version=` while the game list is loading or unavailable, and clear the previous species' form. After game resolution they use the resolved game as usual.

The National Pokédex list uses compact, decorative 40 × 30px box-style icons for all 1,025 species. `PokemonIcon.svelte` reads National Dex slots from one locally served [Pokémon Showdown sprite sheet](https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png?v22), so the list adds one image request rather than one per Pokémon and works without JavaScript. The vendored `static/pokemon-icons.png` has SHA-256 `81c713b8f4d94f7f577c546974e3d562d90b38c98b38b1b63b2a953b9acfca2a`; its layout is 12 columns of 40 × 30px cells. These are illustrative base-species icons, not selected-game or form-specific sprites. Pokémon imagery belongs to Nintendo / Creatures Inc. / GAME FREAK; sprite contributors and minisprite resizing are credited by [Pokémon Showdown](https://pokemonshowdown.com/credits) (including leparagon, the Smogon sprite projects, and Kalalokki). No dataset refresh is required.

Homepage filters combine localized name/National Dex number (`q`), current default-variety `type` and `ability` (ordinary or hidden), introduction `generation`, species `class=ordinary|legendary|mythical|baby`, and inclusive current base-stat-total bounds `minTotal`/`maxTotal`. `view=list|table`, `sort=number|name|hp|attack|defense|spatk|spdef|speed|total`, and `order=asc|desc` select the presentation; number/name default ascending, stats descending, unknown stats last, and ties use National Dex number. These are current catalogue facts, not selected-game mechanics. Filtering is local, combines with AND, and supports shared links, reset and Back/Forward through SvelteKit's shallow URL state. Without JavaScript the unfiltered static list remains reachable. Pokémon links preserve the selected game and clear unrelated forms.

`dex=<pokedexId>` restricts that same list/table to source-recorded regional numbers; number sorting then uses regional order. Choices include every base/DLC dex explicitly mapped to the selected game's **exact version group**, without borrowing another group's dex. National is the default (`dex=1` is equivalent); malformed or wrong-game selections stay visibly invalid rather than silently becoming National. Dex membership is not game availability or obtainability. See [`regional-dex.ts`](apps/website/src/lib/data/regional-dex.ts).

Pokémon detail pages include a localized sprite gallery using the resolved variety's existing `media.sprites`: pixel sprites, opt-in Showdown animations, Pokémon HOME renders, sprites by game (including recorded historical animations and grayscale/transparent variants), official regular/shiny artwork, Dream World illustrations, and menu icons by generation or game. Category tabs show one source at a time; the game picker groups releases by generation, and artwork/icon pickers keep those collections compact. Each category remembers its source while switching tabs. The gallery's game selection is independent of the page's game context; source sprites do not establish game availability. Only the active source's images mount, images load lazily, unavailable sources/views are omitted, and failed downloads show an explicit error. Changing Pokémon or form replaces the gallery with the newly resolved media; it never synthesizes URLs or falls back to another variety. Labels support English, French, and Japanese using existing localized game references. Detail images remain hosted by PokéAPI's sprite repository; the homepage icon sheet is local.

The header's **Default sprite** setting controls the main image on Pokémon detail pages independently of the mechanics game and gallery tabs. Visitors can choose official artwork, pixel sprites, Showdown animations, HOME, Dream World, or a game-specific style (including recorded animations such as Crystal). The choice is saved as `pokemouille.sprite` in local storage and survives navigation, reloads, and language changes; official artwork is the initial default. The selected form's exact `front_default` URL is used, with crisp rendering for pixel styles. Missing or failed preferred images fall back only to that same form's official artwork with a visible explanation, without overwriting the saved preference; if neither image is available, an explicit missing state replaces it. The selector remains disabled until hydrated and game labels are available.

Evolution chains render as full-width branching cards with species icons, National Dex numbers, current-node markers, and game-preserving links. Branches stay in a single-column tree so connectors follow the actual ancestry: each child owns its connector, and the rail stops at the final child's heading rather than trailing below its card. Each method keeps its localized conditions, trigger, source version group, and default-row provenance; requirements combine with AND and alternative source methods with OR. Later-introduced species remain visible with a badge. Source evolution applicability remains unresolved: a method's version group records introduction, and a default row describes the latest main-generation expectation—not a verified method for every selected game.

Evolution stage names and links stay visible. Each stage's localized “How it evolves” disclosure starts collapsed and can be expanded independently by mouse, touch, or keyboard; navigating to another Pokémon or form resets the disclosures.

A method whose resulting form belongs to a non-default variety gets its own card beside the species card, linking to that form; cosmetic results stay on the species card. A regional base form that no method produces still gets a card beside its species card when a later stage requires it, so Alolan Vulpix → Alolan Ninetales and Galarian Meowth → Perrserker branch apart from Vulpix → Ninetales and Meowth → Persian. A stage whose methods all require one such variety hangs under its card (Galarian Mr. Mime → Mr. Rime), otherwise under the species card. Required/resulting form conditions show localized form names. `apps/website/src/lib/server/evolution-forms.ts` projects these form identities from the chain's species records at prerender time, so the dataset schema is unchanged; `apps/website/src/lib/data/evolution-tree.ts` builds the display tree.

Move details live at `/{lang}/move/{moveId}/` and ability details at `/{lang}/ability/{abilityId}/`. Both are statically prerendered for English, French, and Japanese, and linked from Pokémon learnsets and ability sections. Links preserve an explicit `?version=` selection; language switching keeps the detail route and game context.

On Pokémon details, ability names remain links to their detail pages. Hovering or focusing a name opens a compact preview of the selected version group's in-game description, including the existing language fallback or missing-text explanation. Descriptions and current effect prose are no longer displayed inline; full effects remain on ability detail pages.

Pokémon learnsets are exact-version-group tables, grouped by learning method. Level-up rows sort by level, source order, then localized name; other methods sort by localized name. Columns add current damage category, power, accuracy and PP, with priority only when a group contains a nonzero priority and mastery when recorded. These combat columns are explicitly current source values, not reconstructed historical stats. A dash preserves no fixed/recorded value rather than inventing zero.

Move pages show type, damage category, generation, power, accuracy, PP, priority, effect chance, effects, and in-game descriptions by version group. Ability pages show introduction generation, current effects, recorded mechanics history, and descriptions by version group. Historical ability notes describe the effect **before** the change in the named games; they are ordered by release chronology and are not a complete game-by-game mechanics reconstruction. Missing history does not imply that an ability never changed. Current move stats and effects are **not historical game-specific mechanics**, and a description does not prove availability in that game. Null move values remain explicitly “not applicable or variable”; missing descriptions/effects are shown as unavailable. Localization uses the same marked fallback as Pokémon pages (Japanese → kana Japanese → English; French → English). The source does not provide Japanese effect translations.

Move pages also show structured **current** battle properties: target, source flags, signed stat-stage changes, effect category and ailment, hit/turn ranges, healing/HP cost, drain/recoil, critical-hit stage modifier, and recorded effect chances. Positive drain is a percentage of damage dealt restored; negative drain is recoil. The separate signed healing field uses the user's maximum HP: positive values restore HP, while negative values display their positive magnitude as an HP cost (for example, Struggle's `-25` means a 25% maximum-HP cost, not damage-relative recoil). Critical-hit modifiers are stages, not probabilities. Source chance `0` can mean conditional or unspecified, not necessarily impossible or guaranteed. A compact summary omits most zero values; an expandable raw list preserves zero separately from missing metadata. Missing flags do not prove an interaction impossible, and effect prose remains necessary for conditions and exceptions.

Item details live at `/{lang}/item/{itemId}/`, prerendered for all 2,223 items in English, French, and Japanese. Pages show current short/full effects and descriptions grouped by their exact source version group; absent translations use marked fallbacks, and missing source text remains explicitly unavailable. These records do not establish historical mechanics or game availability. Item prices are not presented as a single global cost: upstream prices vary by game and currency.

Item pages include reverse evolution uses for both consumed evolution items and held-item requirements. Each matching source method retains **all** its conjunctive requirements, alternative methods, form identities, source version group and default-row provenance; ancestor stages provide context while unrelated branches/methods are omitted. These are source-recorded uses, not proof that the method applies in the selected game: game applicability remains explicitly unresolved.

Item and move pages link source TM/TR item-to-move mappings only for the selected game's **exact version group**. No mapping is carried forward, inferred from item numbering/names or effect prose, or implied by a move's decorative disc icon. Machine item pages list only varieties with the taught move's **machine** learn method in that same group, never level-up/egg/tutor learners. Known species/form introduction chronology excludes later introductions; unknown form chronology is excluded with a source-gap explanation, not called unavailable. Missing mappings or learners do not establish unobtainability.

`ItemLink.svelte` combines the localized name, a decorative 30 × 30px icon, and a game-preserving item link without unrelated form parameters. Evolution item/held-item requirements use it; global search also includes items with icons. Structured item references are linked by source ID, not guessed from arbitrary localized effect prose. `ItemIcon.svelte` reads every item icon from one locally served sprite sheet, so item lists add one image request rather than one per item. The 898 source icons are vendored in `tools/sprites/item-icons/` from [PokeAPI/sprites commit `6e7928dcbd547d50b5c644fe76e093e8da98ac3f`](https://github.com/PokeAPI/sprites/tree/6e7928dcbd547d50b5c644fe76e093e8da98ac3f/sprites/items); `vp run sprites:item-icons` packs them losslessly into `static/item-icons/sheet.png` (SHA-256 `62450fcc176536d4fe56273f2fefe02dad3a36f539b0ae386065ff1b83de5a7e`, 960 × 870px RGBA: 30 × 30px cells, 32 columns, sorted identifiers) and regenerates the identifier → slot map in `src/lib/data/item-icons.ts`. Most sources are 30 × 30px; 62 older 24 × 24px icons are centred unscaled, and 11 Legends: Arceus 32 × 32px balls lose only their fully transparent 1px margin. There are 863 exact identifier matches in the current item dataset; 1,360 items without matching sprites use a neutral placeholder, never another item's image or a missing-asset request. The upstream CC0 notice is retained in `static/item-icons/LICENCE.txt` and `tools/sprites/item-icons/LICENCE.txt`; image contents remain copyright The Pokémon Company, as the notice states.

Moves show a TM disc colored by the move's current source type (`MoveIcon.svelte`, reusing the vendored `tm-<type>.png` sprites) on move pages, learnsets, evolution move conditions, and search. The disc only illustrates type; it does not imply the move is available as a TM. Abilities have no per-ability icons in the games, so `AbilityIcon.svelte` uses the Ability Capsule sprite as a category marker on ability pages, Pokémon ability lists, and search. Search results also show Pokémon box icons and item icons, and the result list scrolls inside a viewport-bounded dialog.

Move catalogue category labels include locally served 32 × 14px Physical, Special, and Status symbols (`DamageClassIcon.svelte`). These unchanged game-style assets come from [Pokémon Showdown's category sprites](https://play.pokemonshowdown.com/sprites/categories/); localized text remains alongside the decorative icons, and native filter options remain text. The upstream asset directory does not supply an explicit asset license; Pokémon artwork rights remain with their respective owners.

Move pages list Pokémon varieties with learnsets in the selected game's **exact version group**, including recorded methods and levels. Ability pages list generation-resolved ordinary and hidden assignments, preserving per-slot historical upper bounds and explicit nulls; hidden abilities are excluded before Generation V, and all abilities before Generation III. These lists preserve selected game/form links and exclude forms introduced later according to release order rather than numeric group IDs. Unknown form-introduction chronology is reported as a source gap, not unavailability. Assignments do not prove obtainability or special-game battle mechanics.

`apps/website/src/lib/server/catalogue.ts` derives catalogue and reverse-relationship indexes from the published snapshot. It shares the revision-aware promise cache and bounded species reader in `server/snapshot.ts` with breeding and location projections: at most four full species records are read concurrently and discarded after projection. Browsers receive compact metadata or requested relationships, never a 1,025-detail-file fan-out.

Resource catalogues live at `/{lang}/move/`, `/{lang}/ability/`, and `/{lang}/item/`, with persistent header navigation. All support local localized/English/canonical-name search through `?q=`; moves also support current `?type=<typeId>&category=<damageClassId>` filters (1 status, 2 physical, 3 special). The move table shows current type/category, power, accuracy and PP and supports `?sort=name|power|accuracy|pp`: localized name ascending by default, numeric values descending, ties by localized name then ID. Missing/flexible values sort last (including zero power, which denotes no fixed power). Filters and sort combine, support reset and Back/Forward, and survive language/game changes. Detail links keep the selected game but omit catalogue filters and unrelated forms. Catalogues contain current source records, not verified selected-game availability; without JavaScript every entry remains reachable through unfiltered static pages. Only compact metadata is projected from the snapshot.

The National Pokédex and resource catalogues show the complete list without pagination. Local filtering uses the full compact catalogue, and unfiltered lists are also available without JavaScript. Filter URLs and browser Back/Forward navigation preserve browsing state.

Types use the reusable linked `TypeBadge.svelte` component with local [partywhale/pokemon-type-icons](https://github.com/partywhale/pokemon-type-icons) SVGs (MIT © James Watkins; license retained in `static/type-icons/LICENSE`). On Pokémon pages, clicking either type badge opens the Pokémon's full resolved type combination with `?type=<typeId>&type2=<typeId>` (or just `type` for a single-type Pokémon). Elsewhere, individual badges open `/{lang}/types/?type=<typeId>`. Links preserve the selected game through `version`. The types page has URL-backed selectors and shows combined **defensive** weaknesses, resistances, and immunities with incoming-damage multipliers. Both defending types are multiplied, including ×4, ×¼, immunity overrides, and neutral cancellation; neutral results are omitted. The chart follows the selected game's generation, and types not introduced then produce an explicit unavailable state. Invalid/nonstandard type selections do not receive an invented chart. Abilities, items, moves, battle effects, and special game rules are excluded explicitly. Query-dependent charts require JavaScript.

On Pokémon details, both type badges share one hover region and one defensive-matchup preview. Moving between the badges or focusing either link keeps a single combined chart; both links still open the full type combination for the selected game.

The compact chart in `apps/website/src/lib/data/type-matchups.ts` is based on PokéAPI's [current](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/type_efficacy.csv) and [historical](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/type_efficacy_past.csv) efficacy tables, including Generation I differences and Steel's pre-Generation VI resistances. Dark/Steel start in Generation II and Fairy in Generation VI. Nonstandard types have no invented matchup chart. No dataset refresh or runtime API request is needed.

Type selectors disable choices that did not exist in the selected game's generation, using the same introduction rule as the matchup engine. A deep link selecting an unavailable type keeps that selection visible with the explicit unavailable state, so it can be corrected without silently changing the URL.

The types page also lists matching Pokémon and alternate varieties, with cosmetic forms of identical typing grouped into one entry per variety. One selected type includes both mono- and dual-type Pokémon containing it; two types require the exact pair in either order. Compact variety identities and historical type rows are projected during the existing bounded server snapshot pass; the browser filters this metadata locally, without fetching individual Pokémon records. Membership shares historical type selection with the detail resolver and respects species/form introduction chronology. Unknown chronology or missing type facts are reported explicitly. Introduction does not establish obtainability or special-game mechanics. Links preserve game and form; decorative icons illustrate the base species rather than the form.

If a grouped variety has multiple cosmetic forms but no default, its type-list entry selects the earliest form with a known introduction, using that form's identifier, localized name, and introduction order. The detail link therefore resolves the same form and chronology. Missing or unmapped dates do not erase known chronology; when none are known, the variety-identifier fallback and explicit chronology gap remain. This establishes that the selected form existed, not that every cosmetic form was available then.

Pokémon encounter locations use the selected **exact version** and resolved **variety**, never another version in the same group or a related variety. Records group by location, area and encounter method and retain level ranges, source slot/row IDs, slot rarity, recorded conditions and each condition value's source default flag. Slot percentages are not overall encounter rates and are not summed; “default” is source metadata, not an unconditional encounter. Cosmetic forms share variety-level records, so these do not confirm the selected cosmetic form's location. Missing states distinguish unknown form chronology, unmatched variety, unknown game coverage, a globally empty game, and a variety with no rows in a covered game. These records do not infer gifts, trades, transfers, other obtaining methods or game availability; absence never means unobtainable.

The encounter row's `versionId` determines its game. A slot's `versionGroupId` is retained source provenance, not an applicability rule: the source can reuse an older group's slot for a later exact-version encounter (including Yellow static encounters). Do not discard such rows or substitute the slot's group for the encounter's version.

### Historical detail and exploration tools

All features below have English, French, and Japanese UI and preserve the selected game through `version`; missing translations retain marked language fallback rather than borrowing another game's facts.

- **Calculated figures:** Pokémon stats include Level 50/100 per-stat ranges from the resolved historical base stats. Generations I–II use DV 0–15 and stat experience 0–65,535 (Generation I keeps single Special); III onward use IV 0/no EV/hindering Nature through IV 31/252 EV/beneficial Nature, with HP ignoring Nature and Shedinja's HP fixed at one. Maxima are individual bounds, not a simultaneously legal EV spread. Let's Go, Legends: Arceus, and Legends: Z-A do not receive an invented ordinary formula. Capture figures assume one ordinary Poké Ball, full HP, no status or other modifiers; Generation II shows the HP-rounding range, V+ is approximate, and special capture systems are not computed. Capture rate and hatch counter remain **current source scalars**, not historical game-specific values. Hatch steps are approximate unmodified cycle calculations where supported; Sword/Shield, BDSP and Scarlet/Violet retain cycles only, unsupported breeding games say so, and missing counters stay missing. Formula sources and rounding rules live in [`stat-formulas.ts`](apps/website/src/lib/data/stat-formulas.ts).
- **All Pokédex entries and history:** detail pages group identical text across exact source versions in release chronology, with per-version language fallback. Generation timelines resolve historical types, stats and ability slots through the same resolver; sparse bounds, unknown periods and empty slots remain explicit. Absence of history does not prove no changes, and generation rows do not establish every special game's mechanics. See [`pokemon-history.ts`](apps/website/src/lib/data/pokemon-history.ts).
- **Breeding:** `/{lang}/egg-group/` and `/{lang}/egg-group/{id}/` list source groups and members; Pokémon details show groups, sex ratios and lazily loaded egg-move donor candidates. Candidates require the recipient's egg move and donor learnset in the **exact version group**, compatible parent sex/group rules, and known introduction chronology. Non-egg learning is distinguished from egg-only/chain candidates whose acquisition chain is unresolved. Scarlet/Violet **Mirror Herb transfer** is separate from parent breeding and ignores sex/species/egg groups; an egg-only donor still has an unresolved acquisition chain. Current egg groups and sex ratios have no historical bounds, variety-level learnsets do not prove cosmetic-form inheritance, and candidates prove neither form/combination legality nor obtainability. Ditto, babies, Undiscovered and games without breeding are handled explicitly. See [`breeding.ts`](apps/website/src/lib/data/breeding.ts).
- **Moveset search:** `/{lang}/moveset/?move=<moveId>&move=<moveId>` accepts at most four distinct moves and intersects variety learners in the selected exact version group, retaining methods/levels and excluding later introductions. Unknown chronology is a gap, not unavailability. It checks individual recorded learning, **not simultaneous moveset legality**, transfer compatibility or acquisition chains.
- **Locations:** `/{lang}/location/` lists source encounter locations grouped by region, with local `q` name filtering; `/{lang}/location/{id}/?version=<game>` shows that location's exact-version encounters and source area/method/condition/slot details. The encounter caveats above apply equally to reverse location pages; a location with no rows is not proof of no gifts, trades or transfers.
- **Comparison:** `/{lang}/compare/?p=<speciesId>&p=<speciesId>~<formIdentifier>` accepts up to six distinct entries. Each uses the shared selected-game resolver for types, base stats and abilities, preserving historical unknowns and Generation I Special rather than inserting current values. URL state is shareable and survives navigation; this is a reference comparison, not team building.
- **Theme:** the header offers automatic/system, light and dark modes. `pokemouille.theme` persists locally across reloads, navigation and languages; an inline startup script applies the saved override before first paint.
- **Offensive coverage:** `/{lang}/types/coverage/?attack=<typeId>&attack=<typeId>` uses repeated `attack` values for the selected attacking types. It shows best type-effectiveness coverage and resistant combinations, plus a chart against single/dual defending types, using the selected generation's chart and type introduction rules. Existing source combinations are distinguished from theoretical pairs. This models type multipliers only, not abilities, moves, battle modifiers or game obtainability.
  Neutral chart cells use secondary text; resisted and immune cells use full-strength text, while weaknesses remain bold. Multipliers stay explicit rather than relying on colour alone.
- **Cries:** Pokémon details offer explicit Play for source **current/latest** and distinct **legacy** variety recordings where present. Audio has no source attached until requested, never autoplays, and stops/releases on source or identity changes. These recordings are not attributed to the selected game or a particular cosmetic form.

See the [architecture source map and projection contracts](docs/architecture.md#feature-projections-and-source-evidence) for implementation boundaries.

**Schema-3 migration:** the manifest and offline `republish` now require schema version **3**. A schema-2 (or older) publication cannot be upgraded with offline `republish`: start a new refresh with the updated GraphQL operations and `--fresh` **once**, retain `.data/state` and its rate ledger/cooldown, then resume without `--fresh` until validation and publication complete. Schema 3 adds species `eggGroupIds` and `pokedexNumbers`, per-variety `cries`, encounter `location.regionId`, and reference `eggGroups`, `pokedexes` and `regions` (also in the Pokémon references projection); older cached responses cannot supply these facts. Do this before building/deploying the updated website. Offline republishing can only regenerate derived projections from an already compatible snapshot. Earlier requirements still apply: structured move mechanics, machine mappings, exact-version encounter coverage and per-variety encounters (schema 2), item `effects`/`flavorTexts`, ability `generationId`/`effectChanges` (including recorded empty arrays).

A fresh schema-3 ingestion has completed locally. Before external deployment, publish a compatible dataset to the deployment channel: ordinary CI download plus offline `republish` cannot upgrade an existing remote schema-2 publication.

## Generate the real dataset

Run from the repository root:

```sh
vp run data:refresh
vp run data:status
```

These tasks deliberately disable Vite Task caching: the pipeline owns its durable response cache and rate ledger. They use `.data/state` for state and `apps/website/static/data` for static output. Both are ignored generated files. Normal website builds never call PokéAPI.

Each upstream POST also carries a deterministic `queryHash` URL parameter derived from the complete local request identity (endpoint, schema/query/output versions, operation document/name and variables). This prevents the upstream proxy from returning a stale response for a different large POST body; the existing local cache, request budget and cooldown still apply. This transport-only correction does not require `--fresh` when the active run already matches the current documents.

The first refresh collects the complete dataset, validates all bounded collections/census relationships, and publishes only after successful validation. Current extraction uses 25-species pages, including per-variety learnsets and encounters: at 1,025 species, a complete run needs **45 GraphQL requests** (41 species pages, references, common encounter lookups, and before/after census). Common encounter locations, areas, slots, methods and condition labels are fetched once in a separate bounded query; species rows use scalar foreign keys and mapping joins them into the published records. Independent source counts validate bounded collections and lookup names against truncation. Changing upstream counts can increase request requirements.

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

For an already schema-compatible snapshot, run this once before using a dataset published before the compact browser projections existed. It verifies the full reference/species assets against manifest hashes and sizes, validates the snapshot, preserves source provenance and previous revisions, and atomically publishes the new manifest. Repeating it on unchanged input produces the same revision. Normal deployment runs this step automatically after downloading the published dataset. It rejects older manifest schemas rather than fabricating newly required upstream fields.

## Published files

`manifest.json` points to immutable content-versioned assets under `revisions/{datasetRevision}/`:

- `references.json`: game mappings, localized labels, complete move records (including structured current battle properties), ability/item effects and descriptions, exact-group `machines`, exact-version `encounterCoverage`, source counts, and coverage.
- `pokemon-references.json`: detail-page references, retaining full abilities, historical mappings, `machines` and `encounterCoverage`; moves retain names/identities, type, damage category, power, accuracy, PP and priority, while items retain names/identities.
- `search/references.json`: move, ability, and item names/aliases/identities plus move type IDs, without effects or descriptions.
- `games.json`: the precomputed main-series game list (selector options and coverage), so `getGames()` no longer downloads `references.json`.
- `pokemon/{speciesId}.json`: one complete locale-independent species/variety bundle, including each variety's exact-version encounter rows, slot rarity, conditions and source default flags.
- `search/{en,fr,ja}.json`: compact names, aliases, and stable species/variety/form identities.
- `evolution/{chainId}.json`: chain membership and incoming source methods, with unresolved game applicability explicitly preserved.

Schema 3 also carries species egg groups/regional dex numbers, variety cries, encounter location region IDs, and egg-group/dex/region reference labels and mappings in the appropriate full/compact records.

The site build additionally prerenders immutable **derived** JSON at `/learners/{datasetRevision}/{moveId}.json` and `/breeding/{datasetRevision}/{speciesId}.json`. Moveset search downloads only selected moves' learner projections; breeding details fetch only their species projection when opened. These are build outputs, **not published dataset manifest files** and not assets regenerated by dataset `republish`. They must be uploaded/retained with the deployment.

Every manifest entry includes a relative path, SHA-256, and byte count. Publish assets first and atomically switch the manifest only after validation. Keep previous revisions available for active visitors; a failed refresh leaves the last-good manifest unchanged. Do not garbage-collect older revisions without an explicit retention policy.

Each emitted asset is canonically serialized once; that same text is hashed, measured, and atomically written, keeping immutable identities unchanged without duplicate serialization.

Caching contract: revalidate the root manifest, all prerendered HTML, and `_app/version.json` (`no-cache`/`must-revalidate` plus an `ETag`). Serve `data/revisions/*`, `_app/immutable/*`, `/learners/<revision>/*.json` and `/breeding/<revision>/*.json` with `Cache-Control: public, max-age=31536000, immutable`. Retain older dataset revisions, app chunks and derived JSON so open tabs keep working after redeployment. `vp preview` cannot demonstrate the Workers caching contract; use `vp run cf:dev`.

The browser does not read the manifest. `apps/website/vite.config.ts` builds the local manifest's `datasetRevision` into the app (`import.meta.env.DATASET_REVISION`), and the loader derives revision paths with `datasetFiles`/`revisionPath` from `packages/pokemon-data/src/paths.ts`, the same names publication writes. Prerendered pages and runtime downloads therefore always use the snapshot they were built from, and a tab keeps that revision until it loads new HTML. Restart `vp dev` after publishing a new revision. Prerendered `/{lang}/` pages preload `games.json`; Pokémon pages also preload their species file, `pokemon-references.json` and evolution chain (`hooks.server.ts`). The Pokémon route's browser `load` starts the same downloads, so hovering a Pokémon link (`data-sveltekit-preload-data="hover"`) warms them before navigation.

## Deployment (Cloudflare)

The site runs as a Cloudflare Worker with static assets (Workers Paid plan: the build has ~27k files, over the free plan's 20,000). Config: `apps/website/wrangler.jsonc`.

- **Pages and app code** are uploaded from `apps/website/build`. `static/_headers` marks `_app/immutable/*` immutable; everything else keeps the Workers default `public, max-age=0, must-revalidate` with an ETag.
- **The dataset and derived JSON are not uploaded with the Worker** (`static/.assetsignore` excludes them). They live in R2 bucket `pokemouille-data` under `data/manifest.json`, `data/revisions/...`, `learners/<revision>/...` and `breeding/<revision>/...`. `apps/website/worker/index.ts` serves those keys and retained `_app/immutable/*` chunks when no static asset matches. The manifest is `no-cache` with ETag/304; immutable objects use the edge Cache API (a no-op on `*.workers.dev`, active on a custom domain).
- **Retention:** R2 keeps every published revision, deployment's immutable chunks and derived learner/breeding JSON; nothing is garbage-collected. Storage planning must include all three.

`apps/website/scripts/r2.ts` moves files:

| Command                     | Effect                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sync`                      | Uploads missing revision files, `_app/immutable/*`, learner and breeding JSON (never overwrites differing content), then `data/manifest.json` last. |
| `data-pull`                 | Downloads the files listed in the R2 manifest into `static/data`, verifying each SHA-256.                                                           |
| `state-pull` / `state-push` | Restores / saves `.data/state` as `state/state.tar.gz` (not served by the Worker).                                                                  |

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
