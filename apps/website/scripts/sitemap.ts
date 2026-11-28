import { isLanguage } from "../src/lib/i18n/core.ts";
import { SITE_ORIGIN } from "../src/lib/site.ts";

export function createSitemap(prerenderedPaths: Iterable<string>): string {
  const pages = [...prerenderedPaths].filter((path) => isLanguage(path.split("/")[1])).sort();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((path) => {
      // Kit supplies decoded pathnames. Encode the URLs, then escape XML text.
      const location = `${SITE_ORIGIN}${encodeURI(path)}`.replaceAll("&", "&amp;");
      return `  <url><loc>${location}</loc></url>`;
    }),
    "</urlset>",
    "",
  ].join("\n");
}
