import { error } from "@sveltejs/kit";
import { generations } from "$lib/generation";
import { languages } from "$lib/language";
import { apiBaseUrl } from "$lib/api";

export async function load({
	params,
	fetch,
}: {
	params: { generation: string; language: string; id: string };
	fetch: typeof globalThis.fetch;
}) {
	const hasSupportedLanguage = languages.some((item) => item.code === params.language);
	const generation = Number(params.generation);
	const hasSupportedGeneration = generations.some((item) => item.value === generation);
	const hasValidPokemonId = /^\d+$/.test(params.id);

	if (!hasSupportedLanguage || !hasSupportedGeneration || !hasValidPokemonId) {
		throw error(404, "Not found");
	}

	const searchParams = new URLSearchParams({
		generation: params.generation,
		id: params.id,
		language: params.language,
	});
	const response = await fetch(`${apiBaseUrl}/pokemon?${searchParams.toString()}`);

	if (!response.ok) {
		throw error(502, "Could not load Pokémon data");
	}

	let pokemon = await response.json();

	const gameIndices: { generationId: number | null }[] = pokemon.gameIndices ?? [];
	const availableGens = gameIndices
		.map((gi) => gi.generationId)
		.filter((g): g is number => g !== null);
	const maxAvailableGen = availableGens.length > 0 ? Math.max(...availableGens) : null;

	if (maxAvailableGen !== null && generation > maxAvailableGen) {
		const clampedParams = new URLSearchParams({
			generation: String(maxAvailableGen),
			id: params.id,
			language: params.language,
		});
		const clampedResponse = await fetch(`${apiBaseUrl}/pokemon?${clampedParams.toString()}`);
		if (clampedResponse.ok) {
			pokemon = await clampedResponse.json();
		}
		return {
			generation: maxAvailableGen,
			requestedGeneration: generation,
			id: params.id,
			language: params.language,
			pokemon,
		};
	}

	return {
		generation,
		requestedGeneration: null,
		id: params.id,
		language: params.language,
		pokemon,
	};
}
