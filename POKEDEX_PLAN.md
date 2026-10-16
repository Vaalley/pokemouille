# Pokémouille: product and implementation plan

**Status: phases 1–5 complete. The data pipeline, Pokémon-data module, localized Pokémon detail route, and instant global search are implemented and release-verified locally. Hosting is Cloudflare Workers Paid + R2 with a GitHub Actions deploy/refresh workflow (README “Deployment”), verified locally with `wrangler dev` but not yet deployed; visual design remains open (§8).**

Build a multilingual, game-aware Pokémon reference. Start with Pokémon detail pages and instant global search; extend to moves, abilities, items, and other game entities as source coverage permits. Historical correctness and consistent navigation matter more than adding many pages early.

## 1. Agreed direction

| Decision                | Meaning                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PokéAPI GraphQL         | Use the public `v1beta2` endpoint for controlled ingestion. Avoid Docker and database operations; CSV/REST sources are alternatives only with explicit approval.         |
| Game-aware content      | Target all main-series releases, including remakes, Let's Go, and Legends. Group the game selector by generation; default to **Scarlet**. Expose source gaps honestly.   |
| Multilingual experience | Support **English, French, and Japanese**, including translated interface controls. Language selection applies across navigation.                                        |
| Instant global search   | An always-available search control opens a modal; results are ranked locally, without per-keystroke API calls.                                                           |
| Shared cached data      | Publish versioned snapshots on static hosting. Refresh **weekly, with a manual refresh option**, independently of website deployments. Preserve context in shared links. |

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

Use `/{lang}/pokemon/{speciesId}/`, with exact individual game and form in query parameters; for example `/fr/pokemon/479/?version=platinum&form=rotom-wash`. Map the stable `pokemonform.name` to its form and Pokémon-variety IDs; do not conflate them with the species ID. Derive generation/version group from the selected version rather than encoding contradictory values.

Game precedence: explicit URL → saved valid preference → **Scarlet**. Language: an explicit supported URL wins; on `/` only, use saved preference → supported browser language → **English**. Provide ordinary language links on that root entry page. Never redirect an explicit localized share link to the recipient's preferred language. Materialize resolved game/form context into detail-navigation and share URLs.

Changing context recomputes all affected content. If a selected form did not exist in the new game, show that state and offer a valid alternative rather than silently retaining modern data. Older asynchronous results must not overwrite a newer selection.

## 3. Languages

Translate website controls, headings, accessibility labels, and status/error messages separately from PokéAPI's localized game content.

Content fallback: requested language → English → canonical identifier/name. For Japanese, try `ja` first, then the kana variant `ja-hrkt` before English. Preserve actual source-language metadata and label fallbacks where needed. Never substitute another game's description merely to obtain translated text.

The launch language set is **en, fr, ja**. UI translations are our responsibility. Species names are complete for the audited dataset, but descriptions and detailed effect prose are not; see the phase-one evidence below.

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

This trades immediate upstream updates for predictable availability and far less pressure on PokéAPI. Refresh **weekly**, with a manual refresh option for important changes. Website builds reuse the last validated snapshot rather than triggering a new ingestion.

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

**Phase-one decision:** use public GraphQL ingestion because the user prefers no Docker or database operations. A measured 10,000-row learnset batch succeeds; the learnset table alone requires 64 such requests. Use resumable, budgeted ingestion rather than assuming a full refresh fits comfortably in one hour. Local Hasura and CSV/JSON remain documented alternatives, not selected dependencies.

### Snapshot and browser rules

- Publish immutable, content-versioned files with long cache lifetimes; use a small revalidated manifest to identify the current snapshot. Record source revision when available, retrieval time, and output-schema version.
- Validate the whole snapshot before switching the manifest. Keep prior files available for active clients; search and details in one browsing session must use a compatible dataset revision.
- Keep source facts independent of presentation where practical. Key derived results by dataset revision, entity identity, language, version group, individual version when relevant, and form—only omitting dimensions proven irrelevant to that result.
- Deduplicate concurrent identical fetches and bound in-memory retention. Prefer normal HTTP caching initially; IndexedDB or a service worker is not required without a demonstrated need.
- For ingestion, bound concurrency and pagination, persist successful work, check GraphQL errors even on HTTP 200, and stop/back off on throttling. Never publish an error response as valid data or create an automatic retry storm.

