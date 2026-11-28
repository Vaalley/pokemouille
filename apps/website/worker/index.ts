// Check the legacy hostname before serving any assets, including prerendered HTML.
// The dataset is excluded from deployed assets (static/.assetsignore) and served from R2;
// R2 also retains earlier `_app/immutable` chunks and revision-pinned derived files so tabs
// opened before a deploy keep working.
import { isDerivedDataKey } from "../derived-assets.ts";
import { SITE_ORIGIN } from "../src/lib/site.ts";

interface Env {
  ASSETS: Pick<Fetcher, "fetch">;
  DATA: Pick<R2Bucket, "get">;
}

const IMMUTABLE = "public, max-age=31536000, immutable";
const LEGACY_HOST = "pokemouille.vaaleyou.workers.dev";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: Pick<ExecutionContext, "waitUntil">,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === LEGACY_HOST) {
      return Response.redirect(`${SITE_ORIGIN}${url.href.slice(url.origin.length)}`, 308);
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return env.ASSETS.fetch(request);
    }
    let key: string;
    try {
      key = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return new Response("Not found", { status: 404 });
    }
    // The dataset is never uploaded as static assets. Other public files take the
    // static path first, with R2 used only for retained chunks or projections.
    if (key !== "data/manifest.json" && !key.startsWith("data/revisions/")) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404 || (!key.startsWith("_app/immutable/") && !isDerivedDataKey(key))) {
        return asset;
      }
      await asset.body?.cancel();
    }

    // The root manifest is mutable: always revalidate. Everything else is content-addressed.
    const immutable = key !== "data/manifest.json";
    const cache = caches.default;
    if (immutable && request.method === "GET") {
      const cached = await cache.match(request);
      if (cached) return cached;
    }

    const object = await env.DATA.get(key, { onlyIf: request.headers });
    if (object === null) return new Response("Not found", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", immutable ? IMMUTABLE : "no-cache");
    if (!("body" in object)) return new Response(null, { status: 304, headers });

    const response = new Response(request.method === "HEAD" ? null : object.body, { headers });
    if (immutable && request.method === "GET") ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  },
} satisfies ExportedHandler<Env>;
