import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vite-plus/test";
import type {
  DatasetManifest,
  ReferenceData,
  SpeciesRecord,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { getMainSeriesGames } from "../../../../../packages/pokemon-data/src/games.ts";
import {
  pokemonTypesAtGeneration,
  resolvePokemon,
} from "../../../../../packages/pokemon-data/src/resolve.ts";
import { pokemonHref } from "../data/context.ts";
import { filterTypeMembers, matchesTypes, type TypeMember } from "../data/type-membership.ts";
import { projectTypeMembers } from "./catalogue.ts";

const root = new URL("../../../static/data/", import.meta.url);
let references: ReferenceData;
let records: SpeciesRecord[];
let members: TypeMember[];

beforeAll(async () => {
  const manifest: DatasetManifest = JSON.parse(
    await readFile(new URL("manifest.json", root), "utf8"),
  );
  references = JSON.parse(await readFile(new URL(manifest.files.references.path, root), "utf8"));
  records = await Promise.all(
    [1, 2, 3, 35, 81, 152, 201, 479, 666].map(
      async (id) =>
        JSON.parse(
          await readFile(new URL(manifest.files.pokemon[String(id)]!.path, root), "utf8"),
        ) as SpeciesRecord,
    ),
  );
  const groups = new Map(references.versionGroups.map((group) => [group.id, group.order]));
  members = records.flatMap((record) => projectTypeMembers(record, groups).en);
});

function game(version: string) {
  const selected = getMainSeriesGames(references).find(
    (entry) => entry.version.identifier === version,
  );
  if (!selected) throw new Error(`Missing fixture game ${version}`);
  return selected.group;
}

describe("type membership from the published snapshot", () => {
  it("includes the Bulbasaur family and forms, excludes pure Grass, and ignores pair order", () => {
    const forward = filterTypeMembers(members, [12, 4], game("scarlet")).rows;
    expect(forward.map((row) => [row.speciesId, row.form])).toEqual(
      filterTypeMembers([...members].reverse(), [4, 12], game("scarlet")).rows.map((row) => [
        row.speciesId,
        row.form,
      ]),
    );
    expect([...new Set(forward.map((row) => row.speciesId))]).toEqual([1, 2, 3]);
    expect(forward.some((row) => row.form === "venusaur-mega")).toBe(true);
    expect(forward.some((row) => row.form === "venusaur-gmax")).toBe(true);
    const single = filterTypeMembers(members, [12], game("scarlet")).rows;
    expect(single.some((row) => row.speciesId === 152)).toBe(true);
    expect(single).toEqual(expect.arrayContaining(forward));
    expect(matchesTypes([12], [12, 4])).toBe(false);
    expect(matchesTypes([12, 4], [12, 12])).toBe(false);
  });

  it("does not repeat cosmetic forms with identical typing", () => {
    const psychic = filterTypeMembers(members, [14], game("scarlet")).rows;
    expect(psychic.filter((row) => row.speciesId === 201).map((row) => row.name.text)).toEqual([
      "Unown",
    ]);
    const bugFlying = filterTypeMembers(members, [7, 3], game("scarlet")).rows;
    expect(bugFlying.filter((row) => row.speciesId === 666).map((row) => row.name.text)).toEqual([
      "Vivillon",
    ]);
  });

  it("uses species and explicit form introduction chronology, not version-group IDs", () => {
    const red = filterTypeMembers(members, [12], game("red")).rows;
    expect(red.map((row) => row.speciesId)).toEqual([1, 2, 3]);
    expect(red.every((row) => row.form === null)).toBe(true);
    const x = filterTypeMembers(members, [12, 4], game("x")).rows;
    expect(x.some((row) => row.form === "venusaur-mega")).toBe(true);
    expect(x.some((row) => row.form === "venusaur-gmax")).toBe(false);
  });

  it("changes Clefairy, Magnemite and Rotom typing at the historical boundaries", () => {
    expect(filterTypeMembers(members, [18], game("black")).rows).toEqual([]);
    expect(
      filterTypeMembers(members, [18], game("x")).rows.some((row) => row.speciesId === 35),
    ).toBe(true);
    expect(filterTypeMembers(members, [13, 9], game("red")).rows).toEqual([]);
    expect(
      filterTypeMembers(members, [13, 9], game("gold")).rows.some((row) => row.speciesId === 81),
    ).toBe(true);
    const platinum = filterTypeMembers(members, [13, 8], game("platinum")).rows.filter(
      (row) => row.speciesId === 479,
    );
    expect(platinum.length).toBeGreaterThan(1);
    expect(filterTypeMembers(members, [13, 10], game("platinum")).rows).toEqual([]);
    expect(
      filterTypeMembers(members, [13, 10], game("black")).rows.some(
        (row) => row.form === "rotom-heat",
      ),
    ).toBe(true);
  });

  it("preserves exact detail destinations and agrees with detail types for every projected selection", () => {
    for (const version of ["red", "platinum", "black", "x", "scarlet"]) {
      for (const member of members) {
        const record = records.find((entry) => entry.id === member.speciesId)!;
        const view = resolvePokemon(record, references, {
          language: "en",
          version,
          ...(member.form ? { form: member.form } : {}),
        });
        const historical = pokemonTypesAtGeneration(member, game(version).generationId).map(
          (row) => row.typeId,
        );
        if (view.types.status === "available") {
          expect(historical).toEqual(view.types.value.map((row) => row.id));
          expect(filterTypeMembers([member], historical, game(version)).rows).toEqual([member]);
        } else {
          expect(filterTypeMembers([member], historical, game(version)).rows).toEqual([]);
        }
      }
    }
    const mega = members.find((row) => row.form === "venusaur-mega")!;
    expect(pokemonHref("fr", mega.speciesId, { version: "x", form: mega.form })).toBe(
      "/fr/pokemon/3/?version=x&form=venusaur-mega",
    );
  });

  it("exposes missing chronology and empty type facts without inventing membership", () => {
    const base = members.find((row) => row.speciesId === 1)!;
    expect(
      filterTypeMembers([{ ...base, introductionOrder: null }], [12], game("scarlet")),
    ).toMatchObject({
      rows: [],
      missingIntroduction: 1,
      missingTypes: 0,
    });
    expect(
      filterTypeMembers([{ ...base, types: [], typeHistory: [] }], [12], game("scarlet")),
    ).toMatchObject({
      rows: [],
      missingIntroduction: 0,
      missingTypes: 1,
    });
    const groups = new Map(references.versionGroups.map((group) => [group.id, group.order]));
    const record = records.find((row) => row.id === 1)!;
    expect(projectTypeMembers(record, groups).fr[0]!.name.text).toBe("Bulbizarre");
    expect(projectTypeMembers(record, groups).ja[0]!.name.text).toBe("フシギダネ");
  });
});

describe("shared historical type selection", () => {
  it("uses the earliest inclusive upper bound even when history is unsorted", () => {
    const source = {
      types: [{ slot: 1, typeId: 18 }],
      typeHistory: [
        { generationId: 5, types: [{ slot: 1, typeId: 1 }] },
        { generationId: 1, types: [{ slot: 1, typeId: 13 }] },
      ],
    };
    expect(pokemonTypesAtGeneration(source, 1)).toEqual([{ slot: 1, typeId: 13 }]);
    expect(pokemonTypesAtGeneration(source, 2)).toEqual([{ slot: 1, typeId: 1 }]);
    expect(pokemonTypesAtGeneration(source, 5)).toEqual([{ slot: 1, typeId: 1 }]);
    expect(pokemonTypesAtGeneration(source, 6)).toEqual([{ slot: 1, typeId: 18 }]);
    expect(source.types).toEqual([{ slot: 1, typeId: 18 }]);
  });
});
