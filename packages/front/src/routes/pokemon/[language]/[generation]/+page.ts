import { error } from "@sveltejs/kit";
import { generations } from "$lib/generation";
import { languages } from "$lib/language";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function load({
	params,
	fetch,
}: {
	params: { generation: string; language: string };
	fetch: typeof globalThis.fetch;
}) {
	const hasSupportedLanguage = languages.some((item) => item.code === params.language);
	const generation = Number(params.generation);
	const hasSupportedGeneration = generations.some((item) => item.value === generation);

	if (!hasSupportedLanguage || !hasSupportedGeneration) {
		throw error(404, "Not found");
	}

	const searchParams = new URLSearchParams({ language: params.language });
	const response = await fetch(`${apiBaseUrl}/pokemon/all?${searchParams.toString()}`);

	if (!response.ok) {
		throw error(502, "Could not load Pokémon list");
	}

	const data = await response.json();

	return {
		generation,
		language: params.language,
		pokemon: (data.pokemon ?? []) as {
			id: number;
			name: string;
			generationId: number | null;
		}[],
	};
}
