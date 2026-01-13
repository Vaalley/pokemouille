# Pokémouille - Project Specifications

> A modern, open-source Pokédex web application built with SvelteKit

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Features](#features)
- [Components](#components)
- [Data Layer](#data-layer)
- [Theming & Styling](#theming--styling)
- [Future Roadmap](#future-roadmap)

---

## Overview

**Pokémouille** is a comprehensive Pokémon encyclopedia that allows users to
search and explore detailed information about Pokémon, their types, abilities,
moves, and items. The application features a clean, modern design with dark mode
support and responsive layouts.

### Key Highlights

- 🔍 Universal search across Pokémon, types, abilities, moves, and items
- 🌙 Dark/Light mode toggle
- 📱 Mobile-responsive design
- ⚡ Server-side rendering with SvelteKit
- 🎨 Custom Pokémouille theme with Skeleton UI

---

## Tech Stack

| Category            | Technology                               |
| ------------------- | ---------------------------------------- |
| **Framework**       | SvelteKit v2 (with Svelte 5)             |
| **Styling**         | TailwindCSS v3 + Skeleton UI v2          |
| **Data Fetching**   | GraphQL (via `graphql-request`)          |
| **Caching**         | `node-cache` (server-side)               |
| **UI Components**   | Skeleton UI (Drawer, LightSwitch, Popup) |
| **Positioning**     | `@floating-ui/dom`                       |
| **Analytics**       | Vercel Analytics                         |
| **Build Tool**      | Vite v5                                  |
| **Package Manager** | pnpm / Bun                               |

---

## Project Structure

```
pokemouille/
├── src/
│   ├── app.css                    # Global CSS styles
│   ├── app.html                   # HTML template
│   ├── components/                # Reusable Svelte components
│   │   ├── EvolutionChain.svelte  # Evolution chain visualization
│   │   ├── SearchBar.svelte       # Global universal search
│   │   └── Type.svelte            # Type badge component
│   ├── lib/                       # Utility functions & data fetching
│   │   ├── utils.js               # Helper utilities
│   │   ├── mainInfoFetch.js       # Main search data fetcher
│   │   ├── mainInfoCache.js       # Main search data cache
│   │   ├── pokemonInfoFetch.js    # Pokémon data fetcher
│   │   ├── pokemonInfoCache.js    # Pokémon data cache
│   │   ├── abilityInfoFetch.js    # Ability data fetcher
│   │   ├── abilityInfoCache.js    # Ability data cache
│   │   ├── moveInfoFetch.js       # Move data fetcher
│   │   ├── moveInfoCache.js       # Move data cache
│   │   ├── itemInfoFetch.js       # Item data fetcher
│   │   └── itemInfoCache.js       # Item data cache
│   └── routes/                    # SvelteKit routes
│       ├── +layout.svelte         # Root layout
│       ├── +page.svelte           # Home page
│       ├── +page.server.js        # Home page server loader
│       ├── +error.svelte          # Error page
│       ├── pokemon/[slug]/        # Pokémon detail pages
│       ├── ability/[slug]/        # Ability detail pages
│       ├── move/[slug]/           # Move detail pages
│       ├── item/[slug]/           # Item detail pages
│       ├── type/[slug]/           # Type detail pages
│       └── credits/               # Credits page
├── static/                        # Static assets
├── pokemouille-theme.ts           # Custom Skeleton UI theme
├── tailwind.config.cjs            # Tailwind configuration
├── svelte.config.js               # SvelteKit configuration
└── package.json                   # Dependencies & scripts
```

---

## Pages & Routes

### 1. Home Page (`/`)

**File:** `src/routes/+page.svelte`

The landing page that welcomes users and introduces the application.

**Features:**

- Welcome message and site description
- Prominent search instruction: "Start typing anywhere to search for anything"
- Link to Credits page
- Link to GitHub repository
- Global search bar (accessible by pressing any letter key)

**SEO:**

- Title: "Pokémouille"
- Description: Pokémon encyclopedia meta description

---

### 2. Pokémon Detail Page (`/pokemon/[slug]`)

**File:** `src/routes/pokemon/[slug]/+page.svelte`

The most comprehensive page displaying all information about a specific Pokémon.

**Sections:**

#### Header Section

- Animated Pokémon sprite (Showdown GIF)
- Pokémon name with special styling:
    - **Legendary Pokémon**: Red-to-yellow gradient text
    - **Mythical Pokémon**: Violet-to-purple gradient text
- Generation introduction indicator

#### Evolution Chain

- Visual representation of the Pokémon's evolution line
- Clickable evolution stages linking to their respective pages
- Current Pokémon highlighted

#### General Info

- Official artwork image
- **ID**: National Pokédex number
- **Height/Weight**: Displayed in meters and kilograms
- **Types**: Type badge(s) with popup for weaknesses/resistances
    - Shows combined type effectiveness for dual-types
    - Shows 0.25x, 0.5x, 2x, 4x multipliers and immunities
- **Abilities**: Links to ability detail pages
    - Hidden abilities marked with "(hidden)" label
    - Short effect description displayed
- **Egg Groups**: Breeding compatibility groups

#### Statistics

- All 6 base stats (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed)
- Total stats sum
- Color-coded stat bars (red for low → green for high)
- EV yield for each stat

#### Sprites Gallery

- Official shiny artwork
- Main sprites (front, back, normal, shiny)

#### Moves Section

- Total move count
- Sortable move list with 4 sort options:
    - Sort by Power
    - Sort by Accuracy
    - Sort Alphabetically
    - Sort by Level
- Each move displays:
    - Type badge
    - Move category icon (Physical/Special/Status)
    - Effect description
    - Learn level (if applicable)
    - Power (with STAB calculation shown)
    - Accuracy
    - PP
    - Priority (if non-zero)

**Dynamic Title:** Includes type emoji + Pokémon name

---

### 3. Ability Detail Page (`/ability/[slug]`)

**File:** `src/routes/ability/[slug]/+page.svelte`

Displays detailed information about a Pokémon ability.

**Sections:**

- **Header**: Ability name + generation introduced
- **Flavor Text**: In-game description
- **Effect Description**: Detailed mechanical explanation
- **Pokémon List**: Grid of all Pokémon that can have this ability
    - Shows sprite and name for each
    - Hidden ability users marked with "(hidden)"
    - Total count displayed

---

### 4. Move Detail Page (`/move/[slug]`)

**File:** `src/routes/move/[slug]/+page.svelte`

Displays detailed information about a Pokémon move.

**Sections:**

- **Header**: Move name + type badge + generation introduced
- **General Info Grid**:
    - Category (Physical/Special/Status with icon)
    - Power
    - Accuracy
    - Priority
    - PP
- **Flavor Text**: In-game description
- **Effect Description**: Detailed mechanical explanation with effect chance
  percentages
- **Pokémon List**: Grid of all Pokémon that can learn this move

---

### 5. Item Detail Page (`/item/[slug]`)

**File:** `src/routes/item/[slug]/+page.svelte`

Displays detailed information about an in-game item.

**Sections:**

- **Header**: Item sprite + name + cost in ¥
- **Flavor Text**: In-game description
- **Effect Description**: Detailed usage explanation
- **Item Category**: Classification of the item

---

### 6. Type Detail Page (`/type/[slug]`)

**File:** `src/routes/type/[slug]/+page.svelte`

Displays type matchup information.

**Sections:**

- **Header**: Type name + type SVG icon
- **Defending Card**: When this type is defending
    - Weak to (takes 2x damage)
    - Resistant to (takes 0.5x damage)
    - Immune to (takes 0x damage)
- **Attacking Card**: When this type is attacking
    - Not very effective against (deals 0.5x damage)
    - Super effective against (deals 2x damage)
    - No effect against (deals 0x damage)

---

### 7. Credits Page (`/credits`)

**File:** `src/routes/credits/+page.svelte`

Acknowledges data sources and asset providers.

**Sections:**

- **Graphical Assets Credits**:
    - Partywhale (Pokemon type icons as SVGs)
    - PokéAPI (Pokemon sprites repository)
- **Data Credits**:
    - PokéAPI (all Pokemon data)

---

### 8. Error Page

**File:** `src/routes/+error.svelte`

Generic error handling page.

**Features:**

- Displays HTTP status code and error message
- Explanation about server issues
- Link to PokéAPI status page for troubleshooting

---

## Features

### ✅ Implemented Features

| Feature                 | Status         | Description                                               |
| ----------------------- | -------------- | --------------------------------------------------------- |
| **Universal Search**    | ✅ Done        | Search across Pokémon, types, abilities, moves, and items |
| **Pokémon Information** | ✅ Done        | Types, abilities, stats, moves, evolution chain           |
| **Dark Mode**           | ✅ Done        | Toggle between light and dark themes                      |
| **Mobile Support**      | ⚒️ Mostly Done | Responsive design with mobile-specific adjustments        |
| **Clever UX**           | ⚒️ In Progress | Keyboard shortcuts, intuitive navigation                  |
| **Beautiful Design**    | ⚒️ In Progress | Custom theme with type-based color coding                 |

### ❌ Planned Features

| Feature                       | Status  | Description                                                   |
| ----------------------------- | ------- | ------------------------------------------------------------- |
| **Multi-language Support**    | ❌ TODO | Support for multiple languages                                |
| **Battle Simulator**          | ❌ TODO | Smogon Showdown-style battle simulation                       |
| **Pokémon Cries**             | ❌ TODO | Audio playback of Pokémon sounds                              |
| **Tree View Evolution Chain** | ❌ TODO | Enhanced evolution visualization using Skeleton UI Tree Views |

---

## Components

### 1. SearchBar (`src/components/SearchBar.svelte`)

The global search component that provides universal search functionality.

**Features:**

- Activated by pressing any letter key (on desktop) or via mobile FAB button
- Uses Skeleton UI Drawer component for overlay
- Searches across 5 categories simultaneously:
    - Pokémon (shows sprite, name, types)
    - Types (shows type badge)
    - Abilities (shows ability capsule icon)
    - Moves (shows TM icon with move type)
    - Items (shows item sprite)
- Responsive result limits:
    - Mobile (<768px): 5 results
    - Tablet (768-1280px): 10 results
    - Desktop (>1280px): 18 results
- Keyboard navigation (Escape to close)

### 2. Type (`src/components/Type.svelte`)

A reusable type badge component.

**Props:**

- `type`: The type name (e.g., "fire", "water")
- `textSize`: Optional custom text size

**Features:**

- Displays type name with appropriate background color
- Links to type detail page on click
- Color-coded based on type (18 colors defined)
- Automatic text color contrast calculation

### 3. EvolutionChain (`src/components/EvolutionChain.svelte`)

Displays the evolution chain of a Pokémon.

**Features:**

- Visual representation of evolution stages
- Current Pokémon highlighted
- Clickable sprites linking to evolution pages

---

## Data Layer

### API Integration

The application fetches data from **PokéAPI GraphQL endpoint**.

**Endpoints:**

- All data is fetched via GraphQL queries using `graphql-request`

### Caching Strategy

Server-side caching is implemented using `node-cache` to reduce API calls:

| Cache              | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `mainInfoCache`    | Search data (Pokémon, abilities, moves, items lists) |
| `pokemonInfoCache` | Individual Pokémon details                           |
| `abilityInfoCache` | Individual ability details                           |
| `moveInfoCache`    | Individual move details                              |
| `itemInfoCache`    | Individual item details                              |

### Data Fetching Pattern

Each route uses SvelteKit's server-side loading:

```
+page.server.js  →  Fetches from cache or API
+page.svelte     →  Receives data via `data` prop
```

### Utility Functions (`src/lib/utils.js`)

| Function                        | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `capitalize(str)`               | Capitalizes first letter of each word                    |
| `hyphenRemover(str)`            | Removes hyphens (except for specific Pokémon names)      |
| `getIdFromUrl(url)`             | Extracts ID from PokéAPI URLs                            |
| `getStatColor(stat, min, max)`  | Returns hex color for stat value (red to green gradient) |
| `getTextColor(bgColor)`         | Returns appropriate text color for contrast              |
| `getExtremeValue(stats, param)` | Gets min/max stat value                                  |
| `get(obj, path, default)`       | Safe deep property access                                |

### Pokemon Types Data

Complete type matchup data is stored in `pokemonTypes` array:

- 18 types with color codes
- Defending matchups (weak, resist, immune)
- Attacking matchups (notVeryEffective, superEffective, noEffect)

---

## Theming & Styling

### Custom Theme (`pokemouille-theme.ts`)

A custom Skeleton UI theme with the following color palette:

| Color         | Hex Code  | Usage                         |
| ------------- | --------- | ----------------------------- |
| **Primary**   | `#43d696` | Main accent (mint green)      |
| **Secondary** | `#52b1e0` | Secondary accent (sky blue)   |
| **Tertiary**  | `#d3dd40` | Tertiary accent (lime yellow) |
| **Success**   | `#42ff62` | Success states                |
| **Warning**   | `#ffa34d` | Warning states                |
| **Error**     | `#ff4d4d` | Error states                  |
| **Surface**   | `#292938` | Background (dark purple-gray) |

**Typography:**

- Font Family: "Outfit" (base and heading)
- Border Radius: 4px
- Border Width: 2px

### Type Colors

Each Pokémon type has a designated color:

| Type     | Color     |
| -------- | --------- |
| Normal   | `#888484` |
| Fire     | `#e56140` |
| Water    | `#299ade` |
| Electric | `#e0bb3a` |
| Grass    | `#439740` |
| Ice      | `#44c8c8` |
| Fighting | `#e58f2e` |
| Poison   | `#9257c7` |
| Ground   | `#a57340` |
| Flying   | `#73aace` |
| Psychic  | `#ea6d8b` |
| Bug      | `#a09e35` |
| Rock     | `#a9a383` |
| Ghost    | `#6f466f` |
| Dragon   | `#5570b9` |
| Dark     | `#4f4747` |
| Steel    | `#73b0ca` |
| Fairy    | `#e18ede` |

---

## Future Roadmap

### Short-term Goals

- [ ] Complete mobile responsiveness polishing
- [ ] Add Pokémon cries audio feature
- [ ] Implement Skeleton UI Tree View for evolution chains
- [ ] Improve UX with additional keyboard shortcuts

### Medium-term Goals

- [ ] Add multi-language support (i18n)
- [ ] Implement team builder feature
- [ ] Add move coverage analysis

### Long-term Goals

- [ ] Battle simulator (Smogon Showdown-style)
- [ ] Competitive viability tiers
- [ ] User accounts and favorites

---

## Development

### Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Environment

- Node.js compatible
- Supports pnpm and Bun package managers

---

## License

Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## Credits

- **Data**: [PokéAPI](https://pokeapi.co)
- **Sprites**: [PokéAPI Sprites Repository](https://github.com/PokeAPI/sprites)
- **Type Icons**:
  [Partywhale's Pokemon Type Icons](https://github.com/partywhale/pokemon-type-icons)

---

_For more information or to contribute, contact **vallley** on Discord or visit
the [GitHub repository](https://github.com/Vaalley/pokemouille)._

---

# 🚀 V2 Redesign - Technology Decisions

This section documents the technology choices for the Pokémouille V2 rebuild.
Each decision includes 5 options with pros/cons analysis.

## Decision Status Legend

| Status          | Meaning                   |
| --------------- | ------------------------- |
| 🟢 **CHOSEN**   | Decision made             |
| 🟡 **PENDING**  | Awaiting decision         |
| 🔵 **PROPOSED** | User's initial preference |

---

## 1. Monorepo Structure 🟢 CHOSEN: Bun Workspaces

**Goal:** Separate backend and frontend into dedicated packages within a single
repository.

### Option 1: Turborepo (Vercel) 🔵 PROPOSED

| Pros                                     | Cons                                    |
| ---------------------------------------- | --------------------------------------- |
| Excellent caching and incremental builds | Owned by Vercel (vendor concern)        |
| Simple configuration (`turbo.json`)      | Less mature than Nx                     |
| Great Bun support                        | Fewer built-in generators               |
| Fast task orchestration                  | Some features require paid Remote Cache |
| Active development and community         |                                         |

### Option 2: Nx (Nrwl)

| Pros                               | Cons                                |
| ---------------------------------- | ----------------------------------- |
| Most feature-rich option           | Steeper learning curve              |
| Powerful dependency graph          | Can feel heavy for smaller projects |
| Built-in generators and migrations | Config can get complex              |
| Excellent caching (local + cloud)  | More opinionated structure          |
| Great VS Code extension            |                                     |

### Option 3: Bun Workspaces 🟢 CHOSEN

| Pros                           | Cons                              |
| ------------------------------ | --------------------------------- |
| Zero additional tooling        | No task orchestration             |
| Native package manager feature | No caching out of the box         |
| Minimal configuration          | No dependency graph visualization |
| Works great with Bun natively  | Manual script coordination        |
| Lightweight and extremely fast | Less automation                   |

### Option 4: Moonrepo

| Pros                           | Cons                     |
| ------------------------------ | ------------------------ |
| Written in Rust (very fast)    | Newer, smaller community |
| Language-agnostic              | Less documentation       |
| Smart task orchestration       | Fewer integrations       |
| Built-in dependency management | Learning curve           |
| Excellent for polyglot repos   |                          |

### Option 5: Lerna (with Nx)

| Pros                           | Cons                             |
| ------------------------------ | -------------------------------- |
| Well-established in ecosystem  | Original Lerna is basically dead |
| Good for publishing packages   | Now merged into Nx               |
| Semantic versioning support    | Confusing history/branding       |
| Works with any package manager | Overkill if not publishing       |
| Changelog generation           |                                  |

**📝 Notes:** Bun workspaces chosen for simplicity and native Bun integration.
No additional tooling overhead.

---

## 2. Linting & Formatting 🟢 CHOSEN: oxlint + oxfmt (Oxc)

**Goal:** Fast, modern linting and formatting toolchain.

### Option 1: oxlint + oxfmt (Oxc) 🟢 CHOSEN

| Pros                                        | Cons                           |
| ------------------------------------------- | ------------------------------ |
| Blazingly fast (Rust-based, 50-100x faster) | oxfmt still in development     |
| Drop-in ESLint replacement                  | Smaller plugin ecosystem       |
| Growing rapidly                             | May need ESLint for some rules |
| Low memory usage                            | Less IDE integration currently |
| Part of Oxc toolchain (bundler coming)      |                                |

### Option 2: Biome (formerly Rome)

| Pros                          | Cons                          |
| ----------------------------- | ----------------------------- |
| All-in-one linter + formatter | Smaller ecosystem than ESLint |
| Very fast (Rust-based)        | Some ESLint rules missing     |
| Zero config to start          | Less Svelte-specific support  |
| Great error messages          | Rapidly changing API          |
| Active development            |                               |

### Option 3: ESLint + Prettier (Classic)

| Pros                        | Cons                          |
| --------------------------- | ----------------------------- |
| Massive plugin ecosystem    | Slower than Rust alternatives |
| Excellent IDE support       | Two tools to configure        |
| Svelte plugin mature        | Can be complex to configure   |
| Most documentation/examples | Higher memory usage           |
| Industry standard           |                               |

### Option 4: ESLint (Flat Config) + dprint

| Pros                       | Cons                    |
| -------------------------- | ----------------------- |
| dprint is very fast (Rust) | Two separate ecosystems |
| ESLint for linting power   | dprint less popular     |
| Best of both worlds        | More configuration      |
| Incremental formatting     | IDE support varies      |
| Extensible                 |                         |

### Option 5: Biome + oxlint (Hybrid)

| Pros                        | Cons                     |
| --------------------------- | ------------------------ |
| Biome for formatting        | Running two linters      |
| oxlint for additional rules | Potential rule conflicts |
| Maximum speed               | More complex setup       |
| Best coverage               | Newer approach           |
| Both actively developed     |                          |

**📝 Notes:** oxlint + oxfmt chosen for blazing fast Rust-based linting and
formatting. Part of the Oxc toolchain ecosystem.

---

## 3. Runtime 🟢 CHOSEN: Bun

**Goal:** Modern, fast JavaScript/TypeScript runtime for the entire project.

### Option 1: Bun 🟢 CHOSEN

| Pros                                                        | Cons                                   |
| ----------------------------------------------------------- | -------------------------------------- |
| All-in-one (runtime, bundler, package manager, test runner) | Newer, some edge cases                 |
| Extremely fast                                              | Windows support improving but not 100% |
| Native TypeScript support                                   | Some npm packages may have issues      |
| Built-in SQLite driver                                      | Smaller community than Node            |
| Excellent Hono integration                                  |                                        |

### Option 2: Node.js (v22+ w/ native features)

| Pros                          | Cons                               |
| ----------------------------- | ---------------------------------- |
| Most stable and battle-tested | Slower than Bun                    |
| Largest ecosystem             | Need separate tools for everything |
| Best compatibility            | TypeScript needs tsx/ts-node       |
| Extensive documentation       | More boilerplate                   |
| LTS support                   |                                    |

### Option 3: Deno 2.0

| Pros                               | Cons                                       |
| ---------------------------------- | ------------------------------------------ |
| Secure by default                  | Different ecosystem                        |
| Native TypeScript                  | npm compatibility improved but not perfect |
| Built-in tooling (fmt, lint, test) | Smaller community                          |
| Web-standard APIs                  | Different module resolution                |
| Good DX                            |                                            |

### Option 4: Node.js + tsx

| Pros                           | Cons                          |
| ------------------------------ | ----------------------------- |
| Node stability with TypeScript | Still slower than Bun         |
| ESM + TypeScript just works    | Additional dependency         |
| Easy migration from existing   | Not all-in-one                |
| Wide compatibility             | Need separate package manager |
|                                |                               |

### Option 5: Cloudflare Workers Runtime (workerd)

| Pros                    | Cons                    |
| ----------------------- | ----------------------- |
| Edge-first architecture | Different from Node/Bun |
| Instant cold starts     | Limited Node.js APIs    |
| Global distribution     | Learning curve          |
| V8 Isolates (secure)    | Vendor lock-in concerns |
| Great for API backends  |                         |

**📝 Notes:** Bun chosen as the all-in-one runtime for speed, native TypeScript,
and excellent Hono integration.

---

## 4. Backend Framework 🟢 CHOSEN: Hono

**Goal:** Fast, TypeScript-first backend framework that works well with Bun.

### Option 1: Hono 🟢 CHOSEN

| Pros                                       | Cons                           |
| ------------------------------------------ | ------------------------------ |
| Ultrafast (works on edge, Bun, Node, Deno) | Smaller ecosystem than Express |
| Tiny bundle size (~13kb)                   | Fewer middleware available     |
| First-class TypeScript                     | Less opinionated (DIY more)    |
| Built-in validation (Zod integration)      | Newer framework                |
| Works everywhere (multi-runtime)           |                                |

### Option 2: Elysia

| Pros                             | Cons                     |
| -------------------------------- | ------------------------ |
| Built specifically for Bun       | Bun-only (less portable) |
| End-to-end type safety           | Smaller community        |
| Fastest Bun framework            | Rapidly changing API     |
| Excellent DX                     | Less mature              |
| Eden Treaty for type-safe client |                          |

### Option 3: tRPC (with adapter)

| Pros                           | Cons                             |
| ------------------------------ | -------------------------------- |
| End-to-end type safety         | Not a full framework             |
| Automatic TypeScript inference | Need to pair with HTTP framework |
| Great with SvelteKit           | Learning curve                   |
| No code generation             | Can feel magical                 |
| Excellent client integration   |                                  |

### Option 4: Fastify

| Pros                     | Cons                     |
| ------------------------ | ------------------------ |
| Very fast (Node-focused) | Less Bun-optimized       |
| Mature ecosystem         | More Node.js conventions |
| Schema-based validation  | Heavier than Hono        |
| Excellent plugin system  |                          |
| Good TypeScript support  |                          |

### Option 5: h3 (Nitro/UnJS)

| Pros                         | Cons                  |
| ---------------------------- | --------------------- |
| Minimal and fast             | Less known            |
| Powers Nitro (Nuxt's server) | Fewer examples        |
| Universal deployment         | Documentation lighter |
| Tree-shakeable               |                       |
| Part of UnJS ecosystem       |                       |

**📝 Notes:** Hono chosen for its ultrafast performance, tiny bundle size, and
multi-runtime support (works great with Bun).

---

## 5. Data Storage & Caching 🟢 CHOSEN: In-Memory LRU Cache + File Persistence

**Goal:** Avoid traditional databases, focus on efficient caching of PokéAPI
responses.

### Option 1: In-Memory LRU Cache + File Persistence 🟢 CHOSEN

| Pros                      | Cons                               |
| ------------------------- | ---------------------------------- |
| No external dependencies  | Lost on restart (unless persisted) |
| Extremely fast reads      | Memory limits                      |
| Simple implementation     | Not distributed                    |
| Can persist to JSON files | File I/O for persistence           |
| Works great with Bun      |                                    |

### Option 2: SQLite (via Bun's native driver)

| Pros                          | Cons                        |
| ----------------------------- | --------------------------- |
| Bun has native SQLite support | It's technically a database |
| No external service needed    | File-based (can grow large) |
| Fast queries                  | Need SQL knowledge          |
| Persistent across restarts    | Schema management           |
| Great for structured cache    |                             |

### Option 3: Redis/Valkey (Managed or Self-hosted)

| Pros                          | Cons                         |
| ----------------------------- | ---------------------------- |
| Industry standard for caching | External service dependency  |
| TTL support out of the box    | Adds complexity              |
| Distributed cache possible    | Cost if managed              |
| Excellent performance         | Overkill for single instance |
|                               |                              |

### Option 4: Unstorage (UnJS)

| Pros                                       | Cons                 |
| ------------------------------------------ | -------------------- |
| Universal storage abstraction              | Abstraction overhead |
| Multiple drivers (memory, fs, redis, etc.) | Another dependency   |
| Easy to swap backends                      | Less control         |
| Works anywhere                             |                      |
| Built-in caching patterns                  |                      |

### Option 5: HTTP Cache Headers + CDN

| Pros                           | Cons                       |
| ------------------------------ | -------------------------- |
| Leverage browser/CDN caching   | Less control over cache    |
| No server-side storage needed  | Depends on client behavior |
| Standard web approach          | Cold cache issues          |
| Scales infinitely              | Need proper headers setup  |
| stale-while-revalidate pattern |                            |

**📝 Notes:** In-Memory LRU Cache with file persistence chosen to avoid
databases while maintaining fast reads and restart resilience.

---

## 6. Internationalization (i18n) 🟢 CHOSEN: Paraglide

**Goal:** Multi-language support with PokéAPI language-aware data fetching.

### Option 1: Paraglide (inlang) 🟢 CHOSEN

| Pros                            | Cons                |
| ------------------------------- | ------------------- |
| Built for SvelteKit             | Newer project       |
| Compile-time, fully type-safe   | Smaller community   |
| Tiny runtime (~1kb)             | Different paradigm  |
| No runtime translation overhead | Requires build step |
| Great DX with VS Code extension |                     |

### Option 2: svelte-i18n

| Pros                              | Cons                  |
| --------------------------------- | --------------------- |
| Most popular Svelte i18n solution | Runtime-based         |
| Mature and stable                 | Larger bundle size    |
| Formatters (numbers, dates, etc.) | Not compile-time safe |
| Easy to set up                    |                       |
| Good documentation                |                       |

### Option 3: typesafe-i18n

| Pros                   | Cons                  |
| ---------------------- | --------------------- |
| Fully type-safe        | Needs code generation |
| Framework agnostic     | Setup more complex    |
| Small runtime          | Less Svelte-specific  |
| Supports pluralization |                       |
| Namespace support      |                       |

### Option 4: i18next + svelte-i18next

| Pros                     | Cons               |
| ------------------------ | ------------------ |
| Massive ecosystem        | Heavier weight     |
| Battle-tested            | More configuration |
| Plugins for everything   | Not Svelte-first   |
| Backend/frontend sharing |                    |
|                          |                    |

### Option 5: Custom implementation (stores + JSON)

| Pros                         | Cons                      |
| ---------------------------- | ------------------------- |
| Full control                 | More work to build        |
| No dependencies              | Need to handle edge cases |
| Tailored to PokéAPI needs    | No ecosystem benefits     |
| Simple for limited languages | Maintenance burden        |
|                              |                           |

**📝 Notes:** Paraglide chosen for compile-time type safety, tiny runtime, and
excellent SvelteKit integration. Will integrate with PokéAPI language parameter
for localized Pokémon/move/ability names.

### PokéAPI Language Integration

Supported languages by PokéAPI:

- `en` - English
- `ja` - Japanese (日本語)
- `ja-Hrkt` - Japanese (Hiragana/Katakana)
- `ko` - Korean (한국어)
- `zh-Hans` - Chinese Simplified (简体中文)
- `zh-Hant` - Chinese Traditional (繁體中文)
- `fr` - French (Français)
- `de` - German (Deutsch)
- `es` - Spanish (Español)
- `it` - Italian (Italiano)
- `cs` - Czech (Čeština)

---

## 7. Frontend Framework 🟢 CHOSEN: SvelteKit 2 (Svelte 5)

**Goal:** Modern, performant frontend with excellent DX.

### Option 1: SvelteKit 2 (Svelte 5) 🟢 CHOSEN

| Pros                                   | Cons                            |
| -------------------------------------- | ------------------------------- |
| Already familiar with current codebase | Svelte 5 runes are new paradigm |
| Excellent performance                  | Smaller ecosystem than React    |
| File-based routing                     | Some migration effort from v1   |
| SSR/SSG/SPA flexibility                |                                 |
| Great TypeScript support               |                                 |

### Option 2: SvelteKit + Superforms

| Pros                        | Cons                         |
| --------------------------- | ---------------------------- |
| All SvelteKit benefits      | Additional dependency        |
| Best-in-class form handling | Learning Superforms patterns |
| Type-safe validation        |                              |
| Progressive enhancement     |                              |
| Works with Zod schemas      |                              |

### Option 3: Fresh (Deno)

| Pros                       | Cons               |
| -------------------------- | ------------------ |
| Island architecture        | Deno-only          |
| Zero runtime JS by default | Different paradigm |
| Preact-based (familiar)    | Smaller community  |
| Edge-first                 | Less mature        |
|                            |                    |

### Option 4: Nuxt 3 (Vue)

| Pros                     | Cons                  |
| ------------------------ | --------------------- |
| Mature and feature-rich  | Switching from Svelte |
| Excellent DX             | Vue learning curve    |
| Nitro server (very fast) | Larger bundle         |
| Great ecosystem          |                       |
|                          |                       |

### Option 5: Astro + Svelte Islands

| Pros                         | Cons                       |
| ---------------------------- | -------------------------- |
| Content-focused              | Different architecture     |
| Zero JS by default           | Islands pattern complexity |
| Use Svelte for interactivity | Less SPA-like              |
| Excellent performance        |                            |
| Great for static content     |                            |

**📝 Notes:** SvelteKit 2 with Svelte 5 chosen for familiarity, excellent
performance, and great TypeScript support with runes.

---

## 8. Pokémon Cries Implementation 🟢 CHOSEN: PokéAPI Cries (Direct CDN)

**Goal:** Add audio playback for Pokémon cries.

### Option 1: PokéAPI Cries (Direct CDN) 🟢 CHOSEN

| Pros                          | Cons                       |
| ----------------------------- | -------------------------- |
| Official source               | Limited to modern cries    |
| Already integrated with API   | May have rate limits       |
| No hosting needed             | Dependency on external CDN |
| Always up-to-date             |                            |
| OGG format (good compression) |                            |

**URL Pattern:**
`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{id}.ogg`

### Option 2: Pokémon Showdown Audio Files

| Pros                      | Cons                        |
| ------------------------- | --------------------------- |
| Complete collection       | Need to host files          |
| Legacy + modern cries     | Larger storage requirements |
| MP3 format (wide support) | License considerations      |
|                           |                             |
|                           |                             |

### Option 3: Self-hosted (CDN/Cloud Storage)

| Pros                     | Cons                 |
| ------------------------ | -------------------- |
| Full control             | Storage costs        |
| Custom compression       | Maintenance burden   |
| No external dependencies | Need to source files |
| CDN for performance      |                      |
|                          |                      |

### Option 4: Web Audio API + Generated Sounds

| Pros                    | Cons                   |
| ----------------------- | ---------------------- |
| Unique approach         | Not authentic cries    |
| No file storage         | Complex implementation |
| Programmatic generation | May sound artificial   |
| Tiny footprint          |                        |
|                         |                        |

### Option 5: Lazy-loaded Audio Sprites

| Pros                       | Cons                       |
| -------------------------- | -------------------------- |
| Single file per generation | Complex to create          |
| Faster loading             | Large initial download     |
| Seek to specific cry       | More complex playback code |
| Cacheable                  |                            |
|                            |                            |

**📝 Notes:** PokéAPI Cries CDN chosen for official source, no hosting
requirements, and always up-to-date audio files.

---

## 9. Battle Simulator (Future - Separate Project) 🟢 CHOSEN: Build from Scratch

**Goal:** Long-term goal for a Pokémon Showdown-like battle simulator.

### Option 1: Separate Monorepo

| Pros                         | Cons                    |
| ---------------------------- | ----------------------- |
| Clean separation of concerns | Managing two repos      |
| Independent deployment       | Shared code duplication |
| Different release cycles     |                         |
| Focused teams                |                         |
|                              |                         |

### Option 2: Same Monorepo, New Package

| Pros                   | Cons               |
| ---------------------- | ------------------ |
| Shared utilities/types | Larger monorepo    |
| Single version control | Coupled releases   |
| Easier code sharing    | More complex CI/CD |
| Unified tooling        |                    |
|                        |                    |

### Option 3: Fork Pokémon Showdown

| Pros                       | Cons                    |
| -------------------------- | ----------------------- |
| Battle logic already built | Legacy codebase         |
| Proven mechanics           | Large existing codebase |
| Community tested           | Different tech stack    |
|                            | License considerations  |
|                            |                         |

### Option 4: Use @pkmn/sim Library

| Pros                        | Cons           |
| --------------------------- | -------------- |
| TypeScript battle simulator | Still need UI  |
| Well-maintained             | Learning curve |
| Showdown-compatible         | Dependency     |
| Active community            |                |
|                             |                |

### Option 5: Build from Scratch 🟢 CHOSEN (Future)

| Pros                | Cons                                 |
| ------------------- | ------------------------------------ |
| Full control        | Massive undertaking                  |
| Modern architecture | Years of work                        |
| Tailored to needs   | Need deep battle mechanics knowledge |
|                     | Bug-prone                            |
|                     |                                      |

**📝 Notes:** Build from Scratch chosen for full control and modern
architecture. **This is a long-term goal, not for V1 - may never come.**

---

## 10. Additional Choices

### 10.1 API Documentation 🟢 CHOSEN: Scalar (Post-V1)

| Option         | Description                             | Status             |
| -------------- | --------------------------------------- | ------------------ |
| **Scalar**     | Modern, beautiful API docs from OpenAPI | 🟢 CHOSEN (not V1) |
| **Swagger UI** | Classic, widely supported               |                    |
| **Redoc**      | Clean, responsive docs                  |                    |

### 10.2 Error Monitoring 🟢 CHOSEN: Sentry (Post-V1)

| Option           | Description                             | Status             |
| ---------------- | --------------------------------------- | ------------------ |
| **Sentry**       | Industry standard, great Svelte support | 🟢 CHOSEN (not V1) |
| **LogSnag**      | Event tracking + notifications          |                    |
| **Highlight.io** | Open-source alternative                 |                    |

### 10.3 Testing Strategy 🟢 CHOSEN: Bun test

| Option         | Description                      | Status    |
| -------------- | -------------------------------- | --------- |
| **Vitest**     | Fast, Vite-native testing        |           |
| **Bun test**   | Built into Bun runtime           | 🟢 CHOSEN |
| **Playwright** | E2E testing, great for SvelteKit |           |

### 10.4 Deployment Platform 🟢 CHOSEN: Railway

| Option               | Description                         | Status    |
| -------------------- | ----------------------------------- | --------- |
| **Vercel**           | Best SvelteKit support, easy        |           |
| **Cloudflare Pages** | Edge deployment, generous free tier |           |
| **Fly.io**           | Good for Bun/Hono backends          |           |
| **Railway**          | Simple, good DX                     | 🟢 CHOSEN |

### 10.5 State Management (Frontend) 🟢 CHOSEN: Svelte 5 Runes

| Option             | Description              | Status    |
| ------------------ | ------------------------ | --------- |
| **Svelte 5 Runes** | Built-in, no extra deps  | 🟢 CHOSEN |
| **TanStack Query** | Server state management  |           |
| **Nanostores**     | Tiny, framework-agnostic |           |

### 10.6 Component Library 🟢 CHOSEN: Bits UI

| Option             | Description                      | Status    |
| ------------------ | -------------------------------- | --------- |
| **Skeleton UI v3** | Continue with familiar library   |           |
| **shadcn-svelte**  | Beautiful, copy-paste components |           |
| **Melt UI**        | Headless, accessible primitives  |           |
| **Bits UI**        | Headless component library       | 🟢 CHOSEN |

---

## Decisions Summary

### Core Technology Stack

| #   | Category             | Status    | Choice                           |
| --- | -------------------- | --------- | -------------------------------- |
| 1   | Monorepo             | 🟢 CHOSEN | Bun Workspaces                   |
| 2   | Linting/Formatting   | 🟢 CHOSEN | oxlint + oxfmt (Oxc)             |
| 3   | Runtime              | 🟢 CHOSEN | Bun                              |
| 4   | Backend Framework    | 🟢 CHOSEN | Hono                             |
| 5   | Data Storage/Caching | 🟢 CHOSEN | In-Memory LRU + File Persistence |
| 6   | Internationalization | 🟢 CHOSEN | Paraglide                        |
| 7   | Frontend Framework   | 🟢 CHOSEN | SvelteKit 2 (Svelte 5)           |
| 8   | Pokémon Cries        | 🟢 CHOSEN | PokéAPI Cries CDN                |
| 9   | Battle Simulator     | 🟢 CHOSEN | Build from Scratch (Future)      |

### Additional Tooling

| Category          | Choice         | V1?        |
| ----------------- | -------------- | ---------- |
| API Documentation | Scalar         | ❌ Post-V1 |
| Error Monitoring  | Sentry         | ❌ Post-V1 |
| Testing           | Bun test       | ✅ V1      |
| Deployment        | Railway        | ✅ V1      |
| State Management  | Svelte 5 Runes | ✅ V1      |
| Component Library | Bits UI        | ✅ V1      |

---

_Last updated: 2026-01-12_ _All core decisions finalized._

---

# 📋 V2 Implementation Plan

This section provides a step-by-step guide to building Pokémouille V2 with the
chosen technology stack.

## Project Structure

```
pokemouille-v2/
├── package.json                    # Root workspace configuration
├── bun.lockb                       # Bun lockfile
├── bunfig.toml                     # Bun configuration
├── .oxlintrc.json                  # oxlint configuration
├── oxfmt.toml                      # oxfmt configuration (when available)
├── .gitignore
├── README.md
├── LICENSE
│
├── packages/
│   ├── shared/                     # Shared utilities, types, constants
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types/              # Shared TypeScript types
│   │   │   │   ├── pokemon.ts
│   │   │   │   ├── ability.ts
│   │   │   │   ├── move.ts
│   │   │   │   ├── item.ts
│   │   │   │   └── type.ts
│   │   │   ├── constants/          # Shared constants
│   │   │   │   ├── pokemon-types.ts
│   │   │   │   └── languages.ts
│   │   │   └── utils/              # Shared utilities
│   │   │       ├── capitalize.ts
│   │   │       ├── hyphen-remover.ts
│   │   │       └── color-utils.ts
│   │   └── tsconfig.json
│   │
│   └── cache/                      # LRU Cache + File Persistence package
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── lru-cache.ts
│       │   └── file-persistence.ts
│       └── tsconfig.json
│
├── apps/
│   ├── api/                        # Hono Backend API
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point
│   │   │   ├── app.ts              # Hono app setup
│   │   │   ├── routes/
│   │   │   │   ├── index.ts
│   │   │   │   ├── pokemon.ts
│   │   │   │   ├── ability.ts
│   │   │   │   ├── move.ts
│   │   │   │   ├── item.ts
│   │   │   │   ├── type.ts
│   │   │   │   └── search.ts
│   │   │   ├── services/
│   │   │   │   ├── pokeapi.ts      # PokéAPI GraphQL client
│   │   │   │   └── cache.ts        # Cache service
│   │   │   ├── middleware/
│   │   │   │   ├── cors.ts
│   │   │   │   └── language.ts     # i18n language middleware
│   │   │   └── lib/
│   │   │       └── graphql-queries.ts
│   │   ├── tests/
│   │   │   └── *.test.ts
│   │   └── tsconfig.json
│   │
│   └── web/                        # SvelteKit Frontend
│       ├── package.json
│       ├── svelte.config.js
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── src/
│       │   ├── app.html
│       │   ├── app.css
│       │   ├── lib/
│       │   │   ├── components/     # Svelte components
│       │   │   │   ├── ui/         # Bits UI wrapper components
│       │   │   │   ├── SearchBar.svelte
│       │   │   │   ├── Type.svelte
│       │   │   │   ├── EvolutionChain.svelte
│       │   │   │   ├── StatBar.svelte
│       │   │   │   └── PokemonCry.svelte
│       │   │   ├── stores/         # Svelte 5 runes stores
│       │   │   │   └── language.svelte.ts
│       │   │   ├── api/            # API client
│       │   │   │   └── client.ts
│       │   │   └── utils/
│       │   ├── routes/
│       │   │   ├── +layout.svelte
│       │   │   ├── +layout.server.ts
│       │   │   ├── +page.svelte
│       │   │   ├── +error.svelte
│       │   │   ├── pokemon/[slug]/
│       │   │   ├── ability/[slug]/
│       │   │   ├── move/[slug]/
│       │   │   ├── item/[slug]/
│       │   │   ├── type/[slug]/
│       │   │   └── credits/
│       │   └── paraglide/          # Generated i18n files
│       ├── messages/               # i18n translation files
│       │   ├── en.json
│       │   ├── fr.json
│       │   ├── de.json
│       │   ├── es.json
│       │   ├── it.json
│       │   ├── ja.json
│       │   ├── ko.json
│       │   └── zh-Hans.json
│       ├── static/
│       └── tests/
│
└── .cache/                         # File-persisted cache (gitignored)
    └── *.json
```

---

## Phase 1: Project Setup (Foundation)

### 1.1 Initialize Monorepo

```bash
# Create new directory
mkdir pokemouille-v2
cd pokemouille-v2

# Initialize with Bun
bun init -y

# Create workspace structure
mkdir -p packages/shared/src packages/cache/src
mkdir -p apps/api/src apps/web
```

### 1.2 Configure Bun Workspaces

**`package.json`** (root):

```json
{
	"name": "pokemouille-v2",
	"private": true,
	"workspaces": ["packages/*", "apps/*"],
	"scripts": {
		"dev": "bun run --parallel dev:api dev:web",
		"dev:api": "bun run --cwd apps/api dev",
		"dev:web": "bun run --cwd apps/web dev",
		"build": "bun run --parallel build:api build:web",
		"build:api": "bun run --cwd apps/api build",
		"build:web": "bun run --cwd apps/web build",
		"lint": "oxlint .",
		"format": "oxfmt .",
		"test": "bun test",
		"clean": "rm -rf node_modules apps/*/node_modules packages/*/node_modules"
	}
}
```

### 1.3 Configure oxlint

**`.oxlintrc.json`**:

```json
{
	"$schema": "./node_modules/oxlint/configuration_schema.json",
	"rules": {
		"no-unused-vars": "warn",
		"no-console": "warn",
		"eqeqeq": "error"
	},
	"ignorePatterns": ["node_modules", "dist", ".svelte-kit", ".cache"]
}
```

### 1.4 Configure bunfig.toml

**`bunfig.toml`**:

```toml
[install]
# Use exact versions
exact = true

[test]
# Test configuration
coverage = true
```

---

## Phase 2: Shared Packages

### 2.1 Create Shared Package

**`packages/shared/package.json`**:

```json
{
	"name": "@pokemouille/shared",
	"version": "1.0.0",
	"type": "module",
	"main": "./src/index.ts",
	"types": "./src/index.ts",
	"exports": {
		".": "./src/index.ts",
		"./types": "./src/types/index.ts",
		"./constants": "./src/constants/index.ts",
		"./utils": "./src/utils/index.ts"
	}
}
```

**Key shared types to create:**

- `PokemonType` - Type matchup data
- `Pokemon`, `Ability`, `Move`, `Item` - Core data types
- `Language` - Supported language codes
- `ApiResponse<T>` - Generic API response wrapper

### 2.2 Create Cache Package

**`packages/cache/package.json`**:

```json
{
	"name": "@pokemouille/cache",
	"version": "1.0.0",
	"type": "module",
	"main": "./src/index.ts",
	"types": "./src/index.ts",
	"dependencies": {
		"lru-cache": "^10.0.0"
	}
}
```

**Features:**

- LRU cache with configurable TTL and max size
- File persistence using Bun's native file APIs
- Language-aware cache keys
- Automatic cache warming on startup

---

## Phase 3: Backend API (Hono)

### 3.1 Initialize Hono App

**`apps/api/package.json`**:

```json
{
	"name": "@pokemouille/api",
	"version": "1.0.0",
	"type": "module",
	"scripts": {
		"dev": "bun --watch src/index.ts",
		"build": "bun build src/index.ts --outdir dist --target bun",
		"start": "bun dist/index.js",
		"test": "bun test"
	},
	"dependencies": {
		"@pokemouille/shared": "workspace:*",
		"@pokemouille/cache": "workspace:*",
		"hono": "^4.0.0",
		"graphql-request": "^6.0.0",
		"zod": "^3.22.0"
	}
}
```

### 3.2 API Routes

| Route                  | Method | Description                                                |
| ---------------------- | ------ | ---------------------------------------------------------- |
| `/api/health`          | GET    | Health check                                               |
| `/api/search`          | GET    | Universal search (pokemon, abilities, moves, items, types) |
| `/api/pokemon/:slug`   | GET    | Pokemon details                                            |
| `/api/ability/:slug`   | GET    | Ability details                                            |
| `/api/move/:slug`      | GET    | Move details                                               |
| `/api/item/:slug`      | GET    | Item details                                               |
| `/api/type/:slug`      | GET    | Type matchups                                              |
| `/api/pokemon/:id/cry` | GET    | Returns cry audio URL                                      |

### 3.3 Language Middleware

```typescript
// All routes accept `?lang=` query parameter
// Defaults to 'en', validates against supported languages
// Passes language to PokéAPI GraphQL queries
```

---

## Phase 4: Frontend (SvelteKit)

### 4.1 Initialize SvelteKit

```bash
cd apps/web
bun create svelte@latest .
# Select: Skeleton project, TypeScript, ESLint (will replace with oxlint), Prettier (will replace)
```

### 4.2 Install Dependencies

```bash
bun add bits-ui @internationalized/date
bun add -D @inlang/paraglide-sveltekit tailwindcss postcss autoprefixer
```

### 4.3 Configure Paraglide (i18n)

**`apps/web/project.inlang/settings.json`**:

```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "fr", "de", "es", "it", "ja", "ko", "zh-Hans"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher/dist/index.js"
	],
	"plugin.inlang.messageFormat": {
		"pathPattern": "./messages/{languageTag}.json"
	}
}
```

### 4.4 Key Components to Build

| Component                 | Description                           |
| ------------------------- | ------------------------------------- |
| `SearchBar.svelte`        | Global search with keyboard shortcuts |
| `Type.svelte`             | Type badge with color coding          |
| `StatBar.svelte`          | Animated stat visualization           |
| `EvolutionChain.svelte`   | Evolution tree display                |
| `PokemonCry.svelte`       | Audio player for Pokémon cries        |
| `LanguageSwitcher.svelte` | Language selection dropdown           |

---

## Phase 5: Features Implementation

### 5.1 Core Features (V1)

- [x] Tech stack decisions
- [ ] Monorepo setup
- [ ] Shared packages (types, utils, cache)
- [ ] Hono API with all routes
- [ ] SvelteKit frontend structure
- [ ] Universal search
- [ ] Pokémon detail pages
- [ ] Ability/Move/Item/Type pages
- [ ] Dark/Light mode
- [ ] Responsive design
- [ ] Pokémon cries (audio)
- [ ] Internationalization (8 languages)
- [ ] LRU caching with file persistence
- [ ] Railway deployment

### 5.2 Post-V1 Features

- [ ] Scalar API documentation
- [ ] Sentry error monitoring
- [ ] Team builder
- [ ] Move coverage analysis
- [ ] Competitive tiers
- [ ] User accounts / favorites

### 5.3 Long-term (Maybe Never)

- [ ] Battle simulator (from scratch)

---

## Phase 6: Deployment (Railway)

### 6.1 Railway Configuration

**Backend (`apps/api`):**

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "bun run start"
healthcheckPath = "/api/health"
```

**Frontend (`apps/web`):**

```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "bun run build"

[deploy]
startCommand = "bun run preview --host"
```

### 6.2 Environment Variables

| Variable              | Description                    |
| --------------------- | ------------------------------ |
| `POKEAPI_GRAPHQL_URL` | PokéAPI GraphQL endpoint       |
| `CACHE_TTL`           | Cache TTL in seconds           |
| `CACHE_MAX_SIZE`      | Max cache entries              |
| `API_URL`             | Backend API URL (for frontend) |

---

## Development Milestones

### Milestone 1: Foundation ⏳

- [ ] Monorepo with Bun workspaces
- [ ] Shared types package
- [ ] Cache package with LRU + file persistence
- [ ] Basic Hono API skeleton
- [ ] Basic SvelteKit skeleton

### Milestone 2: Core API 🔜

- [ ] PokéAPI GraphQL integration
- [ ] All API routes implemented
- [ ] Language parameter support
- [ ] Caching layer working

### Milestone 3: Core Frontend 🔜

- [ ] All pages implemented
- [ ] Bits UI components
- [ ] Search functionality
- [ ] Dark mode

### Milestone 4: Polish 🔜

- [ ] Paraglide i18n setup
- [ ] All 8 languages
- [ ] Pokémon cries
- [ ] Mobile responsiveness
- [ ] Performance optimization

### Milestone 5: Launch 🔜

- [ ] Railway deployment
- [ ] Domain setup
- [ ] Final testing
- [ ] V1 release 🎉

---

## Quick Start Commands

```bash
# Clone and install
git clone <repo>
cd pokemouille-v2
bun install

# Development (runs both API and Web)
bun run dev

# Run only API
bun run dev:api

# Run only Web
bun run dev:web

# Run tests
bun test

# Lint
bun run lint

# Build for production
bun run build
```

---

_Ready to start building? Begin with Phase 1: Project Setup!_
