import type { Hono } from "hono";
import { getCachedValue, queryGraphql, setCachedValue } from "./utilities";

export function registerRoutes(app: Hono, options: any) {
	const { cache, getPokemonDetail, maxCacheSize, pokeApiGraphqlUrl, pokemonListCacheTtlMs } =
		options;

	app.get("/", (c) => {
		return c.text("Hello Hono!");
	});

	app.get("/pokemon/all", async (c) => {
		const language = c.req.query("language");

		if (!language) {
			return c.json({ error: "language is required" }, 400);
		}

		const cacheKey = `pokemon:all:${language}`;
		const cachedPokemon = getCachedValue<any>(cache, cacheKey);

		if (cachedPokemon) {
			return c.json({ pokemon: cachedPokemon });
		}

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
						}
					}
				`,
				{ language },
			);
			const pokemon = data.pokemonspeciesname.map((item: any) => ({
				id: item.pokemon_species_id,
				name: item.name,
			}));

			setCachedValue(cache, maxCacheSize, cacheKey, pokemon, pokemonListCacheTtlMs);

			return c.json({ pokemon });
		} catch {
			return c.json({ error: "Could not load Pokémon list" }, 502);
		}
	});

	app.get("/pokemon", async (c) => {
		const generation = Number(c.req.query("generation"));
		const language = c.req.query("language");
		const id = c.req.query("id");
		const hasValidGeneration =
			Number.isInteger(generation) && generation >= 1 && generation <= 9;
		const hasValidId = /^\d+$/.test(id ?? "");

		if (!language || !hasValidId || !hasValidGeneration) {
			return c.json({ error: "generation, language and id are required" }, 400);
		}

		const pokemonId = id ?? "";

		try {
			const pokemon = await getPokemonDetail(pokemonId, generation, language);
			return c.json(pokemon);
		} catch {
			return c.json({ error: "Could not load Pokémon data" }, 502);
		}
	});
}
