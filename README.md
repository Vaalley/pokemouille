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

Routes: `/` (language choice; redirects with JavaScript), `/{lang}/` (National Pokédex list), `/{lang}/pokemon/{speciesId}/?version=<game>&form=<form>`. All 3 × 1,025 species pages are prerendered with game-independent identity only; game/form panels resolve in the browser (game precedence: URL → saved preference → Scarlet). Every `/{lang}/` page has a search button (Ctrl/Cmd+K, or start typing): ranking is local in `apps/website/src/lib/search/rank.ts` over the per-language index, so typing never fetches. Interactive controls (`Dialog`, `Command`, `Select`, `Tabs`, `Collapsible`, `Meter`, `Button`, `Label`) use headless Bits UI with minimal layout and functional `data-*` CSS until a visual theme is chosen.

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

- `references.json`: game mappings, localized labels, source counts, and coverage.
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
