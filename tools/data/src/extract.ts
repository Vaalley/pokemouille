import type {
  Provenance,
  ReferenceData,
  SnapshotInput,
  SpeciesRecord,
} from "../../../packages/pokemon-data/src/index.ts";
import { validateSnapshot } from "../../../packages/pokemon-data/src/index.ts";
import type { SourceCensusFragment, SpeciesPageQuery } from "./generated/operations.ts";
import { GraphqlClient } from "./client.ts";
import { canonicalJson, openRun, readJson, saveRun } from "./state.ts";
import type { RefreshRun } from "./state.ts";
import { join } from "node:path";
import { loadOperations } from "./operations.ts";
import {
  mapEncounterReferences,
  mapReferences,
  mapSpecies,
  sourceCount,
  validateEncounterReferenceCensus,
} from "./mapping.ts";

interface ExtractOptions {
  stateDir: string;
  endpoint: string;
  maxRequests: number;
  fresh: boolean;
  cacheOnly?: boolean;
}
export interface ExtractedSnapshot {
  input: SnapshotInput;
  provenance: Provenance;
  requests: number;
  run: RefreshRun;
}

type Page = SpeciesPageQuery["species"];
function accumulate(totals: Record<string, number>, page: Page): void {
  for (const record of page) {
    totals.species = (totals.species ?? 0) + 1;
    totals.names = (totals.names ?? 0) + record.names.length;
    totals.flavorTexts = (totals.flavorTexts ?? 0) + record.flavorTexts.length;
    totals.evolutions = (totals.evolutions ?? 0) + record.evolutions.length;
    for (const variety of record.varieties) {
      totals.pokemon = (totals.pokemon ?? 0) + 1;
      for (const key of [
        "types",
        "typeHistory",
        "stats",
        "statHistory",
        "abilities",
        "abilityHistory",
        "forms",
        "learnsets",
        "encounters",
        "sprites",
      ] as const)
        totals[key] = (totals[key] ?? 0) + variety[key].length;
      for (const form of variety.forms)
        totals.formNames = (totals.formNames ?? 0) + form.names.length;
      const learnsetIds = new Set<number>();
      for (const row of variety.learnsets) {
        if (learnsetIds.has(row.id)) throw new Error(`Duplicate source learnset id ${row.id}`);
        learnsetIds.add(row.id);
      }
      totals.encounterConditions =
        (totals.encounterConditions ?? 0) +
        variety.encounters.reduce((sum, encounter) => sum + encounter.conditions.length, 0);
    }
  }
}

function validateExtractedCounts(
  totals: Record<string, number>,
  census: SourceCensusFragment,
  references: ReferenceData,
): void {
  for (const key of [
    "species",
    "pokemon",
    "forms",
    "learnsets",
    "evolutions",
    "names",
    "flavorTexts",
    "types",
    "typeHistory",
    "stats",
    "statHistory",
    "abilities",
    "abilityHistory",
    "sprites",
    "formNames",
    "encounters",
    "encounterConditions",
  ] as const) {
    if ((totals[key] ?? 0) !== sourceCount(census[key]))
      throw new Error(
        `Incomplete source relationship ${key}: exported ${totals[key] ?? 0}, census ${sourceCount(census[key])}`,
      );
  }
  const referenceKeys = {
    generations: "generations",
    versionGroups: "versionGroups",
    versions: "versions",
    types: "referenceTypes",
    stats: "referenceStats",
    abilities: "referenceAbilities",
    moves: "moves",
    machines: "machines",
    learnMethods: "learnMethods",
    items: "items",
    evolutionTriggers: "evolutionTriggers",
  } as const;
  for (const [key, censusKey] of Object.entries(referenceKeys)) {
    if (
      references.sourceCounts[key as keyof typeof referenceKeys] !== sourceCount(census[censusKey])
    )
      throw new Error(`Reference census mismatch: ${key}`);
  }
}

