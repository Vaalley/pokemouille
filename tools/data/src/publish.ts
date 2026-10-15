import { mkdir, readFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Asset,
  DatasetManifest,
  EvolutionChainProjection,
  Provenance,
  SnapshotInput,
} from "../../../packages/pokemon-data/src/index.ts";
import { buildSearchIndex, validateSnapshot } from "../../../packages/pokemon-data/src/index.ts";
import {
  OUTPUT_VERSION,
  canonicalJson,
  digest,
  isFileError,
  withWriterLock,
  writeJson,
} from "./state.ts";

// Immutable data files are installed first, then one atomic root manifest rename
// commits the snapshot. Previously published revisions are deliberately retained.
export async function publishSnapshot(
  outDir: string,
  input: SnapshotInput,
  provenance: Provenance,
): Promise<DatasetManifest> {
  validateSnapshot(input);
  if (!input.references.versions.some((version) => version.identifier === "scarlet"))
    throw new Error("Cannot publish without the Scarlet default game");
  for (const field of ["retrievalStartedAt", "retrievalCompletedAt"] as const) {
    if (!Number.isFinite(Date.parse(provenance[field])))
      throw new Error(`Invalid source provenance: ${field}`);
  }
  if (provenance.retrievalCompletedAt < provenance.retrievalStartedAt)
    throw new Error("Reversed retrieval interval");
  return withWriterLock(outDir, async () => {
    const staging = join(outDir, `.pending-${randomUUID()}`);
    const assets: Record<string, { sha256: string; bytes: number }> = {};
    await mkdir(staging, { recursive: true });
    async function emit(path: string, value: unknown): Promise<void> {
      const text = `${canonicalJson(value)}\n`;
      await writeJson(join(staging, path), value);
      assets[path] = { sha256: digest(text), bytes: Buffer.byteLength(text, "utf8") };
    }
    try {
      await emit("references.json", input.references);
      for (const language of ["en", "fr", "ja"] as const)
        await emit(`search/${language}.json`, buildSearchIndex(input, language));
      // Stable source ordering is not part of semantic identity.
      const evolutionChains = new Map<number, EvolutionChainProjection>();
      const orderedSpecies = [...input.species].sort((a, b) => a.id - b.id);
      for (const record of orderedSpecies) {
        await emit(`pokemon/${record.id}.json`, record);
        if (record.evolutionChainId === null) continue;
        let chain = evolutionChains.get(record.evolutionChainId);
        if (!chain) {
          chain = { chainId: record.evolutionChainId, applicability: "unresolved", nodes: [] };
          evolutionChains.set(record.evolutionChainId, chain);
        }
        chain.nodes.push({
          speciesId: record.id,
          identifier: record.identifier,
          names: record.names,
          generationId: record.generationId,
          evolvesFromSpeciesId: record.evolvesFromSpeciesId,
          methods: record.evolutions,
        });
      }
      for (const chain of evolutionChains.values())
        await emit(`evolution/${chain.chainId}.json`, chain);
      const datasetRevision = digest(
        canonicalJson({ schemaVersion: OUTPUT_VERSION, files: assets }),
      );
      const revisionPath = join(outDir, "revisions", datasetRevision);
      await mkdir(join(outDir, "revisions"), { recursive: true });
      try {
        await rename(staging, revisionPath);
      } catch (error) {
        if (
          !isFileError(error, "EEXIST") &&
          !isFileError(error, "ENOTEMPTY") &&
          !isFileError(error, "EPERM")
        )
          throw error;
        // Same semantic revision may already exist. Never overwrite immutable data.
        for (const [path, expected] of Object.entries(assets)) {
          const contents = await readFile(join(revisionPath, path));
          if (
            contents.length !== expected.bytes ||
            digest(contents.toString("utf8")) !== expected.sha256
          )
            throw new Error(`Existing immutable asset is corrupt: ${path}`);
        }
        await rm(staging, { recursive: true, force: true });
      }
      function asset(path: string): Asset {
        const metadata = assets[path];
        if (!metadata) throw new Error(`Missing generated asset ${path}`);
        return { path: `revisions/${datasetRevision}/${path}`, ...metadata };
      }
      const manifest: DatasetManifest = {
        schemaVersion: OUTPUT_VERSION,
        datasetRevision,
        source: provenance,
        languages: ["en", "fr", "ja"],
        defaultVersion: "scarlet",
        counts: {
          species: input.species.length,
          pokemon: input.species.reduce((sum, row) => sum + row.varieties.length, 0),
          forms: input.species.reduce(
            (sum, row) =>
              sum + row.varieties.reduce((count, variety) => count + variety.forms.length, 0),
            0,
          ),
          learnsets: input.species.reduce(
            (sum, row) =>
              sum + row.varieties.reduce((count, variety) => count + variety.learnsets.length, 0),
            0,
          ),
        },
        files: {
          references: asset("references.json"),
          search: {
            en: asset("search/en.json"),
            fr: asset("search/fr.json"),
            ja: asset("search/ja.json"),
          },
          pokemon: Object.fromEntries(
            input.species.map((record) => [String(record.id), asset(`pokemon/${record.id}.json`)]),
          ),
          evolution: Object.fromEntries(
            [...evolutionChains.keys()].map((chainId) => [
              String(chainId),
              asset(`evolution/${chainId}.json`),
            ]),
          ),
        },
      };
      await writeJson(join(outDir, "manifest.json"), manifest);
      return manifest;
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  });
}
