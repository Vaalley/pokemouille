import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerRoutes } from "./routes";
import { getCachedValue, normalizeFlavorText, queryGraphql, setCachedValue } from "./utilities";

const app = new Hono();
const pokeApiGraphqlUrl = Bun.env.POKEAPI_GRAPHQL_URL || "https://graphql.pokeapi.co/v1beta2";
const maxCacheSize = 10000;
const pokemonDetailCacheTtlMs = 1000 * 60 * 60;
const pokemonListCacheTtlMs = 1000 * 60 * 15;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

async function getPokemonDetail(id: string, selectedGeneration: number, language: string) {
	const cacheKey = `pokemon:${id}:${language}:${selectedGeneration}`;
	const cachedPokemon = getCachedValue<any>(cache, cacheKey);

	if (cachedPokemon) {
		return cachedPokemon;
	}

	const data = await queryGraphql<any>(
		pokeApiGraphqlUrl,
		`
			query PokemonDetail($id: Int!, $language: String!) {
				pokemonspecies(where: { id: { _eq: $id } }) {
					generation_id
				}
				pokemonspeciesname(
					where: {
						pokemon_species_id: { _eq: $id }
						language: { name: { _eq: $language } }
					}
				) {
					name
				}
				pokemonspeciesflavortext(
					where: {
						pokemon_species_id: { _eq: $id }
						language: { name: { _eq: $language } }
					}
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
		`,
		{ id: Number(id), language },
	);
	const introducedGeneration = data.pokemonspecies[0]?.generation_id || selectedGeneration;
	const effectiveGeneration = Math.max(selectedGeneration, introducedGeneration);
	const flavorTextEntry =
		data.pokemonspeciesflavortext.find((entry: any) => {
			return entry.version.versiongroup.generation_id === effectiveGeneration;
		}) || data.pokemonspeciesflavortext[0];
	const pokemon = {
		effectiveGeneration,
		id,
		introducedGeneration,
		language,
		name: data.pokemonspeciesname[0]?.name || "Unknown",
		flavorText: normalizeFlavorText(flavorTextEntry?.flavor_text || ""),
		selectedGeneration,
	};

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
