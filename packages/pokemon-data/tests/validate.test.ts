import { describe, expect, it } from "vite-plus/test";
import { resolvePokemon, validateSnapshot } from "../src/index.ts";
import { fixture } from "./fixtures.ts";

describe("snapshot integrity", () => {
  it("uses numeric resource identity while rejecting duplicate primary IDs", () => {
    const snapshot = fixture();
    snapshot.references.items = [
      { id: 723, identifier: "roseli-berry", names: [] },
      { id: 2279, identifier: "roseli-berry", names: [] },
    ];
    snapshot.references.sourceCounts.items = 2;
    validateSnapshot(snapshot);
    snapshot.references.items[1]!.id = 723;
    expect(() => validateSnapshot(snapshot)).toThrow("duplicate identity 723");
  });

  it("resolves an unambiguous source form without a default flag", () => {
    const snapshot = fixture();
    const record = snapshot.species[0]!;
    record.varieties[0]!.forms[0]!.isDefault = false;
    validateSnapshot(snapshot);
    const result = resolvePokemon(record, snapshot.references, { language: "en", version: "red" });
    expect(result.status).toBe("available");
    expect(result.formId).toBe(25);
    expect(result.types).toMatchObject({ status: "available", value: [{ id: 13 }] });
  });

  it("rejects a truncated species export independently of its remaining valid records", () => {
    const snapshot = fixture();
    snapshot.species = [];
    expect(() => validateSnapshot(snapshot)).toThrow();
  });

  it("rejects truncated bounded nested collections and reference collections", () => {
    const nested = fixture();
    nested.species[0]!.varieties[0]!.learnsets.pop();
    expect(() => validateSnapshot(nested)).toThrow();
    const references = fixture();
    references.references.moves.pop();
    expect(() => validateSnapshot(references)).toThrow();
  });

  it("rejects invalid IDs and relationships instead of passing malformed rows to consumers", () => {
    const negative = fixture();
    negative.species[0]!.id = -25;
    expect(() => validateSnapshot(negative)).toThrow();
    const broken = fixture();
    broken.species[0]!.varieties[0]!.learnsets[0]!.moveId = 999999;
    expect(() => validateSnapshot(broken)).toThrow();
    const malformed: unknown = { references: null, species: [] };
    expect(() => validateSnapshot(malformed)).toThrow();
  });

  it("rejects duplicate historical identities even if all extraction counts agree", () => {
    const snapshot = fixture();
    const variety = snapshot.species[0]!.varieties[0]!;
    variety.abilityHistory.push({ ...variety.abilityHistory[0]! });
    variety.sourceCounts.abilityHistory = 2;
    expect(() => validateSnapshot(snapshot)).toThrow();
  });

  it("rejects duplicated form identities and false aggregate coverage", () => {
    const duplicate = fixture();
    const variety = duplicate.species[0]!.varieties[0]!;
    variety.forms.push({ ...variety.forms[0]!, isDefault: false });
    variety.sourceCounts.forms = 2;
    duplicate.references.census.forms = 2;
    expect(() => validateSnapshot(duplicate)).toThrow();
    const coverage = fixture();
    coverage.references.coverage[0]!.learnsetRows = 0;
    expect(() => validateSnapshot(coverage)).toThrow();
  });

  it("rejects ancestry cycles across otherwise valid species", () => {
    const snapshot = fixture();
    const first = snapshot.species[0]!;
    const second = structuredClone(first);
    second.id = 26;
    second.identifier = "raichu";
    second.evolvesFromSpeciesId = 25;
    second.varieties[0]!.id = 26;
    second.varieties[0]!.identifier = "raichu";
    second.varieties[0]!.forms[0]!.id = 26;
    second.varieties[0]!.forms[0]!.identifier = "raichu";
    first.evolvesFromSpeciesId = 26;
    snapshot.species.push(second);
    snapshot.references.census = { species: 2, pokemon: 2, forms: 2, learnsets: 6, evolutions: 0 };
    for (const row of snapshot.references.coverage) {
      row.learnsetRows *= 2;
      row.speciesFlavorTextRows *= 2;
    }
    expect(() => validateSnapshot(snapshot)).toThrow();
  });

  it("preserves valid absence rather than requiring fabricated modern fallback values", () => {
    const snapshot = fixture();
    const record = snapshot.species[0]!;
    const variety = record.varieties[0]!;
    variety.statHistory.pop();
    variety.sourceCounts.statHistory = 2;
    variety.abilities = [];
    variety.abilityHistory = [];
    variety.sourceCounts.abilities = 0;
    variety.sourceCounts.abilityHistory = 0;
    validateSnapshot(snapshot);
    expect(
      resolvePokemon(record, snapshot.references, { language: "en", version: "red" }).stats.status,
    ).toBe("missing");
    expect(
      resolvePokemon(record, snapshot.references, { language: "en", version: "x" }).abilities
        .status,
    ).toBe("missing");
  });
});
