import { error } from "@sveltejs/kit";
import { languages } from "$lib/language";
import { generations } from "$lib/generation";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function load({
	params,
	fetch,
}: {
	params: {
		language: string;
		generation: string;
		id: string;
	};
	fetch: typeof globalThis.fetch;
}) {
	const hasSupportedLanguage = languages.some((item) => item.code === params.language);
	const hasValidId = /^\d+$/.test(params.id);
	const generation = Number(params.generation);
	const hasValidGeneration = generations.some((g) => g.value === generation);

	if (!hasSupportedLanguage || !hasValidId || !hasValidGeneration) {
		throw error(404, "Not found");
	}

	const searchParams = new URLSearchParams({
		id: params.id,
		language: params.language,
		generation: params.generation,
	});
	const response = await fetch(`${apiBaseUrl}/move?${searchParams.toString()}`);

	if (!response.ok) {
		throw error(502, "Could not load move data");
	}

	const move = await response.json();

	return {
		id: params.id,
		language: params.language,
		generation,
		move,
	};
}
