import { describe, expect, it } from "vite-plus/test";
import {
  compactNames,
  expandNames,
  intersectLearners,
  movesetUrl,
  parseMoveLearners,
  projectMoveLearners,
  readMovesetSelection,
  type LearnerIdentity,
} from "./moveset.ts";

const identity = (
  speciesId: number,
  pokemonId = speciesId,
  overrides: Partial<LearnerIdentity> = {},
): LearnerIdentity => ({
  speciesId,
  pokemonId,
  form: null,
  generationId: 1,
  introducedVersionGroupId: 1,
  ...overrides,
});
type Learnset = { versionGroupId: number; learnMethodId: number; level: number };
type Learner = LearnerIdentity & { learnsets: Learnset[] };
const learner = (pokemon: LearnerIdentity, learnsets: Learnset[]): Learner => ({
  ...pokemon,
  learnsets,
});

// Group 1 = Red/Blue (order 1), group 25 = Scarlet/Violet (order 30), group 7 = later intro (order 40).
const order = new Map([
  [1, 1],
  [25, 30],
  [7, 40],
]);
const scarlet = { versionGroupId: 25, generationId: 9, order: 30 };
function file(moveId: number, rows: Learner[]) {
  return parseMoveLearners(JSON.parse(JSON.stringify(projectMoveLearners(moveId, rows))), moveId);
}

const pikachu = identity(25);
const raichu = identity(26);
const alolanRaichu = identity(26, 10100, {
  form: "raichu-alola",
  generationId: 1,
  introducedVersionGroupId: 7,
});
const unknownForm = identity(172, 172, { introducedVersionGroupId: null });
const zeraora = identity(807, 807, { generationId: 7 });

const thunderbolt = file(85, [
  learner(raichu, [
    { versionGroupId: 25, learnMethodId: 4, level: 0 },
    { versionGroupId: 1, learnMethodId: 4, level: 0 },
  ]),
  learner(pikachu, [
    { versionGroupId: 25, learnMethodId: 1, level: 36 },
    { versionGroupId: 25, learnMethodId: 4, level: 0 },
    { versionGroupId: 25, learnMethodId: 1, level: 36 },
    { versionGroupId: 25, learnMethodId: 1, level: 1 },
  ]),
  learner(alolanRaichu, [{ versionGroupId: 25, learnMethodId: 4, level: 0 }]),
  learner(unknownForm, [{ versionGroupId: 25, learnMethodId: 4, level: 0 }]),
]);
const thunder = file(87, [
  learner(pikachu, [{ versionGroupId: 25, learnMethodId: 1, level: 44 }]),
  learner(raichu, [{ versionGroupId: 1, learnMethodId: 4, level: 0 }]),
  learner(alolanRaichu, [{ versionGroupId: 25, learnMethodId: 4, level: 0 }]),
  learner(unknownForm, [{ versionGroupId: 25, learnMethodId: 4, level: 0 }]),
  learner(zeraora, [{ versionGroupId: 25, learnMethodId: 4, level: 0 }]),
]);

describe("moveset selection URLs", () => {
  it("reads repeated move IDs in order, collapsing duplicates", () => {
    expect(readMovesetSelection(new URLSearchParams("move=85&move=87&move=85"))).toEqual({
      ids: [85, 87],
      invalid: false,
    });
    expect(readMovesetSelection(new URLSearchParams("version=scarlet"))).toEqual({
      ids: [],
      invalid: false,
    });
  });

  it("flags malformed, unknown and surplus values instead of guessing", () => {
    for (const query of ["move=0", "move=01", "move=thunder", "move=", "move=1.5"]) {
      expect(readMovesetSelection(new URLSearchParams(query))).toEqual({ ids: [], invalid: true });
    }
    expect(readMovesetSelection(new URLSearchParams("move=85&move=99999"), new Set([85]))).toEqual({
      ids: [85],
      invalid: true,
    });
    expect(
      readMovesetSelection(new URLSearchParams("move=1&move=2&move=3&move=4&move=4&move=5")),
    ).toEqual({ ids: [1, 2, 3, 4], invalid: true });
  });

  it("replaces only the move parameters and keeps the game", () => {
    const url = movesetUrl(
      new URL("https://example.test/en/moveset/?move=1&version=scarlet"),
      [85, 87, 85, 1, 2, 3],
    );
    expect(url.searchParams.getAll("move")).toEqual(["85", "87", "1", "2"]);
    expect(url.searchParams.get("version")).toBe("scarlet");
    expect(movesetUrl(url, []).search).toBe("?version=scarlet");
  });
});

