import { error } from "@sveltejs/kit";
import { languages } from "$lib/language";
import { generations } from "$lib/generation";
import { apiBaseUrl } from "$lib/api";

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

	let move = await response.json();

	const introducedGen: number | null = move.generationId ?? null;

	if (introducedGen !== null && generation < introducedGen) {
		const clampedParams = new URLSearchParams({
			id: params.id,
			language: params.language,
			generation: String(introducedGen),
		});
		const clampedResponse = await fetch(`${apiBaseUrl}/move?${clampedParams.toString()}`);
		if (clampedResponse.ok) {
			move = await clampedResponse.json();
		}
		return {
			id: params.id,
			language: params.language,
			generation: introducedGen,
			requestedGeneration: generation,
			move,
		};
	}

	return {
		id: params.id,
		language: params.language,
		generation,
		requestedGeneration: null,
		move,
	};
}
