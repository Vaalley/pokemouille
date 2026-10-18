import { describe, expect, it } from "vite-plus/test";
import type { Catalogue, CatalogueSpecies } from "./catalogue.ts";
import { regionalDexChoices, resolveDexSelection, speciesDexNumber } from "./regional-dex.ts";

const name = (text: string) =>
  ({ text, requestedLanguage: "en", sourceLanguageId: 9, fallback: false }) as const;
const mapping: Pick<Catalogue, "pokedexes" | "versions"> = {
  versions: [
    ["red", 1],
    ["scarlet", 25],
    ["violet", 25],
    ["x", 15],
  ],
  pokedexes: [
    { id: 1, name: name("National"), versionGroupIds: [1, 25] },
    { id: 2, name: name("Kanto"), versionGroupIds: [1] },
    { id: 31, name: name("Paldea"), versionGroupIds: [25] },
    { id: 32, name: name("Kitakami"), versionGroupIds: [25, 25] },
    { id: 33, name: name("Blueberry"), versionGroupIds: [25] },
    { id: 32, name: name("Kitakami"), versionGroupIds: [25] },
  ],
};

const species: CatalogueSpecies = {
  id: 25,
  name: "Pikachu",
  generationId: 1,
  typeIds: [13],
  stats: null,
  abilityIds: [],
  hiddenAbilityIds: [],
  classification: "ordinary",
  dexNumbers: [
    [1, 25],
    [31, 74],
    [32, 0],
    [33, 21],
  ],
};

describe("exact-game regional Pokédex selection", () => {
  it("offers every mapped base and DLC dex once, never National as a regional choice", () => {
    expect(regionalDexChoices(mapping, "scarlet").map((dex) => dex.id)).toEqual([31, 32, 33]);
    expect(regionalDexChoices(mapping, "violet").map((dex) => dex.id)).toEqual([31, 32, 33]);
    expect(regionalDexChoices(mapping, "red").map((dex) => dex.id)).toEqual([2]);
    expect(resolveDexSelection(null, mapping, null)).toEqual({ status: "national", id: 1 });
    expect(resolveDexSelection("1", mapping, "red")).toEqual({ status: "national", id: 1 });
  });

  it("does not substitute another game or infer regional choices when mapping is missing", () => {
    expect(regionalDexChoices(mapping, "x")).toEqual([]);
    expect(regionalDexChoices(mapping, "unknown")).toEqual([]);
    expect(regionalDexChoices(mapping, null)).toEqual([]);
    expect(resolveDexSelection("31", mapping, "x")).toMatchObject({
      status: "invalid",
      requested: "31",
    });
    expect(resolveDexSelection("31", mapping, "red")).toMatchObject({
      status: "invalid",
      requested: "31",
      dex: { id: 31 },
    });
    expect(resolveDexSelection("31", mapping, "scarlet")).toMatchObject({
      status: "regional",
      id: 31,
    });
    expect(resolveDexSelection("31", mapping, null)).toEqual({ status: "waiting" });
  });

  it("retains unknown, malformed and wrong-game URL selections for explicit correction", () => {
    for (const requested of ["999", "", "0", "-1", "3.1", "3e1", "wrong", "9007199254740993"])
      expect(resolveDexSelection(requested, mapping, "scarlet")).toEqual({
        status: "invalid",
        requested,
        dex: null,
      });
    expect(resolveDexSelection("2", mapping, "scarlet")).toMatchObject({
      status: "invalid",
      requested: "2",
      dex: { id: 2 },
    });
    expect(resolveDexSelection("031", mapping, "scarlet")).toMatchObject({
      status: "regional",
      id: 31,
    });
  });

  it("keeps zero as regional membership and missing membership distinct from National", () => {
    expect(speciesDexNumber(species)).toBe(25);
    expect(speciesDexNumber(species, 31)).toBe(74);
    expect(speciesDexNumber(species, 32)).toBe(0);
    expect(speciesDexNumber(species, 33)).toBe(21);
    expect(speciesDexNumber(species, 2)).toBeNull();
    expect(speciesDexNumber({ ...species, dexNumbers: [] })).toBe(25);
  });
});
