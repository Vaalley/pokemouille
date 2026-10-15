# Pokémouille: product and implementation plan

**Status: design only. No implementation authorized.**

Build a multilingual, game-aware Pokémon reference. Start with Pokémon detail pages and instant global search; extend to moves, abilities, items, and other game entities as source coverage permits. Historical correctness and consistent navigation matter more than adding many pages early.

## 1. Agreed direction

| Decision                | Meaning                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| PokéAPI GraphQL         | Use PokéAPI's GraphQL interface for data access. Public versus locally hosted ingestion is not yet decided.                               |
| Game-aware content      | A global game selector, grouped by generation, drives the displayed data. Generation alone is insufficient.                               |
| Multilingual experience | Translate both game content and the website interface; language selection applies across navigation.                                      |
| Instant global search   | An always-available search control opens a modal; results are ranked locally, without per-keystroke API calls.                            |
| Shared cached data      | Prefer published, versioned snapshots over visitors querying PokéAPI directly. Preserve language, game, and form context in shared links. |

The first release is a complete Pokémon-detail experience, not an implementation of every future entity page. Favorites, accounts, team building, and collection tracking are not part of the agreed scope.

## 2. Global context and historical correctness

### Select games, grouped by generation

PokéAPI distinguishes a **generation**, a **version group** (related games), and a **version** (an individual game). Use a version group for rules shared by related games; retain an individual version where the displayed field requires it, such as encounters or Pokédex text. Do not present one game's version-specific data as applying to both.

The exact selector layout remains a UI decision. Its underlying context must be precise enough to resolve each displayed field.

### Keep these concepts separate

- **Species and forms/varieties:** one species can have multiple battle-relevant representations. Not every form is a separate species.
- **Identity and presentation:** stable entity IDs identify resources; localized names are display/search values, not primary keys.
- **Introduction and availability:** existing by a generation does not prove availability in a particular game. Absence of an encounter does not prove unavailability either.
- **Current and historical values:** modern types, stats, abilities, learnsets, and effects must not leak into older game contexts.
- **Missing states:** distinguish not introduced yet, unavailable in this game, missing source data, and missing translation. Report unavailability only when the data supports it.

Historical resolution belongs in a Pokémon-data module, not scattered page conditions. Resolve each field using its actual generation/version-group/version semantics; do not infer chronological rules from numeric IDs. Evolution requirements and type effectiveness also need historical handling if displayed.

PokéAPI documents historical data, but that is not a guarantee of complete history for every field or exposure through the current GraphQL schema. Unsupported facts must be marked as unknown or omitted with an explanation, not invented.

### URLs and preferences

The URL represents the entity, language, selected game, and selected form wherever those change the page's meaning. Navigating between related entities or opening a search result preserves that context. Browser Back/Forward restores it.

Precedence: explicit URL context → saved preferences → documented application defaults. The actual URL shape, initial language, and default game remain undecided. A shared URL must override the recipient's saved preferences.

Changing context recomputes all affected content. If a selected form did not exist in the new game, show that state and offer a valid alternative rather than silently retaining modern data. Older asynchronous results must not overwrite a newer selection.

## 3. Languages

Translate website controls, headings, accessibility labels, and status/error messages separately from PokéAPI's localized game content.

Proposed content fallback: requested language → English → canonical identifier/name. Mark fallback content where it would otherwise appear to be translated. A missing game-specific description may remain unavailable: language fallback must never silently substitute another game's mechanics or description.

Choose an explicit initial set of supported languages after auditing coverage. Do not promise that every PokéAPI language has complete names, descriptions, and effect text.

## 4. Instant global search

### Interaction

- Keep a search control accessible on every page; support Ctrl/Cmd+K.
- Typing outside editable controls opens the modal and retains the typed characters. Do not intercept shortcuts, contenteditable fields, or IME composition.
- Support arrow-key navigation, Enter to open, Escape to close, a focus trap, and focus restoration. Provide a usable mobile search control.
- Show loading, empty, and unavailable-data states explicitly. Load the compact index early, without blocking the page.
- Start with Pokémon destinations only. Add categorized move/ability/item results when those real pages exist; no dead result links.

### Search data and ranking

Download a compact index containing stable identity, entity kind, localized names, English aliases, destination information, and supported availability metadata. Do not download entire detail records to search names.

Normalize case, accents, punctuation, and whitespace without damaging the displayed names. Support National Pokédex numbers as well as names; do not confuse species numbers with form IDs. Exact matches rank first, followed by prefixes, word/substring matches, then typo-tolerant matches, with deterministic tie-breaking.

Use selected-language names plus English aliases initially. Proposed availability behavior: retain unavailable matches with a clear badge, ranking otherwise comparable available matches ahead. Do not conceal the distinction between unknown availability and known unavailability.

