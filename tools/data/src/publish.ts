import { access, cp, mkdir, readFile, rename, rm } from "node:fs/promises";
import { join, posix } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Asset,
  DatasetManifest,
  EvolutionChainProjection,
  PokemonReferences,
  Provenance,
  ReferenceData,
  SearchReferences,
  SpeciesRecord,
  SnapshotInput,
} from "../../../packages/pokemon-data/src/index.ts";
import {
  buildSearchIndex,
  getMainSeriesGames,
  validateSnapshot,
} from "../../../packages/pokemon-data/src/index.ts";
import {
  OUTPUT_VERSION,
  atomicWrite,
  canonicalJson,
  readJson,
  digest,
  isFileError,
  withWriterLock,
  writeJson,
} from "./state.ts";

/** Rebuild derived assets from a last-good publication without ingestion state or requests. */
export async function republishSnapshot(outDir: string): Promise<DatasetManifest> {
  return withWriterLock(outDir, async () => {
    const manifest = await readJson<DatasetManifest>(join(outDir, "manifest.json"));
    if (!manifest) throw new Error("No published manifest to republish");
    if (manifest.schemaVersion !== OUTPUT_VERSION)
      throw new Error(`Unsupported published schema version: ${manifest.schemaVersion}`);
    const revisionPrefix = `revisions/${manifest.datasetRevision}/`;
    async function readAsset<T>(asset: Asset): Promise<T> {
      if (
        !asset.path.startsWith(revisionPrefix) ||
        asset.path !== posix.normalize(asset.path) ||
        asset.path.includes("\\")
      )
        throw new Error(`Invalid published asset path: ${asset.path}`);
      const text = await readFile(join(outDir, asset.path), "utf8");
      if (Buffer.byteLength(text, "utf8") !== asset.bytes || digest(text) !== asset.sha256)
        throw new Error(`Published asset is corrupt: ${asset.path}`);
      return JSON.parse(text) as T;
    }
    const references = await readAsset<ReferenceData>(manifest.files.references);
    const species = await Promise.all(
      Object.entries(manifest.files.pokemon).map(async ([id, asset]) => {
        const record = await readAsset<SpeciesRecord>(asset);
        if (String(record.id) !== id)
          throw new Error(`Published species ID does not match manifest key: ${id}`);
        return record;
      }),
    );
    return publishRevision(outDir, { references, species }, manifest.source);
  });
}

// Immutable data files are installed first, then one atomic root manifest rename
// commits the snapshot. Previously published revisions are deliberately retained.
export async function publishSnapshot(
  outDir: string,
  input: SnapshotInput,
  provenance: Provenance,
): Promise<DatasetManifest> {
  return withWriterLock(outDir, () => publishRevision(outDir, input, provenance));
}

async function publishRevision(
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
  const staging = join(outDir, `.pending-${randomUUID()}`);
  const assets: Record<string, { sha256: string; bytes: number }> = {};
  await mkdir(staging, { recursive: true });
  async function emit(path: string, value: unknown): Promise<void> {
    const text = `${canonicalJson(value)}\n`;
    await atomicWrite(join(staging, path), text);
    assets[path] = { sha256: digest(text), bytes: Buffer.byteLength(text, "utf8") };
  }
  try {
    await emit("references.json", input.references);
    const pokemonReferences: PokemonReferences = {
      ...input.references,
      moves: input.references.moves.map(
        ({ id, identifier, names, typeId, damageClassId, power, accuracy, pp, priority }) => ({
          id,
          identifier,
          names,
          typeId,
          damageClassId,
          power,
          accuracy,
          pp,
          priority,
        }),
      ),
      items: input.references.items.map(({ id, identifier, names }) => ({ id, identifier, names })),
    };
    const searchReferences: SearchReferences = {
      moves: input.references.moves.map(({ id, identifier, names, typeId }) => ({
        id,
        identifier,
        names,
        typeId,
      })),
      abilities: input.references.abilities.map(({ id, identifier, names }) => ({
        id,
        identifier,
        names,
      })),
      items: pokemonReferences.items,
    };
    await emit("pokemon-references.json", pokemonReferences);
    await emit("search/references.json", searchReferences);
    // Precomputed so the game selector does not need the full references file.
    await emit("games.json", getMainSeriesGames(input.references));
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
    const datasetRevision = digest(canonicalJson({ schemaVersion: OUTPUT_VERSION, files: assets }));
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
      // Windows also reports EPERM when a scanner/indexer holds a staged file and the
      // target does not exist yet; install by copying instead of assuming it exists.
      const exists = await access(revisionPath).then(
        () => true,
        () => false,
      );
      if (!exists)
        await cp(staging, revisionPath, { recursive: true, errorOnExist: true, force: false });
      // Existing or copied revision: verify; never overwrite immutable data.
      for (const [path, expected] of Object.entries(assets)) {
        const contents = await readFile(join(revisionPath, path));
        if (
          contents.length !== expected.bytes ||
          digest(contents.toString("utf8")) !== expected.sha256
        )
          throw new Error(`Existing immutable asset is corrupt: ${path}`);
      }
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
        pokemonReferences: asset("pokemon-references.json"),
        searchReferences: asset("search/references.json"),
        games: asset("games.json"),
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
}
