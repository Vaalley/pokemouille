// Static assets are matched before this Worker runs, so it only sees unmatched paths.
// The dataset is excluded from deployed assets (static/.assetsignore) and served from R2;
// R2 also retains earlier `_app/immutable` chunks so tabs opened before a deploy keep working.

interface Env {
  ASSETS: Fetcher;
  DATA: R2Bucket;
}

const IMMUTABLE = "public, max-age=31536000, immutable";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));
    const fromR2 =
      key === "data/manifest.json" ||
      key.startsWith("data/revisions/") ||
      key.startsWith("_app/immutable/");
    if ((request.method !== "GET" && request.method !== "HEAD") || !fromR2) {
      return env.ASSETS.fetch(request);
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
