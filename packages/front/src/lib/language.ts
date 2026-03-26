export const languages = [
	{ code: "en", label: "English" },
	{ code: "fr", label: "Français" },
	{ code: "ja", label: "日本語" },
	{ code: "de", label: "Deutsch" },
	{ code: "es", label: "Español" },
] as const;

export type Language = (typeof languages)[number]["code"];

const storageKey = "language";

export function getSavedLanguage(): Language {
	if (typeof localStorage === "undefined") return "en";
	const language = localStorage.getItem(storageKey);

	if (language && languages.some((item) => item.code === language)) {
		return language as Language;
	}

	return "en";
}

export function setLanguage(language: Language): void {
	localStorage.setItem(storageKey, language);
	window.dispatchEvent(new CustomEvent("languagechange", { detail: language }));
}
