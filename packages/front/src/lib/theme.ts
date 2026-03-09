export type Theme = "light" | "dark" | "system";

const storageKey = "theme";

function getSystemTheme(): Exclude<Theme, "system"> {
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getAppliedTheme(theme: Theme): Exclude<Theme, "system"> {
	return theme === "system" ? getSystemTheme() : theme;
}

export function applyTheme(theme: Theme): void {
	const appliedTheme = getAppliedTheme(theme);
	document.documentElement.classList.toggle("dark", appliedTheme === "dark");
}

export function getSavedTheme(): Theme {
	const theme = localStorage.getItem(storageKey);

	if (theme === "light" || theme === "dark" || theme === "system") {
		return theme;
	}

	return "system";
}

export function setTheme(theme: Theme): void {
	localStorage.setItem(storageKey, theme);
	applyTheme(theme);
}

export function initTheme(): Theme {
	const theme = getSavedTheme();
	applyTheme(theme);
	return theme;
}
