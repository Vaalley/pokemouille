import type { Handle } from "@sveltejs/kit/hooks";
import { asset } from "$app/paths";
import type { AssetPath } from "$app/types";
import { datasetFiles } from "../../../packages/pokemon-data/src/index.ts";
import { datasetPath } from "#lib/data/dataset.ts";

const LANGUAGES: Record<string, true> = { en: true, fr: true, ja: true };

export const handle: Handle = ({ event, resolve }) => {
  const segment = event.url.pathname.split("/")[1] ?? "";
  const localized = LANGUAGES[segment] === true;
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      // Prerendered HTML must declare the route's language, not a single site-wide default.
      const page = html.replace("%lang%", localized ? segment : "en");
      if (!localized) return page;
      // Every localized layout loads the games; pages add their own files. Downloads then
      // start with the document instead of after hydration. `crossorigin` matches the
      // loader's same-origin fetch() mode, so the browser reuses each preloaded response.
      const links = [datasetFiles.games, ...(event.locals.dataPreloads ?? [])]
        .map(
          (file) =>
            `<link rel="preload" as="fetch" crossorigin href="${asset(datasetPath(file) as AssetPath)}">`,
        )
        .join("");
      // Static HTML cannot know local storage or query-selected forms. Discover the default
      // image during head parsing only when it matches the visitor's initial selection.
      const artwork = event.locals.artworkPreload;
      const imagePreload = artwork
        ? `<script>(function () {
          if (new URLSearchParams(location.search).get("form")) return;
          var sprite;
          try { sprite = localStorage.getItem("pokemouille.sprite"); } catch {}
          if (sprite && sprite !== "official") return;
          var link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.fetchPriority = "high";
          link.href = ${JSON.stringify(artwork).replaceAll("<", "\\u003c")};
          document.head.appendChild(link);
        })();</script>`
        : "";
      return page.replace("</head>", `${links}${imagePreload}</head>`);
    },
  });
};
