import type { Hono } from "hono";
import { debug, getCachedValue, queryGraphql, setCachedValue } from "./utilities";

export function registerRoutes(app: Hono, options: any) {
	const { cache, getPokemonDetail, maxCacheSize, pokeApiGraphqlUrl, pokemonListCacheTtlMs } =
		options;

	app.get("/", (c) => {
		return c.text("Hello Hono!");
	});

	app.get("/pokemon/all", async (c) => {
		const language = c.req.query("language");
		debug("GET /pokemon/all", { language });

		if (!language) {
			debug("Missing language parameter");
			return c.json({ error: "language is required" }, 400);
		}

		const cacheKey = `pokemon:all:${language}`;
		const cachedPokemon = getCachedValue<any>(cache, cacheKey);

		if (cachedPokemon) {
			debug("Cache hit for Pokemon list:", { cacheKey, count: cachedPokemon.length });
			return c.json({ pokemon: cachedPokemon });
		}

		debug("Cache miss for Pokemon list, querying GraphQL:", cacheKey);

		try {
			const data = await queryGraphql<any>(
				pokeApiGraphqlUrl,
				`
					query PokemonList($language: String!) {
						pokemonspeciesname(
							where: { language: { name: { _eq: $language } } }
							order_by: { pokemon_species_id: asc }
						) {
							name
							pokemon_species_id
							pokemonspecy {
								generation_id
							}
						}
					}
				`,
				{ language },
			);
			const pokemon = data.pokemonspeciesname.map((item: any) => ({
				id: item.pokemon_species_id,
				name: item.name,
				generationId: item.pokemonspecy?.generation_id ?? null,
			}));

			debug("Caching Pokemon list:", { cacheKey, count: pokemon.length });
			setCachedValue(cache, maxCacheSize, cacheKey, pokemon, pokemonListCacheTtlMs);

			return c.json({ pokemon });
		} catch (error) {
			debug("Error loading Pokemon list:", error);
			return c.json({ error: "Could not load Pokémon list" }, 502);
		}
	});

	app.get("/pokemon", async (c) => {
		const generation = Number(c.req.query("generation"));
		const language = c.req.query("language");
		const id = c.req.query("id");
		debug("GET /pokemon", { id, generation, language });

		const hasValidGeneration =
			Number.isInteger(generation) && generation >= 1 && generation <= 9;
		const hasValidId = /^\d+$/.test(id ?? "");

		if (!language || !hasValidId || !hasValidGeneration) {
			debug("Invalid parameters:", { hasValidId, hasValidGeneration, language: !!language });
			return c.json({ error: "generation, language and id are required" }, 400);
		}

		const pokemonId = id ?? "";

		try {
			const pokemon = await getPokemonDetail(pokemonId, generation, language);
			debug("Successfully fetched Pokemon:", { id: pokemonId, name: pokemon.name });
			return c.json(pokemon);
		} catch (error) {
			debug("Error loading Pokemon data:", error);
			return c.json({ error: "Could not load Pokémon data" }, 502);
		}
	});
}
