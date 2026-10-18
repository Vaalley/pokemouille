import { describe, expect, it } from "vite-plus/test";
import {
  MAX_COMPARED,
  addCompared,
  compareKey,
  compareStats,
  compareUrl,
  markHighest,
  parseCompared,
  readCompareSelection,
  removeCompared,
  splitDefensiveMatchups,
} from "./compare.ts";

const read = (query: string) => readCompareSelection(new URLSearchParams(query));

describe("compare URL", () => {
  it("parses species and species~form values", () => {
    expect(parseCompared("3")).toEqual({ speciesId: 3, form: null });
    expect(parseCompared("6~charizard-mega-x")).toEqual({ speciesId: 6, form: "charizard-mega-x" });
    expect(compareKey({ speciesId: 6, form: "charizard-mega-x" })).toBe("6~charizard-mega-x");
    expect(compareKey({ speciesId: 3, form: null })).toBe("3");
  });

  it("rejects malformed values without dropping the valid ones", () => {
    for (const value of [
      "",
      "0",
      "03",
      "-1",
      "1.5",
      "abc",
      "3~",
      "3~Mega",
      "3~a--b",
      "~x",
      "123456",
    ]) {
      expect(parseCompared(value)).toBeNull();
    }
    expect(read("p=3&p=nope&p=9")).toEqual({
      entries: [
        { speciesId: 3, form: null },
        { speciesId: 9, form: null },
      ],
      invalid: true,
      truncated: false,
    });
  });

  it("dedupes exact repeats but keeps different forms of a species", () => {
    expect(read("p=6&p=6&p=6~charizard-mega-y").entries).toEqual([
      { speciesId: 6, form: null },
      { speciesId: 6, form: "charizard-mega-y" },
    ]);
  });

  it(`keeps the first ${MAX_COMPARED} distinct Pokémon and reports truncation`, () => {
    const exact = read("p=1&p=2&p=3&p=4&p=5&p=6&p=1");
    expect(exact.entries.map(compareKey)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(exact.truncated).toBe(false);
    const over = read("p=1&p=2&p=3&p=4&p=5&p=6&p=7");
    expect(over.entries.map(compareKey)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect(over.truncated).toBe(true);
  });

  it("round-trips through the URL, keeping other parameters", () => {
    const url = compareUrl(new URL("https://example.test/fr/compare/?version=red&p=1"), [
      { speciesId: 3, form: null },
      { speciesId: 6, form: "charizard-gmax" },
      { speciesId: 3, form: null },
    ]);
    expect(url.searchParams.get("version")).toBe("red");
    expect(url.searchParams.getAll("p")).toEqual(["3", "6~charizard-gmax"]);
    expect(read(url.search).entries).toEqual([
      { speciesId: 3, form: null },
      { speciesId: 6, form: "charizard-gmax" },
    ]);
    expect(compareUrl(url, []).search).toBe("?version=red");
  });
});

describe("adding and removing", () => {
  const full = [1, 2, 3, 4, 5, 6].map((speciesId) => ({ speciesId, form: null }));

  it("adds new entries only, up to the maximum", () => {
    expect(addCompared([{ speciesId: 3, form: null }], { speciesId: 6, form: null })).toEqual([
      { speciesId: 3, form: null },
      { speciesId: 6, form: null },
    ]);
    expect(addCompared([{ speciesId: 3, form: null }], { speciesId: 3, form: null })).toHaveLength(
      1,
    );
    expect(addCompared(full, { speciesId: 7, form: null })).toEqual(full);
  });

  it("removes by key, leaving other forms of the species", () => {
    const entries = [
      { speciesId: 6, form: null },
      { speciesId: 6, form: "charizard-mega-x" },
    ];
    expect(removeCompared(entries, "6~charizard-mega-x")).toEqual([{ speciesId: 6, form: null }]);
    expect(removeCompared(entries, "9")).toEqual(entries);
  });
});

describe("highest values", () => {
  it("marks every tied maximum", () => {
    expect(markHighest([80, 100, 100, 50])).toEqual([false, true, true, false]);
  });

  it("ignores unknown values", () => {
    expect(markHighest([null, 85, 78])).toEqual([false, true, false]);
  });

  it("highlights nothing without a real comparison", () => {
    expect(markHighest([90])).toEqual([false]);
    expect(markHighest([90, null])).toEqual([false, false]);
    expect(markHighest([70, 70])).toEqual([false, false]);
    expect(markHighest([])).toEqual([]);
  });
});

describe("compareStats", () => {
  const stat = (id: number, value: number) => ({ id, value });

  it("aligns stats by id and totals known columns only", () => {
    const venusaur = [stat(1, 80), stat(2, 82), stat(9, 100)];
    const charizard = [stat(1, 78), stat(2, 84), stat(9, 85)];
    const { rows, total } = compareStats([venusaur, null, charizard]);
    expect(rows.map((row) => row.stat.id)).toEqual([1, 2, 9]);
    expect(rows[0]).toMatchObject({ values: [80, null, 78], highest: [true, false, false] });
    expect(rows[1]).toMatchObject({ values: [82, null, 84], highest: [false, false, true] });
    expect(total).toEqual({ values: [262, null, 247], highest: [true, false, false] });
  });

  it("leaves a stat a column lacks empty instead of guessing it", () => {
    const { rows } = compareStats([[stat(1, 50), stat(3, 40)], [stat(1, 60)]]);
    expect(rows.map((row) => row.values)).toEqual([
      [50, 60],
      [40, null],
    ]);
  });
});

describe("splitDefensiveMatchups", () => {
  it("groups by multiplier, strongest effect first", () => {
    const groups = splitDefensiveMatchups([
      { typeId: 3, multiplier: 2 },
      { typeId: 5, multiplier: 0 },
      { typeId: 10, multiplier: 4 },
      { typeId: 11, multiplier: 0.5 },
      { typeId: 12, multiplier: 0.25 },
      { typeId: 1, multiplier: 1 },
    ]);
    expect(groups.weaknesses.map((row) => row.typeId)).toEqual([10, 3]);
    expect(groups.resistances.map((row) => row.typeId)).toEqual([12, 11]);
    expect(groups.immunities.map((row) => row.typeId)).toEqual([5]);
  });
});
