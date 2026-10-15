import type { Handle } from "@sveltejs/kit/hooks";

const LANGUAGES: Record<string, true> = { en: true, fr: true, ja: true };

// Prerendered HTML must declare the route's language, not a single site-wide default.
export const handle: Handle = ({ event, resolve }) => {
  const segment = event.url.pathname.split("/")[1] ?? "";
  const lang = LANGUAGES[segment] ? segment : "en";
  return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", lang) });
};
