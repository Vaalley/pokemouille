# AGENTS.md

## Project Overview

Pokémouille is a full-stack Pokédex web app. It fetches data from the public PokéAPI GraphQL endpoint (`https://graphql.pokeapi.co/v1beta2`) and serves it through a typed REST API consumed by a SvelteKit frontend.

**Stack:**
- **Runtime:** Bun (backend), Node/Vite (frontend dev)
- **Backend:** Hono on Bun — `packages/back`
- **Frontend:** SvelteKit 2 + Svelte 5 + TailwindCSS 4 — `packages/front`
- **Linter:** oxlint (both packages)
- **Formatter:** oxfmt (tabs, width 4)
- **Monorepo:** Bun workspaces (`packages/*`)

---

## Architecture

### Backend (`packages/back/src/`)

| File | Role |
|---|---|
| `index.ts` | App setup only: Hono instance, env config, shared cache, CORS, wires domain functions into `registerRoutes` |
| `routes.ts` | All HTTP route handlers; receives domain functions and cache via `options` |
| `pokemon.ts` | `getPokemonDetail` — GraphQL query + data mapping for Pokémon species |
| `ability.ts` | `getAbilityDetail` — GraphQL query + data mapping for abilities |
| `utilities.ts` | `queryGraphql`, `getCachedValue`, `setCachedValue`, `normalizeFlavorText`, `debug` |

**Key patterns:**
- One shared `Map` cache lives in `index.ts`. Domain functions (`pokemon.ts`, `ability.ts`) receive `cache`, `maxCacheSize`, and `pokeApiGraphqlUrl` as explicit parameters — they do not import globals.
- `index.ts` wraps domain functions as lambdas before passing to `registerRoutes`, hiding the infrastructure parameters from route handlers.
- Cache keys follow the pattern `<entity>:<id>:<language>` or `<entity>:all:<language>`.
- TTL constants are defined as `const X_CACHE_TTL_MS` at the top of each domain file (detail) or in `index.ts` (list).
- The cache uses LRU-style eviction: `setCachedValue` moves the key to the end on write and evicts the oldest key when `cache.size > maxCacheSize`.
- `debug()` logs are gated on `DEBUG_MODE=true` env var. Use it freely — never use `console.log` directly.

### Frontend (`packages/front/src/`)

```
routes/
  +layout.svelte          # Mounts SearchDrawer + NavBar globally
  +page.svelte            # Home page
  pokemon/[language]/[generation]/[id]/
    +page.ts              # load() — fetches from backend
    +page.svelte          # Pokémon detail UI
  ability/[language]/[id]/
    +page.ts              # load() — fetches from backend
    +page.svelte          # Ability detail UI
  types/                  # Type chart page

lib/
  pokemon-search.ts       # Svelte stores + preloadPokemonList() — global search state
  language.ts             # Language list, getSavedLanguage(), setLanguage()
  generation.ts           # getSavedGeneration(), setSavedGeneration()
  theme.ts                # Type color mappings
  type-effectiveness.ts   # Type chart data
  components/
    SearchDrawer.svelte    # Global search drawer (Pokémon + abilities)
    LanguageSelector.svelte
    NavBar.svelte
    TypeBadge.svelte
```

**Route convention:** all detail routes are language-prefixed — `/pokemon/:language/:generation/:id` and `/ability/:language/:id`.

**Data flow:** SvelteKit `load()` in `+page.ts` fetches from the backend. `VITE_API_BASE_URL` env var points to the backend (default `http://localhost:3000`).

**Search:** `pokemon-search.ts` holds writable stores for the Pokémon and ability lists. `preloadPokemonList(language)` fetches both `/pokemon/all` and `/ability/all` in parallel and populates them. The `SearchDrawer` derives filtered results from those stores.

---

## Development Workflow

### Setup

Copy env files before first run:
```
packages/back/.env.example  →  packages/back/.env
packages/front/.env.example →  packages/front/.env
```

### Run

```bash
# Both packages in parallel (from repo root)
bun run dev

# Backend only (port 3000)
cd packages/back && bun run dev

# Frontend only (port 5173)
cd packages/front && bun run dev
```

### Lint & Format

```bash
bun run lint        # lint all packages
bun run lint:fix    # auto-fix lint
bun run fmt         # format all packages
bun run fmt:check   # check formatting without writing
bun run precommit   # fmt + lint (run before committing)
```

### Type-check (frontend only)

```bash
cd packages/front && bun run check
```

There are no automated tests. Verify changes manually via the browser.

---

## Code Conventions

- **Formatter:** oxfmt — tabs for indentation, tab width 4. Never use spaces.
- **Linter:** oxlint — run and fix before committing.
- **TypeScript:** strict. Avoid `any` in new code; existing domain functions use `any` for GraphQL responses only.
- **Naming:** `camelCase` for variables/functions, `PascalCase` for types/components, `UPPER_SNAKE_CASE` for module-level constants (e.g. `POKEMON_DETAIL_CACHE_TTL_MS`).
- **No barrel re-exports** beyond the existing `lib/index.ts`.
- **No comments or JSDoc** unless they already exist in the file being edited. The existing JSDoc blocks on domain functions are intentional — do not add more.
- **Svelte 5 syntax:** use `$state`, `$derived`, `$effect`, `$props()` runes. Do not use legacy `let`/`$:` reactive syntax.
- **No emoji** in code or files.

---

## Agent-Specific Guidance

### Do

- Follow the existing dependency injection pattern: new domain functions go in their own file (e.g. `move.ts`), accept `cache`/`maxCacheSize`/`pokeApiGraphqlUrl` as explicit parameters, and get wired into `registerRoutes` via `index.ts` lambdas.
- Add new backend routes inside `registerRoutes` in `routes.ts`.
- Add new frontend routes as `+page.ts` + `+page.svelte` pairs under `src/routes/`.
- Use `queryGraphql` from `utilities.ts` for all GraphQL calls — never `fetch` directly against the API.
- Use `getCachedValue` / `setCachedValue` from `utilities.ts` for all caching.
- Use `debug()` from `utilities.ts` for all backend logging.
- Run `bun run precommit` (or at minimum `bun run fmt` + `bun run lint`) after making changes.

### Do Not

- Do not add new global state or singletons to `index.ts` beyond what is already there.
- Do not import `cache`, `pokeApiGraphqlUrl`, or any infrastructure variable directly in domain files — they must be passed as parameters.
- Do not introduce new dependencies without a clear reason; the backend has only `hono` as a runtime dependency.
- Do not use `console.log` — use `debug()`.
- Do not create helper scripts, wrapper scripts, or extra documentation files.
- Do not rename `SearchDrawer.svelte` back to `PokemonSearchDrawer.svelte`.

### Common Pitfalls

- **Cache key collisions:** always include all dimensions that affect the result (entity type, id, language, generation where applicable).
- **Language guard in `preloadPokemonList`:** the early-exit checks `pokemonList.length > 0` but not `abilityList.length > 0` — a partial fetch failure can leave abilities empty with no retry path. Be aware of this if touching that function.
- **`listLanguage` not reset on error:** if `preloadPokemonList` throws, `listLanguage` is not cleared, which can block retries for the same language. Handle this if fixing the function.
- **Ability page buttons with null `speciesId`:** render as clickable but do nothing — avoid this pattern in new Pokémon grid UIs.
- **SvelteKit `load()` runs on server and client:** `+page.ts` files (not `+page.server.ts`) run in both environments. The `fetch` argument passed by SvelteKit must be used instead of the global `fetch`.
