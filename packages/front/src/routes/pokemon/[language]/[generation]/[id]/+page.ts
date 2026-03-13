import { error } from "@sveltejs/kit";
import { generations } from "$lib/generation";
import { languages } from "$lib/language";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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

	const pokemon = await response.json();

	return {
		generation,
		id: params.id,
		language: params.language,
		pokemon,
	};
}
