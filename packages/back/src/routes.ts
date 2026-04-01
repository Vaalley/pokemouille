import type { Hono } from "hono";
import { debug } from "./utilities";
import { getAbilityDetail, getAbilityList } from "./ability";
import { getItemDetail, getItemList } from "./item";
import { getMoveDetail, getMoveList } from "./move";
import { getPokemonDetail, getPokemonList } from "./pokemon";

function parseDetailParams(
	id: string | undefined,
	generation: string | undefined,
	language: string | undefined,
) {
	const gen = Number(generation);
	const hasValidId = /^\d+$/.test(id ?? "");
	const hasValidGeneration = Number.isInteger(gen) && gen >= 1 && gen <= 9;
	if (!language || !hasValidId || !hasValidGeneration) return null;
	return {
		id: id as string,
		generation: gen,
		language,
	};
}

export function setupRoutes(app: Hono) {
	app.get("/", (c) => {
		return c.text("Hello Hono!");
	});

	app.get("/pokemon/all", async (c) => {
		const language = c.req.query("language");
		debug("GET /pokemon/all", {
			language,
		});

		if (!language) {
			return c.json(
				{
					error: "language is required",
				},
				400,
			);
		}

		try {
			const pokemon = await getPokemonList(language);
			return c.json({
				pokemon,
			});
		} catch (error) {
			debug("Error loading Pokemon list:", error);
			return c.json(
				{
					error: "Could not load Pokémon list",
				},
				502,
			);
		}
	});

	app.get("/pokemon", async (c) => {
		const params = parseDetailParams(
			c.req.query("id"),
			c.req.query("generation"),
			c.req.query("language"),
		);
		debug("GET /pokemon", params);

		if (!params)
			return c.json(
				{
					error: "generation, language and id are required",
				},
				400,
			);

		try {
			const pokemon = await getPokemonDetail(params.id, params.generation, params.language);
			debug("Successfully fetched Pokemon:", {
				id: params.id,
				name: pokemon.name,
			});
			return c.json(pokemon);
		} catch (error) {
			debug("Error loading Pokemon data:", error);
			return c.json(
				{
					error: "Could not load Pokémon data",
				},
				502,
			);
		}
	});

	app.get("/ability/all", async (c) => {
		const language = c.req.query("language");
		debug("GET /ability/all", {
			language,
		});

		if (!language) {
			return c.json(
				{
					error: "language is required",
				},
				400,
			);
		}

		try {
			const abilities = await getAbilityList(language);
			return c.json({
				abilities,
			});
		} catch (err) {
			debug("Error loading ability list:", err);
			return c.json(
				{
					error: "Could not load ability list",
				},
				502,
			);
		}
	});

	app.get("/ability", async (c) => {
		const params = parseDetailParams(
			c.req.query("id"),
			c.req.query("generation"),
			c.req.query("language"),
		);
		debug("GET /ability", params);

		if (!params)
			return c.json(
				{
					error: "language, id and generation are required",
				},
				400,
			);

		try {
			const ability = await getAbilityDetail(params.id, params.language, params.generation);
			debug("Successfully fetched ability:", {
				id: params.id,
				name: ability.name,
			});
			return c.json(ability);
		} catch (err) {
			debug("Error loading ability:", err);
			return c.json(
				{
					error: "Could not load ability data",
				},
				502,
			);
		}
	});

	app.get("/move/all", async (c) => {
		const language = c.req.query("language");
		debug("GET /move/all", {
			language,
		});

		if (!language) {
			return c.json(
				{
					error: "language is required",
				},
				400,
			);
		}

		try {
			const moves = await getMoveList(language);
			return c.json({
				moves,
			});
		} catch (err) {
			debug("Error loading move list:", err);
			return c.json(
				{
					error: "Could not load move list",
				},
				502,
			);
		}
	});

	app.get("/move", async (c) => {
		const params = parseDetailParams(
			c.req.query("id"),
			c.req.query("generation"),
			c.req.query("language"),
		);
		debug("GET /move", params);

		if (!params)
			return c.json(
				{
					error: "language, id and generation are required",
				},
				400,
			);

		try {
			const move = await getMoveDetail(params.id, params.generation, params.language);
			debug("Successfully fetched move:", {
				id: params.id,
				name: move.name,
			});
			return c.json(move);
		} catch (err) {
			debug("Error loading move:", err);
			return c.json(
				{
					error: "Could not load move data",
				},
				502,
			);
		}
	});

	app.get("/item/all", async (c) => {
		const language = c.req.query("language");
		debug("GET /item/all", {
			language,
		});

		if (!language) {
			return c.json(
				{
					error: "language is required",
				},
				400,
			);
		}

		try {
			const items = await getItemList(language);
			return c.json({
				items,
			});
		} catch (err) {
			debug("Error loading item list:", err);
			return c.json(
				{
					error: "Could not load item list",
				},
				502,
			);
		}
	});

	app.get("/item", async (c) => {
		const params = parseDetailParams(
			c.req.query("id"),
			c.req.query("generation"),
			c.req.query("language"),
		);
		debug("GET /item", params);

		if (!params)
			return c.json(
				{
					error: "language, id and generation are required",
				},
				400,
			);

		try {
			const item = await getItemDetail(params.id, params.language, params.generation);
			debug("Successfully fetched item:", {
				id: params.id,
				name: item.name,
			});
			return c.json(item);
		} catch (err) {
			debug("Error loading item:", err);
			return c.json(
				{
					error: "Could not load item data",
				},
				502,
			);
		}
	});
}
