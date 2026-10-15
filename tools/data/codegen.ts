import type { CodegenConfig } from "@graphql-codegen/cli";
import { fileURLToPath } from "node:url";

// Schema acquisition is a separate, budgeted parent operation. Codegen is offline.
const config: CodegenConfig = {
  schema: fileURLToPath(new URL("./graphql/schema.json", import.meta.url)),
  documents: fileURLToPath(new URL("./graphql/*.graphql", import.meta.url)),
  generates: {
    [fileURLToPath(new URL("./src/generated/operations.ts", import.meta.url))]: {
      plugins: ["typescript-operations"],
      config: {
        preResolveTypes: true,
        skipTypename: true,
        enumsAsTypes: true,
        useTypeImports: true,
        defaultScalarType: "unknown",
        scalars: { jsonb: "unknown", float8: "number" },
      },
    },
  },
};
export default config;