Request artwork/sprites only as needed and use their HTTP caching; avoiding GraphQL traffic does not make media bandwidth free. Full offline operation is not part of this scope.

## 6. Module responsibilities and first page

Keep the Vite+ monorepo. Use **Svelte + SvelteKit + TypeScript with `adapter-static`**, localized species routes, and browser-resolved game/form panels. Use schema-derived GraphQL operation types and plain `fetch` during ingestion; no browser GraphQL client is needed for snapshot files. Start UI messages with typed en/fr/ja dictionaries and native `Intl`; adopt a localization library only if message complexity or translation workflow warrants it.

Prerender localized species identity and navigation, **not default-game mechanics**: a static host cannot return different HTML for different query strings. All context-sensitive content starts in an explicit loading state, then renders after URL/preferences are resolved. This also applies when the URL lacks a game, because saved preferences can differ. Avoid an incorrect-data flash; do not prerender form-dependent artwork as if it were universally valid. Provide a no-JavaScript explanation. The user accepts this static-hosting tradeoff: game/form details require JavaScript and are not guaranteed in crawler previews.

Enumerate supported locale/species routes and keep static-adapter completeness checks enabled. Do not use a catch-all SPA fallback merely to conceal missing prerendered routes. Exact SvelteKit/Vite+ integration must be smoke-verified when implementation is authorized; package metadata alone is not a build proof.

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

**Phases 1–5 are complete.** Each implementation phase needs an observable completion condition, not just scaffolding. Later entity pages are outside this initial sequence.

| Phase                                                | Work                                                                                                                                                                                                                                                                       | Complete when                                                                                                                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Audit data and settle open choices — complete     | Live schema, representative historical/localized records, game coverage, payload size, and request budget audited. Preferences, URL/defaults, public ingestion, and static SvelteKit delivery selected. Windows launcher failure diagnosed; direct CLI health checks pass. | Evidence and limitations are recorded below. This does not claim complete historical coverage, a fixed global launcher, or an exercised Svelte application build.                          |
| 2. Build the data pipeline — complete                | Implemented typed bounded ingestion, durable cache/budget, historical/localized resolution, immutable search/detail/chain assets and atomic publication.                                                                                                                   | Live published output proves the audit cases; a deliberate failed refresh preserved the manifest bytes and revision. Cached publication reuses successful input without upstream requests. |
| 3. Deliver a working Pokémon detail route — complete | SvelteKit 3 static site: prerendered localized identity for 3 × 1,025 species, browser-resolved game/form panels, en/fr/ja UI, language links and grouped game selector, session-pinned snapshot loading. Visual design deferred (minimal layout CSS).                     | Verified in a browser against the production build; see §11.                                                                                                                               |
| 4. Deliver global search — complete                  | Per-language indexes (selected language + English aliases), pure local ranking module, native `<dialog>` combobox in every `/[lang]/` header, Ctrl/Cmd+K and type-to-open, introduction badges for the selected game, context-preserving links.                            | Verified in a browser against the production build; see §12.                                                                                                                               |
| 5. Verify the end-to-end release — complete          | Exercised desktop and touch-mobile surfaces, accessibility semantics, cold/repeat network and cache behavior with production headers, and a failing refresh; added loader and localization regression tests; fixed two defects found.                                      | Verified locally; see §13. Real hosting and CI scheduling stay open until a provider is chosen.                                                                                            |

### Required audit and regression cases

1. **Types and stats:** Clefairy before/after Fairy introduction and a documented base-stat change; inspect Generation I stat representation rather than assuming the modern six-stat model always applies.
2. **Abilities and forms:** Gengar's historical ability change; a battle-relevant form with different types/availability, such as a Rotom appliance form.
3. **Learnsets and text:** compare games within one generation; confirm field-specific version selection and missing-translation behavior.
4. **Availability and navigation:** inspect a not-yet-introduced species and an unavailable/unknown game context; verify shared links, form changes, and Back/Forward preserve meaning.
5. **Caching and failure:** verify no per-keystroke requests, in-flight deduplication, dataset consistency, repeat-visit reuse, and no manifest replacement after an invalid refresh.