describe("learner files", () => {
  it("keeps exact version groups and drops duplicate rows", () => {
    const projected = projectMoveLearners(85, [
      learner(pikachu, [
        { versionGroupId: 25, learnMethodId: 1, level: 36 },
        { versionGroupId: 25, learnMethodId: 1, level: 36 },
        { versionGroupId: 1, learnMethodId: 4, level: 0 },
      ]),
    ]);
    expect(projected).toEqual({
      moveId: 85,
      pokemon: [[25, 25, null, 1, 1]],
      groups: { "1": [[0, 4, 0]], "25": [[0, 1, 36]] },
    });
  });

  it("rejects files for another move or with dangling rows", () => {
    const projected = projectMoveLearners(85, [learner(pikachu, [])]);
    expect(() => parseMoveLearners(projected, 87)).toThrow();
    expect(() => parseMoveLearners({ ...projected, groups: { "25": [[3, 1, 1]] } }, 85)).toThrow();
    expect(() => parseMoveLearners({ ...projected, groups: { "25": [[0, 1]] } }, 85)).toThrow();
    expect(() => parseMoveLearners(null, 85)).toThrow();
  });
});

describe("moveset intersection", () => {
  it("returns nothing for an empty selection rather than every Pokémon", () => {
    expect(intersectLearners([], scarlet, order)).toEqual({
      rows: [],
      counts: [],
      missingIntroduction: 0,
    });
  });

  it("requires every move in the selected exact version group", () => {
    const result = intersectLearners([thunderbolt, thunder], scarlet, order);
    // Raichu learns Thunder only in Red/Blue, so it doesn't match in Scarlet/Violet.
    expect(result.rows.map((row) => row.pokemon.pokemonId)).toEqual([25]);
    expect(result.counts).toEqual([
      { moveId: 85, count: 2 },
      { moveId: 87, count: 2 },
    ]);
    const redBlue = intersectLearners(
      [thunderbolt, thunder],
      { versionGroupId: 1, generationId: 1, order: 1 },
      order,
    );
    expect(redBlue.rows.map((row) => row.pokemon.pokemonId)).toEqual([26]);
    expect(redBlue.counts).toEqual([
      { moveId: 85, count: 1 },
      { moveId: 87, count: 1 },
    ]);
  });

  it("groups levels by method in selection order", () => {
    const [row] = intersectLearners([thunder, thunderbolt], scarlet, order).rows;
    expect(row!.moves).toEqual([
      { moveId: 87, methods: [{ learnMethodId: 1, levels: [44] }] },
      {
        moveId: 85,
        methods: [
          { learnMethodId: 1, levels: [1, 36] },
          { learnMethodId: 4, levels: [0] },
        ],
      },
    ]);
  });

  it("ignores duplicate move files", () => {
    const result = intersectLearners([thunderbolt, thunderbolt], scarlet, order);
    expect(result.counts).toEqual([{ moveId: 85, count: 2 }]);
    expect(result.rows.every((row) => row.moves.length === 1)).toBe(true);
  });

  it("excludes later species and forms, and reports unknown chronology", () => {
    const later = { ...scarlet, generationId: 6 };
    const result = intersectLearners([thunderbolt, thunder], later, order);
    // Zeraora (Gen VII) and the Alolan form (introduced after this game) are excluded.
    expect(result.rows.map((row) => row.pokemon.pokemonId)).toEqual([25]);
    expect(result.missingIntroduction).toBe(1);
    const withAlola = intersectLearners([thunderbolt, thunder], { ...scarlet, order: 40 }, order);
    expect(withAlola.rows.map((row) => row.pokemon.pokemonId)).toEqual([25, 10100]);
    expect(withAlola.rows[1]!.pokemon.form).toBe("raichu-alola");
  });
});

describe("compact names", () => {
  it("round-trips localized names for the page language", () => {
    const name = {
      text: "Pikachu",
      requestedLanguage: "fr" as const,
      sourceLanguageId: 9,
      fallback: true,
    };
    expect(expandNames(compactNames([[25, name]]), "fr").get(25)).toEqual(name);
  });
});
