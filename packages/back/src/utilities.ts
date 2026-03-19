const DEBUG_MODE = Bun.env.DEBUG_MODE === "true";

export function debug(...args: unknown[]): void {
	if (DEBUG_MODE) {
		const timestamp = new Date().toISOString();
		console.log(`[DEBUG ${timestamp}]`, ...args);
	}
}

export function getCachedValue<T>(
	cache: Map<string, { expiresAt: number; value: unknown }>,
	key: string,
): T | null {
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

export function setCachedValue(
	cache: Map<string, { expiresAt: number; value: unknown }>,
	maxCacheSize: number,
	key: string,
	value: unknown,
	ttlMs: number,
): void {
	if (cache.has(key)) {
		cache.delete(key);
	}

	cache.set(key, {
		expiresAt: Date.now() + ttlMs,
		value,
	});

	if (cache.size > maxCacheSize) {
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
	pokeApiGraphqlUrl: string,
	query: string,
	variables: Record<string, unknown>,
): Promise<T> {
	debug("GraphQL query:", { url: pokeApiGraphqlUrl, variables });
	const response = await fetch(pokeApiGraphqlUrl, {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		debug("GraphQL HTTP error:", { status: response.status, statusText: response.statusText });
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
