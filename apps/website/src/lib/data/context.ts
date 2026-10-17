import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
import { DEFAULT_LANGUAGE, isLanguage } from "../i18n/core.ts";
import type { Language } from "../i18n/core.ts";

/** The game every visitor sees until they choose one. Always published (see tools/data publish). */
export const DEFAULT_VERSION = "scarlet";

export interface PokemonContext {
  language: Language;
  version: string;
  versionSource: "url" | "preference" | "default";
  /** `?form=` as given; resolvePokemonView decides whether it exists. */
  form: string | null;
  /** An explicit `?version=` that is not a selectable game; never used as the active version. */
  rejectedVersion: string | null;
}

export interface ContextInput {
  url: { readonly searchParams: Pick<URLSearchParams, "get"> };
  language: Language;
  games: readonly Pick<GameOption, "version">[];
  savedVersion: string | null;
}

/** Explicit valid `?version=` → valid saved preference → Scarlet. */
export function resolveContext({
  url,
  language,
  games,
  savedVersion,
}: ContextInput): PokemonContext {
  const selectable = (version: string | null): version is string =>
    version !== null && games.some((game) => game.version.identifier === version);
  const requested = url.searchParams.get("version") || null;
  const form = url.searchParams.get("form") || null;
  if (selectable(requested))
    return { language, version: requested, versionSource: "url", form, rejectedVersion: null };
  const fallback = selectable(savedVersion)
    ? { version: savedVersion, versionSource: "preference" as const }
    : { version: DEFAULT_VERSION, versionSource: "default" as const };
  return { language, ...fallback, form, rejectedVersion: requested };
}

/** Materialized detail-page pathname (no base path; callers wrap with `resolve`). */
export function pokemonHref(
  language: Language,
  speciesId: number,
  { version, form }: { version: string; form?: string | null },
): string {
  const query = new URLSearchParams({ version });
  if (form) query.set("form", form);
  return `/${language}/pokemon/${speciesId}/?${query}`;
}

/** Same page in another language: first path segment replaced, query and hash preserved. */
export function swapLanguageHref(
  url: { readonly pathname: string; readonly search: string; readonly hash: string },
  language: Language,
): string {
  const segments = url.pathname.split("/");
  if (isLanguage(segments[1])) segments[1] = language;
  else segments.splice(1, 0, language);
  return `${segments.join("/")}${url.search}${url.hash}`;
}

/** Saved valid language → first browser language supported by primary subtag → English. */
export function pickRootLanguage(
  saved: string | null,
  browserLanguages: readonly string[],
): Language {
  if (isLanguage(saved)) return saved;
  for (const tag of browserLanguages) {
    const primary = tag.toLowerCase().split(/[-_]/)[0];
    if (isLanguage(primary)) return primary;
  }
  return DEFAULT_LANGUAGE;
}

export type PreferenceKey = "version" | "language";
const STORAGE_KEYS: Record<PreferenceKey, string> = {
  version: "pokemouille.version",
  language: "pokemouille.language",
};

// Storage is absent during SSR/prerender and may throw when blocked by the browser;
// preferences are a convenience, so both cases degrade to "no preference".
export function readPreference(key: PreferenceKey): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEYS[key]);
  } catch {
    return null;
  }
}

export function writePreference(key: PreferenceKey, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS[key], value);
  } catch {
    // Disabled, blocked, or full storage: the URL still carries the context.
  }
}
