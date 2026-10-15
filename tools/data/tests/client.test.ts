import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { GraphqlClient, IncompleteRefresh } from "../src/client.ts";
import type { Operation } from "../src/client.ts";

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});
async function directory() {
  const path = await mkdtemp(join(tmpdir(), "pokemon-client-"));
  temporary.push(path);
  return path;
}
const operation: Operation<{ rows: number[] }, { page: number }> = {
  name: "Rows",
  document: "query Rows($page:Int!){rows(page:$page)}",
  validate(data) {
    if (!Array.isArray(data.rows) || data.rows.length !== 2) throw new Error("Truncated rows");
  },
};

describe("durable GraphQL ingestion", () => {
  it("coalesces requests and resumes successful pages without another request", async () => {
    const stateDir = await directory();
    let calls = 0;
    const fetcher: typeof fetch = async () => {
      calls++;
      return Response.json({ data: { rows: [4, 9] } });
    };
    const options = {
      stateDir,
      refreshId: "run",
      endpoint: "http://localhost/graphql",
      schemaRevision: "schema",
      maxRequests: 1,
      fetch: fetcher,
    };
    const first = new GraphqlClient(options);
    const [a, b] = await Promise.all([
      first.request(operation, { page: 0 }),
      first.request(operation, { page: 0 }),
    ]);
    expect(a.data.rows).toEqual([4, 9]);
    expect(b.data.rows).toEqual([4, 9]);
    expect(calls).toBe(1);
    const resumed = new GraphqlClient({ ...options, maxRequests: 0 });
    expect((await resumed.request(operation, { page: 0 })).data.rows).toEqual([4, 9]);
    await expect(resumed.request(operation, { page: 1 })).rejects.toMatchObject({
      reason: "max-requests",
    });
    expect(calls).toBe(1);
    await new GraphqlClient({ ...options, refreshId: "fresh-run" }).request(operation, { page: 0 });
    expect(calls).toBe(2);
  });

  it("persists the rolling-hour cap across client invocations", async () => {
    const stateDir = await directory();
    let calls = 0;
    let now = 10_000;
    const options = {
      stateDir,
      refreshId: "run",
      endpoint: "http://localhost/graphql",
      schemaRevision: "schema",
      maxRequests: 60,
      now: () => now,
      fetch: async () => {
        calls++;
        return Response.json({ data: { rows: [1, 2] } });
      },
    };
    const first = new GraphqlClient(options);
    for (let page = 0; page < 60; page++) await first.request(operation, { page });
    const resumed = new GraphqlClient(options);
    await expect(resumed.request(operation, { page: 60 })).rejects.toMatchObject({
      reason: "hourly-budget",
      retryAt: 3_610_000,
    });
    expect(calls).toBe(60);
    now += 3_600_000;
    await resumed.request(operation, { page: 60 });
    expect(calls).toBe(61);
  });

  it("persists Retry-After without retries and can resume after cooldown", async () => {
    const stateDir = await directory();
    let now = 20_000;
    let calls = 0;
    const options = {
      stateDir,
      refreshId: "run",
      endpoint: "http://localhost/graphql",
      schemaRevision: "schema",
      maxRequests: 60,
      now: () => now,
      fetch: async () => {
        calls++;
        return calls === 1
          ? new Response("", { status: 429, headers: { "retry-after": "120" } })
          : Response.json({ data: { rows: [1, 2] } });
      },
    };
    await expect(new GraphqlClient(options).request(operation, { page: 0 })).rejects.toMatchObject({
      reason: "cooldown",
      retryAt: 140_000,
    });
    await expect(new GraphqlClient(options).request(operation, { page: 0 })).rejects.toBeInstanceOf(
      IncompleteRefresh,
    );
    expect(calls).toBe(1);
    now = 140_000;
    await new GraphqlClient(options).request(operation, { page: 0 });
    expect(calls).toBe(2);
  });

  it("rejects HTTP-200 GraphQL errors and truncated inputs without caching either", async () => {
    const stateDir = await directory();
    let calls = 0;
    const options = {
      stateDir,
      refreshId: "run",
      endpoint: "http://localhost/graphql",
      schemaRevision: "schema",
      maxRequests: 60,
      fetch: async () => {
        calls++;
        return Response.json(
          calls === 1
            ? { data: { rows: [1, 2] }, errors: [{ message: "upstream error" }] }
            : calls === 2
              ? { data: { rows: [1] } }
              : { data: { rows: [1, 2] } },
        );
      },
    };
    await expect(new GraphqlClient(options).request(operation, { page: 0 })).rejects.toThrow(
      "GraphQL errors",
    );
    await expect(new GraphqlClient(options).request(operation, { page: 0 })).rejects.toThrow(
      "Truncated rows",
    );
    expect((await new GraphqlClient(options).request(operation, { page: 0 })).data.rows).toEqual([
      1, 2,
    ]);
    expect(calls).toBe(3);
  });
});