These are validation targets, not claims that the current GraphQL schema already covers every case. Use real-app smoke checks for interactions and network evidence; permanent tests should target consumer-visible rules and failures, not markup wording or implementation wiring.

## 8. Open decisions

- **Presentation:** visual direction, layout, and the precise grouped game-selector interaction. The earlier field-guide suggestion is not an approved design.
- **Source gaps:** genuinely game-specific evolution applicability and special game-mechanics rules need sufficient evidence; no guessed inheritance, availability, or modern-data substitutions. Additional curated sources require agreement before they become product data.
- **Operations:** static hosting/CDN provider, CI refresh runner, persisted ingestion state, snapshot retention, and media delivery. Weekly/manual refresh and no Docker/database operations are already decided.
- **Tool integration:** validate the selected SvelteKit/Vite+ combination and resolve TypeScript peer compatibility during authorized package integration; do not suppress incompatible peers.

## 9. Phase-one evidence and implementation constraints

### What was actually exercised

Issued **8 bounded POST requests** to `https://graphql.pokeapi.co/v1beta2`: two introspection queries, a census, per-game coverage, the compact species/name index, a 50-Pokémon detail batch, a 10,000-row learnset batch, and a combined historical/localization probe. All returned HTTP 200 without GraphQL errors. No full ingestion, website build, UI smoke run, or application tests were performed.

Observed totals: **1,025 species; 1,351 Pokémon representations; 1,579 forms; 638,321 learnset rows; 32 version groups and 53 individual versions**. Some listed groups are DLC or side titles, so the product's main-series selector must not blindly include every upstream group.

### Historical and localization results

| Case                            | Live result                                                                                                                                                       | Consequence                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clefairy                        | Normal through Generation V; current type Fairy.                                                                                                                  | Historical generation markers are inclusive upper bounds, not introduction generations.                                                           |
| Gengar and absent ability slots | Levitate through Generation VI, then Cursed Body. Bulbasaur/Pikachu hidden-slot histories explicitly contain null through Generation IV.                          | Resolve ability history per slot; null means previously absent, not missing history. Also distinguish games that do not use a mechanic.           |
| Pikachu stats and Generation I  | Defense 30 and Special Defense 40 through Generation V, versus current 40/50. Generation I has separate stat ID 9, Special 50.                                    | Historical stat rows are sparse changes. Merge per stat, then select the era's layout; do not show modern Special Attack/Defense in Generation I. |
| Rotom appliances                | Wash Rotom is Electric/Ghost through Generation IV, then Electric/Water. The appliance forms report `is_battle_only:false`.                                       | Mechanically relevant forms are not equivalent to the `is_battle_only` flag. Resolve the actual variety/form and its history.                     |
| Same-generation learnsets       | Pikachu learns Quick Attack at level 16 in Red/Blue, level 11 in Yellow. Thunderbolt appears as level-up at 26 in Yellow but not in the Red/Blue level-up result. | Generation alone cannot select the learnset. Absence in one learning method does not mean the move is wholly unavailable.                         |

