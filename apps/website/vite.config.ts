import { readFileSync } from "node:fs";
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite-plus";

// The browser loads the dataset revision these pages are prerendered from, so it needs no
// runtime manifest request. Restart the dev server after publishing a new revision.
function datasetRevision(): string | undefined {
  let source: string;
  try {
    source = readFileSync(new URL("./static/data/manifest.json", import.meta.url), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  const { datasetRevision: revision, schemaVersion } = JSON.parse(source) as {
    datasetRevision?: unknown;
    schemaVersion?: unknown;
  };
  if (schemaVersion !== 3)
    throw new Error(
      "static/data/manifest.json requires schema version 3; generate a fresh dataset",
    );
  if (typeof revision !== "string")
    throw new Error("static/data/manifest.json has no datasetRevision");
  return revision;
}
const revision = datasetRevision();

export default defineConfig({
  define: revision ? { "import.meta.env.DATASET_REVISION": JSON.stringify(revision) } : {},
  plugins: [
    sveltekit({
      // Every localized species route is enumerated; no SPA fallback may hide a missing page.
      adapter: adapter({ strict: true }),
      prerender: { handleHttpError: "fail", handleMissingId: "fail" },
    }),
  ],
  server: {
    watch: {
      // adapter-static writes thousands of page directories here, outside Vite's outDir.
      // Watching a previous build stalls Windows development startup on filesystem work.
      ignored: ["**/build/**"],
    },
  },
});