// Caller holds the durable state-directory writer lock throughout extraction.
export async function extractSnapshot(options: ExtractOptions): Promise<ExtractedSnapshot> {
  const operations = await loadOperations();
  if (options.cacheOnly && !(await readJson(join(options.stateDir, "active.json"))))
    throw new Error("No cached refresh exists to publish");
  const run = await openRun(
    options.stateDir,
    options.endpoint,
    operations.operationRevision,
    options.fresh,
  );
  const client = new GraphqlClient({
    stateDir: options.stateDir,
    refreshId: run.id,
    endpoint: options.endpoint,
    schemaRevision: operations.schemaRevision,
    maxRequests: options.maxRequests,
    cacheOnly: options.cacheOnly,
  });
  const before = await client.request(operations.before, {});
  const referenceResponse = await client.request(operations.references, {});
  const encounterResponse = await client.request(operations.encounterReferences, {});
  validateEncounterReferenceCensus(encounterResponse.data, before.data);
  const encounters = mapEncounterReferences(encounterResponse.data);
  const speciesOperation = operations.species(encounters);
  const census: ReferenceData["census"] = {
    species: sourceCount(before.data.species),
    pokemon: sourceCount(before.data.pokemon),
    forms: sourceCount(before.data.forms),
    learnsets: sourceCount(before.data.learnsets),
    evolutions: sourceCount(before.data.evolutions),
  };
  const references = mapReferences(referenceResponse.data, census);
  if (
    referenceResponse.data.abilities.reduce((total, row) => total + row.flavorTexts.length, 0) !==
      sourceCount(before.data.abilityFlavorTexts) ||
    referenceResponse.data.abilities.reduce((total, row) => total + row.effects.length, 0) !==
      sourceCount(before.data.abilityEffects) ||
    referenceResponse.data.abilities.reduce((total, row) => total + row.effectChanges.length, 0) !==
      sourceCount(before.data.abilityEffectChanges) ||
    referenceResponse.data.abilities.reduce(
      (total, row) =>
        total + row.effectChanges.reduce((subtotal, change) => subtotal + change.effects.length, 0),
      0,
    ) !== sourceCount(before.data.abilityEffectChangeTexts)
  )
    throw new Error("Incomplete ability text relationships");
  if (
    referenceResponse.data.moves.reduce((total, row) => total + row.flavorTexts.length, 0) !==
      sourceCount(before.data.moveFlavorTexts) ||
    referenceResponse.data.moveEffects.length !== sourceCount(before.data.moveEffects) ||
    referenceResponse.data.moveEffects.reduce((total, row) => total + row.effects.length, 0) !==
      sourceCount(before.data.moveEffectTexts)
  )
    throw new Error("Incomplete move text relationships");
  for (const [key, relation] of [
    ["moveAttributes", "attributes"],
    ["moveStatChanges", "statChanges"],
    ["moveMeta", "meta"],
  ] as const) {
    if (
      referenceResponse.data.moves.reduce((sum, move) => sum + move[relation].length, 0) !==
      sourceCount(before.data[key])
    )
      throw new Error(`Incomplete structured move relationship: ${key}`);
  }
  if (
    referenceResponse.data.items.reduce((total, row) => total + row.flavorTexts.length, 0) !==
      sourceCount(before.data.itemFlavorTexts) ||
    referenceResponse.data.items.reduce((total, row) => total + row.effects.length, 0) !==
      sourceCount(before.data.itemEffects)
  )
    throw new Error("Incomplete item text relationships");
  const nameTables = {
    types: "typeNames",
    stats: "statNames",
    abilities: "abilityNames",
    moves: "moveNames",
    learnMethods: "learnMethodNames",
    items: "itemNames",
    evolutionTriggers: "evolutionTriggerNames",
  } as const;
  for (const [resource, censusKey] of Object.entries(nameTables)) {
    const rows = referenceResponse.data[resource as keyof typeof nameTables];
    if (
      rows.reduce((sum, row) => sum + row.names.length, 0) !== sourceCount(before.data[censusKey])
    )
      throw new Error(`Incomplete localized reference names: ${resource}`);
  }
  if (
    referenceResponse.data.versionGroups.reduce(
      (sum, group) =>
        sum + group.versions.reduce((subtotal, version) => subtotal + version.names.length, 0),
      0,
    ) !== sourceCount(before.data.versionNames)
  )
    throw new Error("Incomplete localized version names");
  const species: SpeciesRecord[] = [];
  const totals: Record<string, number> = {};
  let cursor = 0;
  let pageIndex = 0;
  const retrievalTimes = [
    before.retrievedAt,
    referenceResponse.retrievedAt,
    encounterResponse.retrievedAt,
  ];
  while (species.length < census.species) {
    if (run.speciesPages[pageIndex] !== undefined && run.speciesPages[pageIndex] !== cursor)
      throw new Error("Invalid durable species cursor sequence");
    const expected = Math.min(25, census.species - species.length);
    const response = await client.request(speciesOperation, { after: cursor, limit: expected });
    const page = response.data.species;
    const previous = cursor;
    for (const record of page) {
      if (!Number.isSafeInteger(record.id) || record.id <= cursor)
        throw new Error("Non-increasing species pagination cursor");
      cursor = record.id;
      species.push(mapSpecies(record, encounters));
    }
    accumulate(totals, page);
    retrievalTimes.push(response.retrievedAt);
    if (run.speciesPages[pageIndex] === undefined) {
      run.speciesPages.push(previous);
      run.speciesCursor = cursor;
      // Response already durable: a crash before this write simply replays its cache.
      await saveRun(options.stateDir, run);
    }
    pageIndex++;
  }
  if (pageIndex !== run.speciesPages.length || cursor !== before.data.species.aggregate?.max?.id)
    throw new Error("Species cursor does not match census");
  validateExtractedCounts(totals, before.data, references);
  const after = await client.request(operations.after, {});
  if (canonicalJson(before.data) !== canonicalJson(after.data))
    throw new Error(
      "Source census changed during refresh; keep last-good publication and start --fresh",
    );
  retrievalTimes.push(after.retrievedAt);
  const input: SnapshotInput = { references, species };
  validateSnapshot(input);
  if (!references.versions.some((version) => version.identifier === "scarlet"))
    throw new Error("Default game Scarlet is absent from the source");
  run.phase = "complete";
  run.completedAt = after.retrievedAt;
  await saveRun(options.stateDir, run);
  retrievalTimes.sort();
  return {
    input,
    run,
    requests: client.requests,
    provenance: {
      endpoint: options.endpoint,
      retrievalStartedAt: retrievalTimes[0]!,
      retrievalCompletedAt: retrievalTimes[retrievalTimes.length - 1]!,
      refreshId: run.id,
      schemaRevision: operations.schemaRevision,
      operationRevision: operations.operationRevision,
      consistency: "census-counts-and-maxima-matched-not-transactional",
    },
  };
}