The inclusive history semantics are documented in [PokéAPI's historical type, ability, and stat definitions](https://pokeapi.co/docs/v2#pokemontypepast). Evolution version fields have different semantics; do not reuse that resolver for them.

The same probes establish two introduction checks: Sylveon is species **700**, introduced in **Generation VI**, so Red cannot represent an existing Sylveon; Wash Rotom is Pokémon variety **10009**, form **10059**, first version group **9 (Platinum)**, while base Rotom starts in group **8 (Diamond/Pearl)**. A generation-only form filter would incorrectly make Wash Rotom available earlier within Generation IV. Introduction checks still do not prove obtainability in every later game.

Every audited species has a nonempty name row in **English (9), French (5), Japanese (11), and kana Japanese (1)**. Japanese uses the UI locale `ja`, never `jp`; retain both upstream variants for search/fallback. For Clefairy's Alpha Sapphire text, ID 1 begins `まんげつの…`, whereas ID 11 begins `満月の…`.

Descriptions are not comparably complete:

- Clefairy's Red and Platinum text exists only in English among these variants; Black adds French; Alpha Sapphire has all four rows.
- Levitate/Cursed Body names exist in all four variants, but their detailed effect prose exists only in French/English. Across the entire `abilityeffecttext` table, the observed language IDs are **5, 6, 9**: no Japanese rows.
- Their ORAS in-game ability flavor text does include Japanese. This is a separate field, not proof that detailed Japanese effect prose exists.

### Known game coverage gaps

These counts concern **learnset rows** and **species flavor-text rows filtered to language IDs 1, 5, 9, 11**, not a universal availability test:

| Upstream game/group                                           | Learnset rows | Scoped species text rows |
| ------------------------------------------------------------- | ------------: | -----------------------: |
| Scarlet/Violet                                                |        54,658 |                      240 |
| Legends: Arceus                                               |         2,230 |                      241 |
| Brilliant Diamond/Shining Pearl                               |        24,797 |                        0 |
| Legends: Z-A / Mega Dimension                                 |        0 each |                   0 each |
| Isle of Armor / Crown Tundra / Teal Mask / Indigo Disk groups |        0 each |                   0 each |

Base-game rows may incorporate updates, but zero rows in a DLC group do not establish an inheritance rule or a complete expansion dataset. Keep the all-main-series target; mark unsupported fields honestly. A listed game/version is not proof of a complete Pokémon page for that release.

### Evolution is the largest correctness gap

Live Leafeon/Glaceon records include location-based methods for specific introduction groups and Sword/Shield item methods marked `is_default:true`. No explicit records were returned for Platinum, HGSS, B2W2, or BDSP for these targets.

[The official evolution documentation](https://pokeapi.co/docs/v2#evolutiondetail) and [merged field-design discussion](https://github.com/PokeAPI/pokeapi/pull/1558#issuecomment-4770457154) establish that `version_group_id` describes method introduction, while `is_default` represents the latest main-generation expectation. Neither supplies a complete game-applicability matrix. The serializer returns the rows; it does not resolve a requested game.

**Do not apply the latest default backward, or infer every game's method from the preceding numeric/version order.** Initially expose source-contextualized methods and an explicit unknown state where game-specific applicability is not established. Comprehensive game-filtered methods require an accepted applicability source/curated mapping; this limitation must remain visible rather than being presented as solved.

Similarly, generation histories alone do not describe every game's battle system. Official pages confirm [Arceus's action order and Agile/Strong styles](https://legends.arceus.pokemon.com/en-us/gameplay/) and [Z-A's Mega Evolution](https://legends.pokemon.com/en-us/mega-pokemon). They do not establish conventional ability behavior in those games. The audit did not find first-party textual proof for unused abilities in Let's Go/Arceus; treat that particular rule as requiring an accepted source or game/manual observation, not as verified merely because species pages omit abilities.

### Payload measurements and refresh budget

The following are exact serialized response sizes from successful queries. Gzip sizes were computed locally, **not measured on the wire**. Single-request latencies are observations, not performance guarantees.

| Payload                                                                                                         |  Rows sampled | JSON bytes | Local gzip bytes | Observed request ms |
| --------------------------------------------------------------------------------------------------------------- | ------------: | ---------: | ---------------: | ------------------: |
| Species search projection, four name variants and default Pokémon IDs                                           | 1,025 species |    280,476 |           38,332 |                 416 |
| Core detail projection, including names/current values/histories/forms but no learnsets, descriptions, or media |    50 Pokémon |     71,690 |            6,053 |                 486 |
| Flat learnset projection                                                                                        |        10,000 |  1,261,285 |           65,101 |                 603 |

The measured search projection excludes a full alternate-form index and game availability, so this is a useful baseline, not the final index's promised size.

The successful learnset query used:

```graphql
query PhaseOneLearnsetBatch {
  pokemonmove(order_by: { id: asc }, limit: 10000) {
    id
    pokemon_id
    move_id
    version_group_id
    move_learn_method_id
    level
    order
    mastery
  }
}
```

For production, continue with `where: { id: { _gt: lastId } }`; do not repeatedly scan offset pages. **64 requests** is the calculated lower bound for that table at the measured batch size, excluding every other entity/query and any retries. It does not prove a complete refresh fits into 100 calls.

Selected operating constraints:

1. Budget at most **60 requests per rolling hour** for ingestion, reserving headroom under the documented 100/hour/IP limit. Other users/jobs sharing the IP still count; obey throttling and stop instead of assuming the reservation guarantees access.
2. Resume across budget windows, saving successful pages and cursors outside an ephemeral CI workspace. A fresh all-game refresh must not be required to finish in one window. Start serially; no parallel full-table extraction.
3. Run weekly or manually, with one refresh writer at a time. A website deployment consumes the published snapshot without spending the ingestion allowance.
4. Validate completeness, key relationships, GraphQL errors, and required projections before publishing. Paginated reads are **not an upstream transactional snapshot**; flag source changes detected during a run and do not claim a source revision the service never provided.
5. Pin one dataset manifest per browsing session, retain previous assets, and switch publication only after validation. The remaining tables' batch sizes and total transfer volume must be measured as the actual phase-two pipeline is implemented.

### Frontend/toolchain compatibility and Windows blocker

[SvelteKit documents](https://svelte.dev/docs/kit/page-options#prerender-When-not-to-prerender) that prerendered content is shared and `url.searchParams` cannot be read during prerendering. This is why the chosen static architecture renders only game/form-independent identity initially, with correctly contextualized panels after browser initialization.

Registry metadata checked: [SvelteKit 3.1.0](https://registry.npmjs.org/@sveltejs/kit/3.1.0), [Svelte Vite plugin 7.3.1](https://registry.npmjs.org/@sveltejs/vite-plugin-svelte/7.3.1), and [svelte-check 4.7.6](https://registry.npmjs.org/svelte-check/4.7.6). [Vite+ core 1.2.0](https://registry.npmjs.org/@voidzero-dev/vite-plus-core/1.2.0) reports bundled **Vite 8.3.4**, within the inspected Kit/plugin Vite peer ranges. **The starter's TypeScript 7 is outside SvelteKit's optional TypeScript `^6.0.0` peer and svelte-check's `^5 || ^6` peer.** Use a supported TypeScript 6 compiler-API dependency for Svelte tooling; keep any native compiler tool separate if needed. Do not simply install latest packages and suppress peers. This is metadata validation, not an exercised integration/build.

The earlier launcher failure was diagnosed without rerunning the known failing command:

- Windows resolves error **448** as “The path cannot be traversed because it contains an untrusted mount point.”
- The Vite+ `data/current` path is a Windows junction to the installed `data/1.2.0` directory.
- Running the installed executable directly succeeded: `"C:/Users/Val/AppData/Local/vite-plus/data/1.2.0/bin/vp.exe" --version` reported **vp 1.2.0** and managed **Node 24.22.0**; the same executable's `env doctor` reported **All checks passed**.
- The normal shim/junction is **not repaired**. No junction, security settings, global installation, application source, or dependency files were changed. Direct executable invocation is the verified diagnostic workaround; installs/builds through it remain untested.

Phase 2 can use the direct executable for authorized dependency setup, then prove the actual install and Svelte integration. If subprocess shims still hit the restricted junction, investigate that specific path rather than weakening Windows security.

## Sources

- **[S1]** [PokéAPI GraphQL documentation](https://pokeapi.co/docs/graphql): current public endpoint, version changes, fair-use policy, documented limits and downtime.
- **[S2]** [Canonical CSV directory](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv): source tables, including historical stats/types/abilities, names, learnsets, and game mappings.
- **[S3]** [PokeAPI/api-data](https://github.com/PokeAPI/api-data): official repository describing static REST JSON, schemas, and its updater.
- **[S4]** [PokéAPI setup and GraphQL instructions](https://github.com/PokeAPI/pokeapi#graphql): Docker Compose, database build, and local Hasura setup.
- **[S5]** [PokéAPI resource documentation](https://pokeapi.co/docs/v2) and [current GraphQL examples](https://github.com/PokeAPI/pokeapi/tree/master/graphql/v1beta2/examples): domain terminology, history/localization semantics, and query examples. REST documentation informs the audit; it does not establish GraphQL coverage.

## 10. Phase-two implementation

Implemented `packages/pokemon-data` (pure historical/localization resolution, main-series/DLC metadata, validation, search projections) and `tools/data` (typed GraphQL ingestion, durable cache/rate ledger, resumable extraction, schema acquisition, and atomic immutable publication). Operational commands and limitations are in the root README.

The live extraction used 44 serial data requests: two censuses, one reference query, and 41 bounded pages of 25 species. This replaces the earlier flat-table budget estimate without raising the 60/hour cap. All child collections were checked against independent aggregates; before/after counts and maximum IDs matched. This does not prove transactional upstream consistency.

Published a complete local dataset containing 1,025 species, 1,351 Pokémon representations, 1,579 forms, and 638,321 learnset rows. Generated search indexes support en/fr/ja, detail assets remain locale-independent, and derived evolution-chain assets avoid loading every species to discover branches. Output and request state are ignored generated files, not committed datasets.

Real data corrected two assumptions: item identifiers are not unique (Roseli Berry IDs 723 and 2279), and some Koraidon/Miraidon representations have a single form with no default flag. Numeric identity remains validated; unambiguous single-form selection does not depend on that flag. Context-keyed version/form identifiers remain checked for ambiguity.

TypeScript dependencies now share the supported TypeScript 6 catalog. On this restricted Windows runtime, copied/hoisted dependencies with workspace auto-hoisting disabled permit a successful install/prepare. The global `current` junction remains unchanged; direct versioned Vite+/Node paths were used for verification. No Windows security settings were modified.

Weekly/manual refresh commands are implemented, but no CI scheduler or external deployment has been configured: the provider remains undecided. Existing history, translation, DLC-coverage, evolution-applicability, and game-specific-mechanics limitations remain explicit; current-only physical/species scalars are labeled rather than presented as historical facts.

### Phase-two verification

- `vp check --fix`: no warnings, lint errors, or type errors. `vp test`: 34 tests passed. Recursive workspace builds passed, including the unchanged starter website and library declaration output.
- Real published files demonstrated Clefairy's historical typing, Gengar's generation VI/VII ability change, Pikachu's Generation I Special stat, Wash Rotom's Diamond/Platinum introduction distinction, Sylveon not existing in Red, and exact-game French fallback. Eevee's chain asset contained all nine expected members.
- Stopped the real extraction after three requests and resumed from durable pages. After fixing format-dependent cache identity, validated/rekeyed the development cache once; `refresh --max-requests 0` and `data:publish` both published with **zero new requests** and the same semantic revision. Repeated this after formatting and with ignored `schema.json` temporarily absent.
- A real CLI refresh against a local HTTP endpoint returning GraphQL errors exited with failure after one request. The published manifest remained byte-for-byte unchanged, including its dataset revision. The throwaway failure state was removed.

The phase-two published dataset revision was `04435196ba99db927adc9d142d154a2f76da2510b7754efd72a6237fa39ee1ab`. Source hashes/census agreement are provenance checks, not claims of exhaustive game accuracy.

## 11. Phase-three implementation

`apps/website` is now SvelteKit 3.1 + Svelte 5 + `adapter-static` (strict; no SPA fallback). Kit 3 configuration lives in `apps/website/vite.config.ts`; app imports use `#lib/*` subpath imports; the Pokémon-data package is imported by relative path (no workspace-package link). Published data moved from `public/data` to `static/data`.

- `#lib/data/loader.ts`: session-pinned manifest (revalidated), in-flight deduplication, bounded LRU for species/evolution assets, typed `DataError`.
- `#lib/data/context.ts`: game precedence explicit URL → saved preference → Scarlet; an unrecognized `?version=` is reported, not silently accepted; root language: saved → browser primary subtag → English.
- Detail route: prerender emits only identity/navigation; all game/form content waits for the resolved context, and stale async results cannot overwrite newer selections.
- **Presentation is intentionally unstyled** (user decision): semantic markup and layout-only CSS until a UI component library is chosen.

### Phase-three verification

Against the production build (`vp preview`) in Chromium: Wash Rotom in Platinum is Electric/Ghost; Wash/Heat Rotom in Diamond and Sylveon in Red show not-introduced states with no stats and a valid-game link; Pikachu/Clefairy in Red show the Generation I Special layout and no abilities; an invalid `?version=` shows a notice and Scarlet. Game and form changes update the URL; Back/Forward restore the previous context. Evolution and language links preserve game/query. Root `/` redirects to the saved language; the home list contains 1,025 species. Two game switches issued no new data requests; navigating to Raichu fetched only `pokemon/26.json`. Prerendered `/fr/pokemon/479/` contains French identity and no game-specific data.

Real-data fix: Rotom's default form is named only in French, so English showed the identifier `rotom`; form names now fall back to the species name (regression test added; dataset republished offline as revision `09322b99…`). Generation I Special has no PokéAPI localized name; the UI supplies its own en/fr/ja label.

Gates: `vp check`, `vp test` (50 tests), `vp run -r build` (3,075 detail pages prerendered) all pass. Known limitation: `references.json` is ~1.9 MB uncompressed and loaded once per session; Pikachu's detail file is ~500 KB. Splitting is a phase-5 measurement topic.

## 12. Phase-four implementation

- `packages/pokemon-data`: `introductionStatus` is exported and used by both detail resolution and search badges, so they cannot disagree. Search aliases are limited to the selected language's names (Japanese: standard + kana) plus English; other languages are no longer indexed. Dataset republished offline (0 requests) as revision `7ef42daa…`. Index sizes (raw / gzip): en 620 KB / 55 KB, fr 659 KB / 66 KB, ja 680 KB / 68 KB.
- `apps/website/src/lib/search/rank.ts`: pure ranking. Normalization: NFKC, lowercase, Latin diacritics only (kana voicing marks kept), katakana→hiragana, ♀/♂→f/m, punctuation/space removal plus word tokens. Tiers: species number (`25`, `#025`, `No.25`; never Pokémon/form IDs) → exact → prefix → substring → typo (restricted Damerau-Levenshtein, ≤1 for 4–7 chars, ≤2 from 8; none under 4). Ties: matched field, introduced before not-introduced, default form, species/Pokémon/form IDs.
- `SearchDialog.svelte`: header button (also the mobile entry point), Ctrl/Cmd+K from anywhere, printable keys outside editable controls open the dialog with the typed character; IME composition and modified keys are ignored. Arrow keys/Enter/Escape, focus restoration, `aria-live` status for loading/hint/no-results/error-with-retry. The index loads at idle time; typing fetches nothing. Results link with the selected game and, for non-default forms, `form`; not-introduced/unknown results keep a text badge and are never hidden.

### Phase-four verification

Against the production build in Chromium: Ctrl+K opens with focus in the input, Escape restores focus to the previously focused game select; typing `m` on the page opens the dialog seeded with `m`; letters in the select, Ctrl+C, and a composing keydown do not open it. `25`, `#025`, `No.25` → Pikachu first; `10059` → no results; `pikachi`, `bulbasuar`, `Wash Rotom`, `evoli`, `mr mime`, `farfetchd`, `nidoran f` resolve correctly in French; `ぴかちゅう`, `ピカチュウ`, half-width `ﾋﾟｶﾁｭｳ`, and `pikachu` resolve in Japanese. `motisma lav` + Enter in Diamond navigated to `/fr/pokemon/479/?version=diamond&form=rotom-wash` with a "not introduced" badge; Back restored the previous URL. Seven successive queries produced no new data requests. A blocked index showed the error state; "Try again" recovered. A 390 px desktop-pointer viewport was checked here; real touch emulation is in §13. Eevee's Sword evolution section links all 8 evolutions.

Gates: `vp check`, `vp test` (78 tests), `vp run -r build` pass.

## 13. Phase-five release verification

All checks ran against `apps/website/build`. Cache behavior was measured with a throwaway local static server that applies the README hosting headers (manifest `no-cache` + ETag; `revisions/*` and `_app/immutable/*` `max-age=31536000, immutable`). `vp preview` sends neither header, so it cannot show repeat-visit reuse.

### Journeys and network

| Visit                                                                | Data requests                                                                                                    |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Cold, empty cache: `/en/pokemon/25/?version=red`                     | manifest, `references.json`, `pokemon/25.json`, `evolution/10.json` (200); `search/en.json` at idle time         |
| Repeat, new document: `/en/pokemon/26/?version=red`                  | manifest 304; only `pokemon/26.json` downloaded; references, search, chain, and 21 app chunks from browser cache |
| Revisit `/en/pokemon/25/?version=red`                                | manifest 304; everything else from cache                                                                         |
| `/` → `/fr/`, Rotom Wash in Platinum, game → Diamond, search `evoli` | game switch: 0 requests; typing: 0 requests; Enter → `/fr/pokemon/133/?version=diamond` (`pokemon/133` + chain)  |

Pikachu in Red shows the Generation I Special stat. Loader regression tests prove in-flight deduplication, eviction of failed loads, no pinning of a failed manifest, and revision pinning across a changed manifest.

### Refresh failure

With copies of the real state and output in a temporary directory, `refresh --fresh --endpoint http://127.0.0.1:9/graphql --max-requests 1` exited **1** (`fetch failed`). The manifest SHA-256 was unchanged (`a5596137…`), and the failed attempt counted against the persisted budget (`used: 1`). The website never calls PokéAPI; it keeps serving the last-good snapshot. `publish.test.ts` covers invalid, truncated, and corrupt-asset refreshes.

### Mobile and accessibility

- Pixel 5 emulation, where `(pointer: coarse)` matches and `(pointer: fine)` does not. The search button is 361 × 44 px and shows no Ctrl+K hint. The dialog fits a 393 px viewport, and the page has no horizontal overflow. Tapping the button and then a result navigates with the game preserved; Back restores the URL and the game.
- Defect fixed: result links were inline, and the introduction badge sat outside them, so tapping blank row space or the badge did nothing. The link now fills the row (`flex: 1 1 auto`) and contains the badge, so the badge is also part of the link's accessible name. Tapping the "Pas encore apparu dans Diamant" badge opens Eevee's Partner form in Diamond.
- en/fr/ja detail pages:
  - document language, title, and a single `h1` are correct; headings are ordered;
  - one `main`; a skip link comes first in the tab order;
  - every visible control has an accessible name; the four data tables have captions and header cells;
  - every focused control showed a focus outline over 12 Tab stops.
- Defect fixed: the Japanese-only Red/Green/Blue now read "Red (Japan)", "Rouge (Japon)", and "赤（日本版）". One helper (`localizeVersion`) labels games everywhere; the 41 options are unique in each language.

### Payloads (raw / gzip / brotli)

| File                    | Size                      |
| ----------------------- | ------------------------- |
| `manifest.json`         | 313 KB / 82 KB / 61 KB    |
| `references.json`       | 1.90 MB / 262 KB / 177 KB |
| `pokemon/25.json` (max) | 502 KB / 23 KB / 11 KB    |
| `pokemon/*.json` median | 75 KB raw                 |

Decision: no splitting now. A cold visit costs about 370 KB gzip of data, plus about 60 KB for the search index at idle time. Repeat visits cost a 304 plus new species files. The manifest's per-file hash table is the largest revalidated item; moving it into an immutable revision index is the first optimization to make if the cold-visit cost matters.

### Gates

`vp check` (62 files), `vp test` (83 tests), and `vp run -r build` pass.

Remaining before a public release (outside this phase): complete the Cloudflare one-time setup and first deploy (README “Deployment”); review the fr/ja "not introduced" wording with native speakers; validate `@sveltejs/kit@3.1.0` in `minimumReleaseAgeExclude`; choose the visual design / UI library.
