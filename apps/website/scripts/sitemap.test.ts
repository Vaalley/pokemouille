import { expect, it } from "vite-plus/test";
import { createSitemap } from "./sitemap.ts";

it("lists only localized prerendered pages, preserving page paths and escaping XML", () => {
  const sitemap = createSitemap([
    "/ja/ピカチュウ&/",
    "/",
    "/english/",
    "/fr/pokedex/page/2/",
    "/en/",
  ]);

  expect(sitemap.match(/<loc>[^<]+<\/loc>/g)).toEqual([
    "<loc>https://pokemouille.app/en/</loc>",
    "<loc>https://pokemouille.app/fr/pokedex/page/2/</loc>",
    "<loc>https://pokemouille.app/ja/%E3%83%94%E3%82%AB%E3%83%81%E3%83%A5%E3%82%A6&amp;/</loc>",
  ]);
});
