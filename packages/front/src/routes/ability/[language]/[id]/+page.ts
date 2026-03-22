import { error } from "@sveltejs/kit";
import { languages } from "$lib/language";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function load({
	params,
	fetch,
}: {
	params: { language: string; id: string };
	fetch: typeof globalThis.fetch;
}) {
	const hasSupportedLanguage = languages.some((item) => item.code === params.language);
	const hasValidId = /^\d+$/.test(params.id);

	if (!hasSupportedLanguage || !hasValidId) {
		throw error(404, "Not found");
	}

	const searchParams = new URLSearchParams({ id: params.id, language: params.language });
	const response = await fetch(`${apiBaseUrl}/ability?${searchParams.toString()}`);

	if (!response.ok) {
		throw error(502, "Could not load ability data");
	}

	const ability = await response.json();

	return {
		id: params.id,
		language: params.language,
		ability,
	};
}
