import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { debug, MAX_CACHE_SIZE, POKEAPI_GRAPHQL_URL } from "./utilities";
import { setupRoutes } from "./routes";

function main() {
	const app = new Hono();

	debug("Backend initialized with config:", {
		pokeApiGraphqlUrl: POKEAPI_GRAPHQL_URL,
		maxCacheSize: MAX_CACHE_SIZE,
	});

	app.use("*", cors({ origin: Bun.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
	app.use("*", compress());

	setupRoutes(app);

	return app;
}

const app = main();
export default app;
