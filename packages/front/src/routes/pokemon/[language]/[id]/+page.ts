import { error, redirect } from "@sveltejs/kit";
import { languages } from "$lib/language";

export async function load({ params }: { params: { language: string; id: string } }) {
	const hasSupportedLanguage = languages.some((item) => item.code === params.language);
	const hasValidPokemonId = /^\d+$/.test(params.id);

	if (!hasSupportedLanguage || !hasValidPokemonId) {
		throw error(404, "Not found");
	}

	throw redirect(307, `/pokemon/${params.language}/1/${params.id}`);
}
