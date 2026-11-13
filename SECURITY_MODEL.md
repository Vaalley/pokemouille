# Pokémouille threat model

Repository: `Vaalley/pokemouille` (public on GitHub). Live at https://pokemouille.app/. No separate infrastructure repository: the in-repo Cloudflare config (`apps/website/wrangler.jsonc`, `apps/website/static/_headers`, `.github/workflows/deploy.yml`) is the whole deployment (confirmed by the owner).

## System overview

A multilingual Pokédex (en/fr/ja). SvelteKit 3 with `adapter-static` prerenders every page at build time. A Cloudflare Worker serves the static build plus a versioned dataset from an R2 bucket. A data pipeline pulls public PokéAPI GraphQL (`v1beta2`) in bounded weekly/manual refreshes and publishes JSON snapshots. There are no accounts, logins, databases, forms, or user-generated content. Visitors never call PokéAPI directly. Per-visitor state lives only in `localStorage` (theme, game, sprite preference).

## Components

| Name | Code | Notes |
|---|---|---|
| **web-client** | `apps/website/src/**` (routes, `lib/components`, `lib/data`, `lib/search`, `lib/server` prerender projections), `apps/website/src/app.html` | Prerendered HTML + browser JS. Renders PokéAPI-derived text, URLs (sprites, cries), and URL query state (`?version=`, `?form=`, `?q=`, filters, `dex=`). |
| **worker** | `apps/website/worker/index.ts`, `apps/website/derived-assets.ts`, `apps/website/wrangler.jsonc`, `apps/website/static/_headers`, `static/.assetsignore` | Public edge entry point. Serves `data/manifest.json`, `data/revisions/*`, `_app/immutable/*`, and `learners|breeding/<sha256>/<id>.json` from R2 binding `DATA`; everything else goes to `ASSETS`. Uses `caches.default` for immutable keys. |
| **data-pipeline** | `tools/data/**`, `packages/pokemon-data/**` | Node CLI: GraphQL client with rate ledger and response cache, validation (`validateBoundedRelationships`, census checks), mapping, publish/republish. `--endpoint` may be overridden (HTTP/HTTPS only). |
| **deploy-pipeline** | `.github/workflows/deploy.yml`, `apps/website/scripts/r2.ts` | GitHub Actions on push to `main`, weekly cron, and manual dispatch. Has `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`. Syncs dataset, immutable chunks, and ingestion state (`state/state.tar.gz`) to R2, then `wrangler deploy`. |
| **sprite-tooling** | `tools/sprites/**` | Local build-time packing of vendored icons into sprite sheets. |

## Trust boundaries and entry points

1. **Internet → worker / static assets** (anyone): arbitrary paths, methods, and conditional headers (`If-None-Match` etc. go straight to `R2.get(..., { onlyIf: request.headers })`). The path is `decodeURIComponent`d and then used as an R2 key after the allow-list check.
2. **Internet → web-client in the browser** (anyone, via crafted links): query parameters and hash, `localStorage` values, and JSON fetched from the worker.
3. **PokéAPI → data-pipeline** (upstream third party): GraphQL responses become the published dataset. Their strings and URLs end up in prerendered HTML and client-rendered views (sprite `front_default` URLs, cries, localized prose).
4. **GitHub → deploy-pipeline**: code on `main` (owner-controlled) and dependency/Action versions run with Cloudflare credentials. The workflow has no `pull_request` trigger, so outside PRs don't reach secrets unless merged. `permissions: contents: read`.
5. **Supply chain**: npm packages (pnpm lockfile, catalog pins, `minimumReleaseAgeExclude` exceptions, scoped `runed` overrides), GitHub Actions (`actions/checkout@v5`, `voidzero-dev/setup-vp@v1.21.2`, tag-pinned, not SHA-pinned), and third-party runtime origins (Google Fonts CSS, external sprite/cry URLs from PokéAPI data).

## Assets (owner-ranked: all matter)

- **Cloudflare API token and account ID** (GitHub secrets) and with them the integrity of the deployed site and Worker.
- **R2 bucket `pokemouille-data`**: published dataset revisions, manifest, retained immutable chunks, and the private ingestion state `state/state.tar.gz` (never meant to be served).
- **Visitors' browsers**: no script injection (XSS), open redirects, or malicious content on pokemouille.app.
- **Availability and Cloudflare bill**: request/bandwidth abuse, cache bypass, R2 operation costs.

## Attackers in scope (owner: all of them)

- Anonymous internet visitors and anyone who can send a visitor a crafted link.
- Malicious or compromised upstream data (PokéAPI responses, or an overridden endpoint).
- Supply-chain attackers (npm dependencies, GitHub Actions).
- Outside contributors opening PRs on the public repository.

## Existing controls

- Worker allow-list: only `data/manifest.json`, `data/revisions/*`, `_app/immutable/*`, and the strict regex `^(?:learners|breeding)\/[a-f0-9]{64}\/[1-9]\d*\.json$` reach R2; `state/` is not in the list. Only GET/HEAD reach R2. Bad percent-encoding returns 404.
- Dataset excluded from asset upload (`.assetsignore`); immutable/no-cache headers set explicitly.
- No `{@html}` / `innerHTML` / `eval` in `apps/website/src` (as of drafting); Svelte escapes text by default.
- The theme bootstrap script in `app.html` only applies allow-listed `localStorage` values.
- Pipeline: hourly request budget, cooldowns, response validation, HTTP/HTTPS-only endpoint check.
- Deploy: single-writer concurrency group, read-only `GITHUB_TOKEN`, pinned runner image, no PR-triggered runs.

## Out of scope / accepted risk

- Nothing excluded by the owner: report everything, including DoS/cost abuse, local tooling, and third-party embeds.

## Owner answers on deployment

- `main` has **no branch protection** (owner). Anyone with push access deploys directly with the Cloudflare secrets; there is no required review gate.
- Security headers / CSP outside the repo: unknown (owner not sure). Treat the site as having no CSP unless confirmed.
- Cloudflare API token scope: unknown (owner not sure). Assume it may be broader than Workers + `pokemouille-data`.

## Open questions

- Confirm the Cloudflare API token's scope in the Cloudflare dashboard (API Tokens).
- Confirm whether any Transform Rules / security headers are set on the zone.
