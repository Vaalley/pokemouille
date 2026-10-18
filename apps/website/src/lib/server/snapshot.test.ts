import { mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { createSnapshotCache, forEachBounded, readDataJson } from "./snapshot.ts";

let directory: string;
let manifestPath: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "pokemouille-snapshot-"));
  manifestPath = join(directory, "manifest.json");
  await writeFile(manifestPath, JSON.stringify({ datasetRevision: "revision-one" }));
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("createSnapshotCache", () => {
  it("shares one manifest check and in-flight build, then reuses the completed revision", async () => {
    const started = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    let builds = 0;
    const get = createSnapshotCache(async (manifest) => {
      builds++;
      started.resolve();
      await release.promise;
      return { revision: manifest.datasetRevision };
    }, manifestPath);
    const first = get();
    const second = get();
    expect(second).toBe(first);
    await started.promise;
    expect(builds).toBe(1);
    release.resolve();
    const result = await first;
    expect(await second).toBe(result);
    expect(await get()).toBe(result);
    expect(builds).toBe(1);
  });

  it("refreshes the manifest stamp without rebuilding when identical contents are touched", async () => {
    let builds = 0;
    const get = createSnapshotCache(
      async (manifest) => ({ revision: manifest.datasetRevision, build: ++builds }),
      manifestPath,
    );
    const first = await get();
    const later = new Date(Date.now() + 2000);
    await utimes(manifestPath, later, later);
    expect(await get()).toBe(first);
    expect(builds).toBe(1);
  });

  it("replaces the cached revision and detects changed manifest contents even under the same revision ID", async () => {
    let builds = 0;
    const get = createSnapshotCache(
      async (manifest) => ({ revision: manifest.datasetRevision, build: ++builds }),
      manifestPath,
    );
    const first = await get();
    await writeFile(manifestPath, JSON.stringify({ datasetRevision: "revision-two-longer" }));
    expect(await get()).toEqual({ revision: "revision-two-longer", build: 2 });
    await writeFile(
      manifestPath,
      JSON.stringify({ datasetRevision: "revision-two-longer", changed: true }),
    );
    expect(await get()).toEqual({ revision: "revision-two-longer", build: 3 });
    expect(first).toEqual({ revision: "revision-one", build: 1 });
  });

  it("evicts failed builds so concurrent failures share one attempt and a later call can retry", async () => {
    let builds = 0;
    const get = createSnapshotCache(async () => {
      if (++builds === 1) throw new Error("projection failed");
      return "retried";
    }, manifestPath);
    const first = get();
    const second = get();
    expect(first).toBe(second);
    await expect(first).rejects.toThrow("projection failed");
    await expect(second).rejects.toThrow("projection failed");
    expect(await get()).toBe("retried");
    expect(builds).toBe(2);
  });

  it("does not retain failed manifest reads or parsing attempts", async () => {
    let builds = 0;
    const get = createSnapshotCache(async () => ++builds, manifestPath);
    await rm(manifestPath);
    await expect(get()).rejects.toThrow();
    await writeFile(manifestPath, "not json");
    await expect(get()).rejects.toThrow();
    await writeFile(manifestPath, JSON.stringify({ datasetRevision: "recovered" }));
    expect(await get()).toBe(1);
  });
});

describe("bounded snapshot iteration", () => {
  it("visits every item exactly once while retaining only the configured number of active tasks", async () => {
    const firstWave = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const visited: number[] = [];
    let active = 0;
    let maximum = 0;
    const done = forEachBounded([1, 2, 3, 4, 5, 6, 7], async (item) => {
      visited.push(item);
      active++;
      maximum = Math.max(maximum, active);
      if (active === 4) firstWave.resolve();
      await release.promise;
      active--;
    });
    await firstWave.promise;
    expect(visited).toEqual([1, 2, 3, 4]);
    release.resolve();
    await done;
    expect(visited).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(maximum).toBe(4);
    expect(active).toBe(0);
  });

  it("handles empty inputs, custom concurrency and visitor failures", async () => {
    let visits = 0;
    await forEachBounded([], async () => {
      visits++;
    });
    expect(visits).toBe(0);
    const order: number[] = [];
    await forEachBounded(
      [1, 2, 3],
      async (item) => {
        order.push(item);
      },
      1,
    );
    expect(order).toEqual([1, 2, 3]);
    await expect(
      forEachBounded([1], async () => {
        throw new Error("read failed");
      }),
    ).rejects.toThrow("read failed");
  });

  it("reads JSON using manifest-relative paths in the selected data directory", async () => {
    await writeFile(join(directory, "asset.json"), JSON.stringify({ id: 25 }));
    expect(await readDataJson<{ id: number }>("asset.json", directory)).toEqual({ id: 25 });
  });
});
