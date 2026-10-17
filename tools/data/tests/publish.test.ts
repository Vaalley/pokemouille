import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { fixture } from "../../../packages/pokemon-data/tests/fixtures.ts";
import { getMainSeriesGames, resolvePokemon } from "../../../packages/pokemon-data/src/index.ts";
import { main } from "../src/cli.ts";
import { publishSnapshot, republishSnapshot } from "../src/publish.ts";
import { canonicalJson, digest, withWriterLock, writeJson } from "../src/state.ts";
import type {
  PokemonReferences,
  Provenance,
  SearchReferences,
} from "../../../packages/pokemon-data/src/index.ts";

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

// Recreate the pre-projection publisher's content-addressed files and manifest.
async function publishLegacySnapshot(outDir: string) {
  const current = await publishSnapshot(outDir, fixture(), provenance);
  const legacy = {
    ...current,
    files: {
      references: current.files.references,
      games: current.files.games,
      search: current.files.search,
      pokemon: current.files.pokemon,
      evolution: current.files.evolution,
    },
  };
  const assets = [
    legacy.files.references,
    legacy.files.games,
    ...Object.values(legacy.files.search),
    ...Object.values(legacy.files.pokemon),
    ...Object.values(legacy.files.evolution),
  ];
  const prefix = `revisions/${current.datasetRevision}/`;
  legacy.datasetRevision = digest(
    canonicalJson({
      schemaVersion: legacy.schemaVersion,
      files: Object.fromEntries(
        assets.map(({ path, sha256, bytes }) => [path.slice(prefix.length), { sha256, bytes }]),
      ),
    }),
  );
  for (const asset of assets) {
    const contents = await readFile(join(outDir, asset.path));
    asset.path = `revisions/${legacy.datasetRevision}/${asset.path.slice(prefix.length)}`;
    await mkdir(dirname(join(outDir, asset.path)), { recursive: true });
    await writeFile(join(outDir, asset.path), contents);
  }
  await writeJson(join(outDir, "manifest.json"), legacy);
  await rm(join(outDir, "revisions", current.datasetRevision), { recursive: true });
  return legacy;
}

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

  it("publishes the precomputed main-series games as their own asset", async () => {
    const outDir = await outputDirectory();
    const input = fixture();
    const manifest = await publishSnapshot(outDir, input, provenance);
    const text = await readFile(join(outDir, manifest.files.games.path), "utf8");
    expect(digest(text)).toBe(manifest.files.games.sha256);
    const games = JSON.parse(text);
    expect(games.length).toBeGreaterThan(0);
    expect(games).toEqual(JSON.parse(JSON.stringify(getMainSeriesGames(input.references))));
  });

  it("preserves historical resolution while omitting unneeded browser prose", async () => {
    const outDir = await outputDirectory();
    const input = fixture();
    const names = [
      { languageId: 9, name: "Thunder Stone" },
      { languageId: 5, name: "Pierre Foudre" },
      { languageId: 1, name: "かみなりのいし" },
    ];
    input.references.items = [
      {
        id: 83,
        identifier: "thunder-stone",
        names,
        flavorTexts: [{ languageId: 9, versionGroupId: 25, text: "An evolution stone." }],
        effects: [{ languageId: 9, effect: "Evolves certain Pokémon.", shortEffect: "Evolution." }],
      },
    ];
    input.references.sourceCounts.items = 1;
    input.references.moves[0]!.names = names;
    input.references.abilities[0]!.names = names;
    input.references.abilities[0]!.effects = [
      { languageId: 9, effect: "Current ability effect.", shortEffect: "Current effect." },
    ];
    input.references.abilities[0]!.flavorTexts = [
      { languageId: 9, versionGroupId: 15, text: "Ability flavor text." },
    ];
    const manifest = await publishSnapshot(outDir, input, provenance);
    const pokemonText = await readFile(join(outDir, manifest.files.pokemonReferences.path), "utf8");
    const searchText = await readFile(join(outDir, manifest.files.searchReferences.path), "utf8");
    const pokemon: PokemonReferences = JSON.parse(pokemonText);
    const search: SearchReferences = JSON.parse(searchText);
    for (const move of pokemon.moves) {
      expect(move).not.toHaveProperty("effects");
      expect(move).not.toHaveProperty("flavorTexts");
    }
    for (const item of pokemon.items) {
      expect(item).not.toHaveProperty("effects");
      expect(item).not.toHaveProperty("flavorTexts");
    }
    for (const resources of [search.moves, search.abilities, search.items]) {
      for (const resource of resources) {
        expect(resource).not.toHaveProperty("effects");
        expect(resource).not.toHaveProperty("flavorTexts");
      }
    }
    for (const [asset, text] of [
      [manifest.files.pokemonReferences, pokemonText],
      [manifest.files.searchReferences, searchText],
    ] as const) {
      expect(digest(text)).toBe(asset.sha256);
      expect(Buffer.byteLength(text, "utf8")).toBe(asset.bytes);
      expect(asset.path.startsWith(`revisions/${manifest.datasetRevision}/`)).toBe(true);
    }
    for (const language of ["en", "fr", "ja"] as const) {
      for (const game of getMainSeriesGames(input.references)) {
        for (const record of input.species) {
          const forms = [
            undefined,
            ...record.varieties.flatMap((variety) => variety.forms.map((form) => form.identifier)),
          ];
          for (const form of forms) {
            const context = { language, version: game.version.identifier, form };
            expect(resolvePokemon(record, pokemon, context)).toEqual(
              resolvePokemon(record, input.references, context),
            );
          }
        }
      }
    }
  });

  it("migrates a published legacy snapshot offline, preserves provenance and retains the old revision", async () => {
    const outDir = await outputDirectory();
    const legacy = await publishLegacySnapshot(outDir);
    const previousReferences = await readFile(join(outDir, legacy.files.references.path), "utf8");
    const previousPokemon = await readFile(join(outDir, legacy.files.pokemon["25"]!.path), "utf8");
    const manifest = await republishSnapshot(outDir);
    expect(manifest.datasetRevision).not.toBe(legacy.datasetRevision);
    expect(manifest.source).toEqual(legacy.source);
    expect(manifest.schemaVersion).toBe(legacy.schemaVersion);
    expect(manifest.counts).toEqual(legacy.counts);
    expect(await readFile(join(outDir, manifest.files.references.path), "utf8")).toBe(
      previousReferences,
    );
    expect(await readFile(join(outDir, manifest.files.pokemon["25"]!.path), "utf8")).toBe(
      previousPokemon,
    );
    expect(await readFile(join(outDir, legacy.files.references.path), "utf8")).toBe(
      previousReferences,
    );
    expect(await readFile(join(outDir, legacy.files.pokemon["25"]!.path), "utf8")).toBe(
      previousPokemon,
    );
    await expect(
      access(join(outDir, manifest.files.pokemonReferences.path)),
    ).resolves.toBeUndefined();
    await expect(
      access(join(outDir, manifest.files.searchReferences.path)),
    ).resolves.toBeUndefined();
    const stateDir = join(outDir, "absent-ingestion-state");
    expect(await main(["republish", "--out-dir", outDir, "--state-dir", stateDir])).toBe(0);
    await expect(access(stateDir)).rejects.toMatchObject({ code: "ENOENT" });
    expect(JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"))).toEqual(manifest);
  });

  it.each(["references", "pokemon"] as const)(
    "keeps the legacy publication when its %s source asset is corrupt",
    async (kind) => {
      const outDir = await outputDirectory();
      const legacy = await publishLegacySnapshot(outDir);
      const before = await readFile(join(outDir, "manifest.json"), "utf8");
      const asset = kind === "references" ? legacy.files.references : legacy.files.pokemon["25"]!;
      await writeFile(join(outDir, asset.path), "corrupt");
      await expect(republishSnapshot(outDir)).rejects.toThrow("Published asset is corrupt");
      expect(await readFile(join(outDir, "manifest.json"), "utf8")).toBe(before);
    },
  );

  it("rejects unsupported source schemas and unpinned source assets without replacing the manifest", async () => {
    const outDir = await outputDirectory();
    const legacy = await publishLegacySnapshot(outDir);
    legacy.schemaVersion = 999;
    await writeJson(join(outDir, "manifest.json"), legacy);
    let before = await readFile(join(outDir, "manifest.json"), "utf8");
    await expect(republishSnapshot(outDir)).rejects.toThrow("Unsupported published schema version");
    expect(await readFile(join(outDir, "manifest.json"), "utf8")).toBe(before);
    legacy.schemaVersion = 1;
    legacy.files.references.path = "revisions/other/references.json";
    await writeJson(join(outDir, "manifest.json"), legacy);
    before = await readFile(join(outDir, "manifest.json"), "utf8");
    await expect(republishSnapshot(outDir)).rejects.toThrow("Invalid published asset path");
    expect(await readFile(join(outDir, "manifest.json"), "utf8")).toBe(before);
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
