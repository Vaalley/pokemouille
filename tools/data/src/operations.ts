import { readFile } from "node:fs/promises";
import { parse, print } from "graphql";
import { digest } from "./state.ts";
import type { Operation } from "./client.ts";
import type {
  CensusAfterQuery,
  CensusAfterQueryVariables,
  CensusBeforeQuery,
  CensusBeforeQueryVariables,
  ReferencesQuery,
  ReferencesQueryVariables,
  SpeciesPageQuery,
  SpeciesPageQueryVariables,
} from "./generated/operations.ts";
import { mapReferences, mapSpecies, validateCensus } from "./mapping.ts";

// Every bounded relationship has an independent unbounded aggregate. A server-side
// row cap must cause rejection, never a deceptively successful partial snapshot.
export function validateBoundedRelationships(value: unknown, path = "$"): void {
  if (value === null || typeof value !== "object") throw new Error(`${path}: expected an object`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateBoundedRelationships(item, `${path}[${index}]`));
    return;
  }
  const record: Record<string, unknown> = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    if (Array.isArray(child)) {
      const aggregate = record[`${key}Count`];
      if (!(path === "$" && key === "species")) {
        if (aggregate === null || typeof aggregate !== "object" || !("aggregate" in aggregate))
          throw new Error(`${path}.${key}: missing relationship aggregate`);
        const countContainer = aggregate.aggregate;
        if (
          countContainer === null ||
          typeof countContainer !== "object" ||
          !("count" in countContainer) ||
          countContainer.count !== child.length
        ) {
          throw new Error(`${path}.${key}: truncated relationship (${child.length} rows)`);
        }
      }
      child.forEach((item, index) =>
        validateBoundedRelationships(item, `${path}.${key}[${index}]`),
      );
    }
  }
}

export async function loadOperations() {
  const [schemaRevisionText, censusText, referencesText, speciesText] = await Promise.all([
    readFile(new URL("../graphql/schema-revision.json", import.meta.url), "utf8"),
    readFile(new URL("../graphql/census.graphql", import.meta.url), "utf8"),
    readFile(new URL("../graphql/references.graphql", import.meta.url), "utf8"),
    readFile(new URL("../graphql/species.graphql", import.meta.url), "utf8"),
  ]);
  const metadata: unknown = JSON.parse(schemaRevisionText);
  if (
    metadata === null ||
    typeof metadata !== "object" ||
    !("sha256" in metadata) ||
    typeof metadata.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(metadata.sha256)
  ) {
    throw new Error("Invalid committed GraphQL schema revision metadata");
  }
  const schemaRevision = metadata.sha256;
  const census = print(parse(censusText));
  const references = print(parse(referencesText));
  const species = print(parse(speciesText));
  const before: Operation<CensusBeforeQuery, CensusBeforeQueryVariables> = {
    name: "CensusBefore",
    document: census,
    validate: validateCensus,
  };
  const after: Operation<CensusAfterQuery, CensusAfterQueryVariables> = {
    name: "CensusAfter",
    document: census,
    validate: validateCensus,
  };
  const referenceOperation: Operation<ReferencesQuery, ReferencesQueryVariables> = {
    name: "References",
    document: references,
    validate(data) {
      validateBoundedRelationships(data);
      if (
        !Array.isArray(data.generations) ||
        !Array.isArray(data.versionGroups) ||
        !Array.isArray(data.types) ||
        !Array.isArray(data.stats) ||
        !Array.isArray(data.abilities) ||
        !Array.isArray(data.moves) ||
        !Array.isArray(data.items) ||
        !Array.isArray(data.learnMethods) ||
        !Array.isArray(data.evolutionTriggers)
      )
        throw new Error("Missing reference resource arrays");
      // Mapping checks required source scalars; the final census is supplied later.
      mapReferences(data, { species: 0, pokemon: 0, forms: 0, learnsets: 0, evolutions: 0 });
    },
  };
  const speciesOperation: Operation<SpeciesPageQuery, SpeciesPageQueryVariables> = {
    name: "SpeciesPage",
    document: species,
    validate(data, variables) {
      if (
        !Array.isArray(data.species) ||
        !Number.isSafeInteger(variables.limit) ||
        variables.limit < 1 ||
        variables.limit > 25 ||
        data.species.length !== variables.limit
      )
        throw new Error("Truncated or invalid bounded species page");
      validateBoundedRelationships(data);
      data.species.forEach(mapSpecies);
    },
  };
  return {
    schemaRevision,
    operationRevision: digest(`${schemaRevision}\n${census}\n${references}\n${species}`),
    before,
    after,
    references: referenceOperation,
    species: speciesOperation,
  };
}
