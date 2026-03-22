import { derived, get, writable } from "svelte/store";
import { getSavedLanguage, type Language } from "$lib/language";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type PokemonListItem = {
	id: number;
	name: string;
};

export type AbilityListItem = {
	id: number;
	name: string;
};

export const isPokemonSearchOpen = writable(false);
export const pokemonSearchQuery = writable("");
export const pokemonList = writable<PokemonListItem[]>([]);
export const abilityList = writable<AbilityListItem[]>([]);
export const isPokemonListLoading = writable(false);
export const pokemonListErrorMessage = writable("");

const listLanguage = writable<Language>("en");
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

export const filteredAbilities = derived(
	[abilityList, pokemonSearchQuery],
	([$abilityList, $pokemonSearchQuery]) => {
		const query = $pokemonSearchQuery.trim().toLowerCase();

		if (!query) return [];

		return $abilityList.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 20);
	},
);

export async function preloadPokemonList(language: Language): Promise<void> {
	if (get(listLanguage) === language && get(pokemonList).length > 0) {
		return;
	}

	if (preloadPromise) {
		await preloadPromise;

		if (get(listLanguage) === language && get(pokemonList).length > 0) {
			return;
		}
	}

	preloadPromise = (async () => {
		isPokemonListLoading.set(true);
		pokemonListErrorMessage.set("");

		try {
			const searchParams = new URLSearchParams({ language });
			const [pokemonRes, abilityRes] = await Promise.all([
				fetch(`${apiBaseUrl}/pokemon/all?${searchParams.toString()}`),
				fetch(`${apiBaseUrl}/ability/all?${searchParams.toString()}`),
			]);

			if (!pokemonRes.ok) throw new Error("Failed to load Pokémon list.");
			if (!abilityRes.ok) throw new Error("Failed to load ability list.");

			const [pokemonData, abilityData] = await Promise.all([
				pokemonRes.json(),
				abilityRes.json(),
			]);

			pokemonList.set(pokemonData.pokemon || []);
			abilityList.set(abilityData.abilities || []);
			listLanguage.set(language);
		} catch {
			pokemonList.set([]);
			abilityList.set([]);
			pokemonListErrorMessage.set("Could not load search data.");
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
