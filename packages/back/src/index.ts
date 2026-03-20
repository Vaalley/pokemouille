import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes";
import {
	debug,
	getCachedValue,
	normalizeFlavorText,
	queryGraphql,
	setCachedValue,
} from "./utilities";

const app = new Hono();
const pokeApiGraphqlUrl = Bun.env.POKEAPI_GRAPHQL_URL || "https://graphql.pokeapi.co/v1beta2";
const maxCacheSize = 10000;
const pokemonDetailCacheTtlMs = 1000 * 60 * 60;
const pokemonListCacheTtlMs = 1000 * 60 * 15;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

debug("Backend initialized with config:", {
	pokeApiGraphqlUrl,
	maxCacheSize,
	pokemonDetailCacheTtlMs,
	pokemonListCacheTtlMs,
});

async function getPokemonDetail(id: string, selectedGeneration: number, language: string) {
	const cacheKey = `pokemon:${id}:${language}:${selectedGeneration}`;
	debug("Fetching Pokemon detail:", { id, selectedGeneration, language, cacheKey });
	const cachedPokemon = getCachedValue<any>(cache, cacheKey);

	if (cachedPokemon) {
		debug("Cache hit for Pokemon detail:", cacheKey);
		return cachedPokemon;
	}

	debug("Cache miss for Pokemon detail, querying GraphQL:", cacheKey);

	const data = await queryGraphql<any>(
		pokeApiGraphqlUrl,
		`
			query PokemonDetail($id: Int!, $language: String!) {
				pokemonspecies(where: { id: { _eq: $id } }) {
					generation_id
					pokemonspeciesnames(where: { language: { name: { _eq: $language } } }) {
						name
					}
					pokemonspeciesflavortexts(
						where: { language: { name: { _eq: $language } } }
						order_by: { version_id: desc }
					) {
						flavor_text
						version {
							versiongroup {
								generation_id
							}
						}
					}
				}
			}
		`,
		{ id: Number(id), language },
	);
	const species = data.pokemonspecies[0];
	const introducedGeneration = species?.generation_id || selectedGeneration;
	const effectiveGeneration = Math.max(selectedGeneration, introducedGeneration);
	const flavorTextEntry =
		species?.pokemonspeciesflavortexts?.find((entry: any) => {
			return entry.version.versiongroup.generation_id === effectiveGeneration;
		}) || species?.pokemonspeciesflavortexts?.[0];
	const pokemon = {
		effectiveGeneration,
		id,
		introducedGeneration,
		language,
		name: species?.pokemonspeciesnames?.[0]?.name || "Unknown",
		flavorText: normalizeFlavorText(flavorTextEntry?.flavor_text || ""),
		selectedGeneration,
	};

	debug("Caching Pokemon detail:", { cacheKey, name: pokemon.name });
	setCachedValue(cache, maxCacheSize, cacheKey, pokemon, pokemonDetailCacheTtlMs);

	return pokemon;
}

app.use(
	"*",
	cors({
		origin: Bun.env.FRONTEND_ORIGIN || "http://localhost:5173",
	}),
);

registerRoutes(app, {
	cache,
	getPokemonDetail,
	maxCacheSize,
	pokeApiGraphqlUrl,
	pokemonListCacheTtlMs,
});

export default app;
