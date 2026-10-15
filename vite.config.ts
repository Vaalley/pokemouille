import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
    tasks: {
      "data:refresh": {
        command:
          "node tools/data/src/cli.ts refresh --state-dir .data/state --out-dir apps/website/static/data",
        cache: false,
      },
      "data:status": {
        command:
          "node tools/data/src/cli.ts status --state-dir .data/state --out-dir apps/website/static/data",
        cache: false,
      },
      "data:publish": {
        command:
          "node tools/data/src/cli.ts publish --state-dir .data/state --out-dir apps/website/static/data",
        cache: false,
      },
      "data:schema": {
        command: "node tools/data/src/cli.ts schema --state-dir .data/state",
        cache: false,
      },
      "data:codegen": {
        command: "node node_modules/@graphql-codegen/cli/cjs/bin.js --config tools/data/codegen.ts",
        cache: false,
      },
    },
  },
});
