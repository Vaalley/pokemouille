import type { Hono } from "hono";
import { debug, getCachedValue, queryGraphql, setCachedValue } from "./utilities";

export function registerRoutes(app: Hono, options: any) {
	const {
		abilityListCacheTtlMs,
		cache,
		getAbilityDetail,
		getPokemonDetail,
		maxCacheSize,
		pokeApiGraphqlUrl,
		pokemonListCacheTtlMs,
	} = options;

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

	app.get("/ability/all", async (c) => {
		const language = c.req.query("language");
		debug("GET /ability/all", { language });

		if (!language) {
			return c.json({ error: "language is required" }, 400);
		}

		const cacheKey = `ability:all:${language}`;
		const cached = getCachedValue<any>(cache, cacheKey);

		if (cached) {
			debug("Cache hit for ability list:", { cacheKey, count: cached.length });
			return c.json({ abilities: cached });
		}

		try {
			const data = await queryGraphql<any>(
				pokeApiGraphqlUrl,
				`
					query AbilityList($language: String!) {
						abilityname(
							where: { language: { name: { _eq: $language } } }
							order_by: { ability_id: asc }
						) {
							name
							ability_id
						}
					}
				`,
				{ language },
			);

			const abilities = data.abilityname.map((item: any) => ({
				id: item.ability_id,
				name: item.name,
			}));

			debug("Caching ability list:", { cacheKey, count: abilities.length });
			setCachedValue(cache, maxCacheSize, cacheKey, abilities, abilityListCacheTtlMs);
			return c.json({ abilities });
		} catch (err) {
			debug("Error loading ability list:", err);
			return c.json({ error: "Could not load ability list" }, 502);
		}
	});

	app.get("/ability", async (c) => {
		const language = c.req.query("language");
		const id = c.req.query("id");
		debug("GET /ability", { id, language });

		const hasValidId = /^\d+$/.test(id ?? "");

		if (!language || !hasValidId) {
			return c.json({ error: "language and id are required" }, 400);
		}

		try {
			const ability = await getAbilityDetail(id ?? "", language);
			debug("Successfully fetched ability:", { id, name: ability.name });
			return c.json(ability);
		} catch (err) {
			debug("Error loading ability:", err);
			return c.json({ error: "Could not load ability data" }, 502);
		}
	});
}
