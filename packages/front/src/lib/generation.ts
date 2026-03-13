export const generations = [
	{ value: 1, label: "Gen 1" },
	{ value: 2, label: "Gen 2" },
	{ value: 3, label: "Gen 3" },
	{ value: 4, label: "Gen 4" },
	{ value: 5, label: "Gen 5" },
	{ value: 6, label: "Gen 6" },
	{ value: 7, label: "Gen 7" },
	{ value: 8, label: "Gen 8" },
	{ value: 9, label: "Gen 9" },
] as const;

export type Generation = (typeof generations)[number]["value"];

const storageKey = "generation";

export function getSavedGeneration(): Generation {
	const generation = Number(localStorage.getItem(storageKey));

	if (generations.some((item) => item.value === generation)) {
		return generation as Generation;
	}

	return 1;
}

export function setGeneration(generation: Generation): void {
	localStorage.setItem(storageKey, String(generation));
	window.dispatchEvent(new CustomEvent("generationchange", { detail: generation }));
}
