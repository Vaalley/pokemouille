import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildClientSchema, getIntrospectionQuery } from "graphql";
import type { IntrospectionQuery } from "graphql";
import { GraphqlClient } from "./client.ts";
import type { Operation } from "./client.ts";
import { atomicWrite, digest, writeJson } from "./state.ts";

export async function fetchSchema(options: {
  stateDir: string;
  endpoint: string;
  maxRequests: number;
  schemaFile: string;
}): Promise<void> {
  const operation: Operation<IntrospectionQuery, Record<string, never>> = {
    name: "IntrospectionQuery",
    document: getIntrospectionQuery({ descriptions: false }),
    validate(data) {
      buildClientSchema(data);
    },
  };
  const client = new GraphqlClient({
    ...options,
    refreshId: `schema-${randomUUID()}`,
    schemaRevision: "graphql-standard-introspection-v1",
  });
  const result = await client.request(operation, {});
  const schemaText = JSON.stringify(result.data);
  await atomicWrite(options.schemaFile, `${schemaText}\n`);
  await writeJson(fileURLToPath(new URL("../graphql/schema-revision.json", import.meta.url)), {
    sha256: digest(schemaText),
  });
}
