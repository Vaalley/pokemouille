import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { fixture } from "../../../packages/pokemon-data/tests/fixtures.ts";
import { publishSnapshot } from "../src/publish.ts";
import { digest, withWriterLock } from "../src/state.ts";
import type { Provenance } from "../../../packages/pokemon-data/src/index.ts";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});
async function outputDirectory() {
  const path = await mkdtemp(join(tmpdir(), "pokemon-publish-"));
  directories.push(path);
  return path;
}
const provenance: Provenance = {
  endpoint: "https://graphql.pokeapi.co/v1beta2",
  refreshId: "first",
  schemaRevision: "test-schema",
  operationRevision: "test-query",
  retrievalStartedAt: "2026-10-01T00:00:00.000Z",
  retrievalCompletedAt: "2026-10-01T01:00:00.000Z",
  consistency: "census-counts-and-maxima-matched-not-transactional",
};

describe("last-good static publication", () => {
  it("publishes separately loadable, integrity-described records and retains previous revisions", async () => {
    const outDir = await outputDirectory();
    const input = fixture();
    const first = await publishSnapshot(outDir, input, provenance);
    const asset = first.files.pokemon["25"];
    expect(asset).toBeDefined();
    if (!asset) throw new Error("Missing species asset");
    const detail = await readFile(join(outDir, asset.path), "utf8");
    expect(JSON.parse(detail).identifier).toBe("pikachu");
    expect(digest(detail)).toBe(asset.sha256);
    expect(Buffer.byteLength(detail)).toBe(asset.bytes);
    input.species[0]!.flavorTexts[0]!.text = "Updated source text";
    const second = await publishSnapshot(outDir, input, { ...provenance, refreshId: "second" });
    expect(second.datasetRevision).not.toBe(first.datasetRevision);
    expect(await readFile(join(outDir, asset.path), "utf8")).toBe(detail);
    expect(JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8")).datasetRevision).toBe(
      second.datasetRevision,
    );
  });

  it("keeps semantic identity stable across honest retrieval timestamp changes", async () => {
    const outDir = await outputDirectory();
    const first = await publishSnapshot(outDir, fixture(), provenance);
    const second = await publishSnapshot(outDir, fixture(), {
      ...provenance,
      refreshId: "later",
      retrievalStartedAt: "2026-10-08T00:00:00.000Z",
      retrievalCompletedAt: "2026-10-08T01:00:00.000Z",
    });
    expect(second.datasetRevision).toBe(first.datasetRevision);
    expect(second.source.retrievalStartedAt).toBe("2026-10-08T00:00:00.000Z");
  });

  it("does not replace the last-good manifest for incomplete or invalid data", async () => {
    const outDir = await outputDirectory();
    await publishSnapshot(outDir, fixture(), provenance);
    const before = await readFile(join(outDir, "manifest.json"), "utf8");
    const truncated = fixture();
    truncated.species[0]!.varieties[0]!.learnsets.pop();
    await expect(publishSnapshot(outDir, truncated, provenance)).rejects.toThrow();
    const invalid = fixture();
    invalid.species[0]!.varieties[0]!.types[0]!.typeId = 999;
    await expect(publishSnapshot(outDir, invalid, provenance)).rejects.toThrow();
    expect(await readFile(join(outDir, "manifest.json"), "utf8")).toBe(before);
  });

  it("does not replace the last-good manifest when an immutable asset is corrupt", async () => {
    const outDir = await outputDirectory();
    const first = await publishSnapshot(outDir, fixture(), provenance);
    const before = await readFile(join(outDir, "manifest.json"), "utf8");
    await writeFile(join(outDir, first.files.references.path), "corrupt");
    await expect(
      publishSnapshot(outDir, fixture(), { ...provenance, refreshId: "again" }),
    ).rejects.toThrow("corrupt");
    expect(await readFile(join(outDir, "manifest.json"), "utf8")).toBe(before);
  });

  it("rejects overlapping writers and releases the lock after failure", async () => {
    const outDir = await outputDirectory();
    await withWriterLock(outDir, async () => {
      await expect(withWriterLock(outDir, async () => undefined)).rejects.toThrow();
    });
    await expect(
      withWriterLock(outDir, async () => {
        throw new Error("interrupted");
      }),
    ).rejects.toThrow("interrupted");
    expect(await withWriterLock(outDir, async () => "resumed")).toBe("resumed");
  });
});
