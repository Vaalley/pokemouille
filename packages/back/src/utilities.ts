export function getCachedValue<T>(
	cache: Map<string, { expiresAt: number; value: unknown }>,
	key: string,
): T | null {
	const cachedEntry = cache.get(key);

	if (!cachedEntry) {
		return null;
	}

	if (cachedEntry.expiresAt <= Date.now()) {
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
	const response = await fetch(pokeApiGraphqlUrl, {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});

	if (!response.ok) {
		throw new Error("Could not load Pokémon data");
	}

	const result = await response.json();

	if (result.errors?.length) {
		throw new Error(result.errors[0].message);
	}

	return result.data as T;
}
