import { derived, get, writable } from "svelte/store";
import { getSavedLanguage, type Language } from "$lib/language";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type PokemonListItem = {
	id: number;
	name: string;
};

export const isPokemonSearchOpen = writable(false);
export const pokemonSearchQuery = writable("");
export const pokemonList = writable<PokemonListItem[]>([]);
export const isPokemonListLoading = writable(false);
export const pokemonListErrorMessage = writable("");

const pokemonListLanguage = writable<Language>("en");
let preloadPromise: Promise<void> | null = null;

export const filteredPokemon = derived(
	[pokemonList, pokemonSearchQuery],
	([$pokemonList, $pokemonSearchQuery]) => {
		const query = $pokemonSearchQuery.trim().toLowerCase();

		if (!query) {
			return $pokemonList.slice(0, 60);
		}

		return $pokemonList
			.filter((item) => {
				const normalizedId = String(item.id);
				const normalizedName = item.name.toLowerCase();

				return normalizedId.includes(query) || normalizedName.includes(query);
			})
			.slice(0, 60);
	},
);

export async function preloadPokemonList(language: Language): Promise<void> {
	if (get(pokemonListLanguage) === language && get(pokemonList).length > 0) {
		return;
	}

	if (preloadPromise) {
		await preloadPromise;

		if (get(pokemonListLanguage) === language && get(pokemonList).length > 0) {
			return;
		}
	}

	preloadPromise = (async () => {
		isPokemonListLoading.set(true);
		pokemonListErrorMessage.set("");

		try {
			const searchParams = new URLSearchParams({ language });
			const response = await fetch(`${apiBaseUrl}/pokemon/all?${searchParams.toString()}`);

			if (!response.ok) {
				throw new Error("Failed to load Pokémon list.");
			}

			const data = await response.json();
			pokemonList.set(data.pokemon || []);
			pokemonListLanguage.set(language);
		} catch {
			pokemonList.set([]);
			pokemonListErrorMessage.set("Could not load Pokémon list.");
		} finally {
			isPokemonListLoading.set(false);
		}
	})();

	try {
		await preloadPromise;
	} finally {
		preloadPromise = null;
	}
}

export function syncPokemonListToSavedLanguage(): Promise<void> {
	return preloadPokemonList(getSavedLanguage());
}

export function openPokemonSearch(query = ""): void {
	isPokemonSearchOpen.set(true);
	pokemonSearchQuery.set(query);
}

export function closePokemonSearch(): void {
	isPokemonSearchOpen.set(false);
	pokemonSearchQuery.set("");
}

export function setPokemonSearchQuery(query: string): void {
	pokemonSearchQuery.set(query);
}
