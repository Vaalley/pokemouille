import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes";
import { debug } from "./utilities";
import { getPokemonDetail } from "./pokemon";
import { getAbilityDetail } from "./ability";

const app = new Hono();
const pokeApiGraphqlUrl = Bun.env.POKEAPI_GRAPHQL_URL || "https://graphql.pokeapi.co/v1beta2";
const maxCacheSize = 10000;
const pokemonListCacheTtlMs = 1000 * 60 * 15;
const abilityListCacheTtlMs = 1000 * 60 * 15;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

debug("Backend initialized with config:", { pokeApiGraphqlUrl, maxCacheSize });

app.use("*", cors({ origin: Bun.env.FRONTEND_ORIGIN || "http://localhost:5173" }));

registerRoutes(app, {
	abilityListCacheTtlMs,
	cache,
	getAbilityDetail: (id: string, language: string) =>
		getAbilityDetail(id, language, cache, maxCacheSize, pokeApiGraphqlUrl),
	getPokemonDetail: (id: string, generation: number, language: string) =>
		getPokemonDetail(id, generation, language, cache, maxCacheSize, pokeApiGraphqlUrl),
	maxCacheSize,
	pokeApiGraphqlUrl,
	pokemonListCacheTtlMs,
});

export default app;
