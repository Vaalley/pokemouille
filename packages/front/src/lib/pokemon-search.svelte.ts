import { getSavedLanguage, type Language } from "$lib/language";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type PokemonListItem = {
	id: number;
	name: string;
	types: string[];
	sprite: string | null;
};

export type AbilityListItem = {
	id: number;
	name: string;
	shortEffect: string | null;
};

export type MoveListItem = {
	id: number;
	name: string;
	typeSlug: string | null;
	damageClass: string | null;
};

export type ItemListItem = {
	id: number;
	name: string;
	sprite: string | null;
	pocket: string | null;
};

export const searchState = $state({
	isOpen: false,
	query: "",
	pokemonList: [] as PokemonListItem[],
	abilityList: [] as AbilityListItem[],
	moveList: [] as MoveListItem[],
	itemList: [] as ItemListItem[],
	isLoading: false,
	errorMessage: "",
	listLanguage: "" as Language | "",
});

let preloadPromise: Promise<void> | null = null;

export async function preloadPokemonList(language: Language): Promise<void> {
	if (
		searchState.listLanguage === language &&
		searchState.pokemonList.length > 0 &&
		searchState.abilityList.length > 0 &&
		searchState.moveList.length > 0 &&
		searchState.itemList.length > 0
	) {
		return;
	}

	if (preloadPromise) {
		await preloadPromise;
		if (
			searchState.listLanguage === language &&
			searchState.pokemonList.length > 0 &&
			searchState.abilityList.length > 0 &&
			searchState.moveList.length > 0 &&
			searchState.itemList.length > 0
		) {
			return;
		}
	}

	preloadPromise = (async () => {
		searchState.isLoading = true;
		searchState.errorMessage = "";

		try {
			const searchParams = new URLSearchParams({
				language,
			});
			const [pokemonRes, abilityRes, moveRes, itemRes] = await Promise.all([
				fetch(`${apiBaseUrl}/pokemon/all?${searchParams.toString()}`),
				fetch(`${apiBaseUrl}/ability/all?${searchParams.toString()}`),
				fetch(`${apiBaseUrl}/move/all?${searchParams.toString()}`),
				fetch(`${apiBaseUrl}/item/all?${searchParams.toString()}`),
			]);

			if (!pokemonRes.ok) throw new Error("Failed to load Pokémon list.");
			if (!abilityRes.ok) throw new Error("Failed to load ability list.");
			if (!moveRes.ok) throw new Error("Failed to load move list.");
			if (!itemRes.ok) throw new Error("Failed to load item list.");

			const [pokemonData, abilityData, moveData, itemData] = await Promise.all([
				pokemonRes.json(),
				abilityRes.json(),
				moveRes.json(),
				itemRes.json(),
			]);

			searchState.pokemonList = pokemonData.pokemon || [];
			searchState.abilityList = abilityData.abilities || [];
			searchState.moveList = moveData.moves || [];
			searchState.itemList = itemData.items || [];
			searchState.listLanguage = language;
		} catch {
			searchState.pokemonList = [];
			searchState.abilityList = [];
			searchState.moveList = [];
			searchState.itemList = [];
			searchState.listLanguage = "";
			searchState.errorMessage = "Could not load search data.";
		} finally {
			searchState.isLoading = false;
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
	searchState.isOpen = true;
	searchState.query = query;
}

export function closePokemonSearch(): void {
	searchState.isOpen = false;
	searchState.query = "";
}

export function setPokemonSearchQuery(query: string): void {
	searchState.query = query;
}
