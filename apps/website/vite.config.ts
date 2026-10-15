import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    sveltekit({
      // Every localized species route is enumerated; no SPA fallback may hide a missing page.
      adapter: adapter({ strict: true }),
      prerender: { handleHttpError: "fail", handleMissingId: "fail" },
    }),
  ],
});