Partition indexes by language and, later, entity kind as payload measurements justify. Search remains local: typing, correcting a typo, and moving between results generate no upstream requests.

## 5. Caching, in plain terms

**Download Pokémon data once for our site, not once for every visitor.** A snapshot is a saved, validated copy of the data we need. A CDN is hosting that keeps copies near visitors. Browser caching lets the same device reuse files it already downloaded.

1. A controlled refresh job collects data from the chosen PokéAPI source.
2. It produces a complete snapshot: small search indexes and separately downloadable detail files.
3. Our hosting/CDN serves those files to visitors; visitors do not call PokéAPI.
4. Browsers reuse downloaded files. Repeated navigation and searching avoid fetching the same data again.
5. A later successful refresh publishes a new snapshot. A failed refresh leaves the previous working snapshot available.

This trades immediate upstream updates for predictable availability and far less pressure on PokéAPI. Reference data does not need to be fetched live on every visit. Refresh cadence is a deployment decision, not yet fixed.

### Important correction: caching does not remove ingestion limits

Using the public GraphQL server to build snapshots still consumes its request allowance. The official documentation currently describes **100 requests/hour/IP**, POST-only requests, and an approximately two-minute daily restart at **01:00 UTC**, plus possible maintenance. These are documented constraints, not measurements from a live service test. Server-side refresh jobs share their egress IP's budget. Standard CDN caching must not be assumed to cache GraphQL POST requests automatically. [S1]

Verified upstream options:

| Source                                   | Benefit                                                                                                            | Cost / decision status                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public GraphQL `v1beta2`                 | No database to operate; matches the chosen interface.                                                              | Rate-limited and subject to upstream downtime. Suitable for bounded exploration; a full refresh must be measured and budgeted.                           |
| Locally hosted PokéAPI + Hasura          | Keeps GraphQL while avoiding the public endpoint's request limit and restart schedule.                             | Official Docker Compose setup exists; adds database setup, metadata management, and refresh operations. Local schema compatibility must be checked. [S4] |
| Canonical CSV files in `PokeAPI/pokeapi` | Bulk relational source, including localization and historical tables, without querying the public GraphQL service. | Requires our own joins and transformations. An alternative only if we explicitly change the GraphQL-ingestion decision. [S2]                             |
| Static REST JSON in `PokeAPI/api-data`   | Downloadable API-shaped data without querying public GraphQL.                                                      | Requires working with REST-shaped relationships and checking snapshot freshness/coverage. Also an alternative, not an agreed source change. [S3]         |

Repository-based inputs avoid the public GraphQL service's limits, not all network limits; retrieve pinned source revisions in bulk rather than issuing one GitHub request per row/resource.

**Recommendation:** retain GraphQL as agreed. Compare bounded public ingestion with local Hasura during the data audit before committing to the production refresh mechanism. Do not assume the public endpoint can support rebuilding the entire dataset. CSV/JSON sources remain explicit alternatives, not silent replacements.

### Snapshot and browser rules

- Publish immutable, content-versioned files with long cache lifetimes; use a small revalidated manifest to identify the current snapshot. Record source revision when available, retrieval time, and output-schema version.
- Validate the whole snapshot before switching the manifest. Keep prior files available for active clients; search and details in one browsing session must use a compatible dataset revision.
- Keep source facts independent of presentation where practical. Key derived results by dataset revision, entity identity, language, version group, individual version when relevant, and form—only omitting dimensions proven irrelevant to that result.
- Deduplicate concurrent identical fetches and bound in-memory retention. Prefer normal HTTP caching initially; IndexedDB or a service worker is not required without a demonstrated need.
- For ingestion, bound concurrency and pagination, persist successful work, check GraphQL errors even on HTTP 200, and stop/back off on throttling. Never publish an error response as valid data or create an automatic retry storm.

Request artwork/sprites only as needed and use their HTTP caching; avoiding GraphQL traffic does not make media bandwidth free. Full offline operation is not part of this scope.

## 6. Module responsibilities and first page

Keep the existing Vite+ monorepo. The website currently uses plain TypeScript and CSS; no framework, router, translation library, or GraphQL client has been selected.

| Module         | Responsibility                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data ingestion | GraphQL queries, schema-derived types, bounded refreshes, validation, and snapshot publication. Keep independent of rendering.                                |
| Pokémon data   | Stable identities, historical resolution, localization fallback, availability, and search-index preparation. A small interface hides source-table complexity. |
| Website        | URL/preferences, global controls, local search interaction, accessible rendering, and data loading.                                                           |

Introduce shared packages only where they provide real locality or reuse. The current `packages/utils` is starter boilerplate, not an established domain layer. Do not build a universal entity engine in anticipation of future pages.

Proposed initial detail-page content, subject to the audit:

