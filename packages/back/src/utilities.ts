const DEBUG_MODE = Bun.env.DEBUG_MODE === "true";

export const POKEAPI_GRAPHQL_URL =
	Bun.env.POKEAPI_GRAPHQL_URL || "https://graphql.pokeapi.co/v1beta2";
export const MAX_CACHE_SIZE = 10000;
export const cache = new Map<string, { expiresAt: number; value: unknown }>();

export function debug(...args: unknown[]): void {
	if (DEBUG_MODE) {
		const now = new Date();
		const timestamp = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
		console.log(`[${timestamp}]`, ...args);
	}
}

export function getCachedValue<T>(key: string): T | null {
	const cachedEntry = cache.get(key);

	if (!cachedEntry) {
		debug("Cache miss (no entry):", key);
		return null;
	}

	if (cachedEntry.expiresAt <= Date.now()) {
		debug("Cache expired:", key);
		cache.delete(key);
		return null;
	}

	cache.delete(key);
	cache.set(key, cachedEntry);

	return cachedEntry.value as T;
}

export function setCachedValue(key: string, value: unknown, ttlMs: number): void {
	cache.set(key, {
		expiresAt: Date.now() + ttlMs,
		value,
	});

	if (cache.size > MAX_CACHE_SIZE) {
		const oldestKey = cache.keys().next().value;

		if (oldestKey) {
			debug("Cache eviction (max size reached):", {
				evicted: oldestKey,
				cacheSize: cache.size,
			});
			cache.delete(oldestKey);
		}
	}
}

export function normalizeFlavorText(flavorText: string): string {
	return flavorText.replace(/\f/g, " ").replace(/\n/g, " ");
}

export async function queryGraphql<T>(
	query: string,
	variables: Record<string, unknown>,
): Promise<T> {
	debug("GraphQL query:", {
		url: POKEAPI_GRAPHQL_URL,
		variables,
	});
	const response = await fetch(POKEAPI_GRAPHQL_URL, {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({
			query,
			variables,
		}),
		signal: AbortSignal.timeout(10_000),
	});

	if (!response.ok) {
		debug("GraphQL HTTP error:", {
			status: response.status,
			statusText: response.statusText,
		});
		throw new Error("Could not load Pokémon data");
	}

	const result = await response.json();

	if (result.errors?.length) {
		debug("GraphQL query errors:", result.errors);
		throw new Error(result.errors[0].message);
	}

	debug("GraphQL query successful");

	return result.data as T;
}
