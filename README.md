# Pokémouille

> A modern, open-source Pokédex website

## Stack

- **Backend:** Hono on Bun (`packages/back`) — port 3000
- **Frontend:** SvelteKit 2 + Svelte 5 + TailwindCSS 4 (`packages/front`) — port 5173

## Setup

```bash
cp packages/back/.env.example packages/back/.env
cp packages/front/.env.example packages/front/.env
bun install
bun run dev
```

## Scripts

```bash
bun run dev          # run both packages
bun run lint         # lint all
bun run fmt          # format all
bun run precommit    # fmt + lint (run before committing)
```