- Localized identity, National Pokédex number, artwork, and relevant form selection.
- Correct-context types, base stats, abilities, and basic physical/species information.
- Localized Pokédex text with its actual game/version provenance.
- Evolution information and a game-specific learnset, with supported methods/levels.
- Explicit loading, failure, missing-data, and unsupported/unavailable-context states; responsive and keyboard-accessible layout.

Moves and abilities can be described on the Pokémon page before separate detail routes exist. Do not render links to unfinished destinations. Artwork is illustrative unless an asset is explicitly identified as game-specific.

## 7. Rough implementation plan

**Do not start these phases until implementation is authorized.** Each phase has an observable completion condition, not just scaffolding. Later entity pages are outside this initial sequence.

| Phase                                     | Work                                                                                                                                                                                                                                                                                                                                     | Complete when                                                                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Audit data and settle open choices     | Inspect `v1beta2` schema; map species/forms, languages, histories, and game context. Compare public/local GraphQL ingestion and measure a representative payload. Choose supported languages, default context, URL shape, and frontend tools. Address the previously observed Vite+ execution failure before running development checks. | A small representative dataset demonstrates the required distinctions; coverage gaps and the ingestion budget/hosting decision are explicit.                        |
| 2. Build the data pipeline                | Implement bounded ingestion and the Pokémon-data module; generate versioned search/detail assets and a manifest. Resolve historical/localized values without depending on page code.                                                                                                                                                     | Generated output proves the audit cases, a failed refresh preserves the last good publication, and repeated work reuses successful cached input.                    |
| 3. Deliver a working Pokémon detail route | Build the responsive page, translations, game/language/form controls, URL restoration, and snapshot loading.                                                                                                                                                                                                                             | A direct/shared URL renders correct content; context switches and Back/Forward work; missing data is not replaced with misleading modern values.                    |
| 4. Deliver global search                  | Generate localized indexes; implement ranking, modal, keyboard/mobile interaction, and context-preserving navigation.                                                                                                                                                                                                                    | Names, English aliases, numbers, and typos resolve correctly; typing triggers no upstream calls; selection reaches a real Pokémon page.                             |
| 5. Verify the end-to-end release          | Exercise real desktop/mobile surfaces, accessibility, network/cache behavior, and refresh failure; cover risky data transitions with deterministic regression tests. Run applicable Vite+ checks, tests, and builds, and document operation/refreshing.                                                                                  | The full Pokémon journey works from a cold visit and repeat visit, with correct context, bounded requests, and a usable last-good snapshot during upstream failure. |

### Required audit and regression cases

1. **Types and stats:** Clefairy before/after Fairy introduction and a documented base-stat change; inspect Generation I stat representation rather than assuming the modern six-stat model always applies.
2. **Abilities and forms:** Gengar's historical ability change; a battle-relevant form with different types/availability, such as a Rotom appliance form.
3. **Learnsets and text:** compare games within one generation; confirm field-specific version selection and missing-translation behavior.
4. **Availability and navigation:** inspect a not-yet-introduced species and an unavailable/unknown game context; verify shared links, form changes, and Back/Forward preserve meaning.
5. **Caching and failure:** verify no per-keystroke requests, in-flight deduplication, dataset consistency, repeat-visit reuse, and no manifest replacement after an invalid refresh.

These are validation targets, not claims that the current GraphQL schema already covers every case. Use real-app smoke checks for interactions and network evidence; permanent tests should target consumer-visible rules and failures, not markup wording or implementation wiring.

## 8. Open decisions

- **Ingestion deployment:** public GraphQL with a demonstrated budget, or local Hasura; bulk CSV/JSON only if explicitly approved instead.
- **Product defaults:** supported language list, initial game/language, precise game-selector behavior, and availability ranking policy.
- **Frontend tools and visual design:** choose after the data audit; do not mistake the earlier field-guide suggestion for an approved design.
- **Operations:** hosting/CDN, refresh cadence, snapshot retention, and media delivery, informed by measured output size.

## Sources

- **[S1]** [PokéAPI GraphQL documentation](https://pokeapi.co/docs/graphql): current public endpoint, version changes, fair-use policy, documented limits and downtime.
- **[S2]** [Canonical CSV directory](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv): source tables, including historical stats/types/abilities, names, learnsets, and game mappings.
- **[S3]** [PokeAPI/api-data](https://github.com/PokeAPI/api-data): official repository describing static REST JSON, schemas, and its updater.
- **[S4]** [PokéAPI setup and GraphQL instructions](https://github.com/PokeAPI/pokeapi#graphql): Docker Compose, database build, and local Hasura setup.
- **[S5]** [PokéAPI resource documentation](https://pokeapi.co/docs/v2) and [current GraphQL examples](https://github.com/PokeAPI/pokeapi/tree/master/graphql/v1beta2/examples): domain terminology, history/localization semantics, and query examples. REST documentation informs the audit; it does not establish GraphQL coverage.
