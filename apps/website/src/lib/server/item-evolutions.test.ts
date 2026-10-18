import { describe, expect, it } from "vite-plus/test";
import type {
  EvolutionChainProjection,
  EvolutionMethod,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { evolutionTree } from "../data/evolution-tree.ts";
import { selectItemEvolutions } from "./item-evolutions.ts";

function method(
  id: number,
  conditions: EvolutionMethod["conditions"],
  scope: number | null = null,
): EvolutionMethod {
  return {
    id,
    evolvedSpeciesId: 38,
    triggerId: 3,
    versionGroupId: scope,
    isDefault: scope === null,
    conditions,
  };
}

function node(
  speciesId: number,
  parent: number | null,
  methods: EvolutionMethod[] = [],
): EvolutionChainProjection["nodes"][number] {
  return {
    speciesId,
    identifier: `species-${speciesId}`,
    names: [],
    generationId: 1,
    evolvesFromSpeciesId: parent,
    methods,
  };
}

const chain = (nodes: EvolutionChainProjection["nodes"]): EvolutionChainProjection => ({
  chainId: 15,
  applicability: "unresolved",
  nodes,
});

describe("selectItemEvolutions", () => {
  it("keeps conjunctive conditions, unknown source values and exact provenance rather than making a universal rule", () => {
    const scoped = method(
      1,
      {
        evolution_item_id: 82,
        required_pokemon_form_id: 10103,
        evolved_pokemon_form_id: 10104,
        time_of_day: "night",
        min_level: 0,
        condition_expression: "source requirement",
        undocumented_source_column: "unresolved",
        location_id: null,
      },
      17,
    );
    const unscoped = method(2, { evolution_item_id: 82, min_happiness: 220 });
    const source = chain([
      node(37, null),
      node(38, 37, [scoped, unscoped, method(3, { evolution_item_id: 84 })]),
      node(99, 37, [method(4, { held_item_id: 99 })]),
    ]);
    const selected = selectItemEvolutions(source, 82);
    expect(selected).toEqual({
      chainId: 15,
      applicability: "unresolved",
      nodes: [node(37, null), node(38, 37, [scoped, unscoped])],
    });
    expect(source.nodes[1]!.methods).toHaveLength(3);
  });

  it("distinguishes use and held requirements without treating other item-like columns as evolution links", () => {
    const used = method(1, { evolution_item_id: 82 });
    const held = method(2, { held_item_id: 82, trade_species_id: 25 }, 8);
    const source = chain([node(37, null), node(38, 37, [used, held, method(3, { item_id: 82 })])]);
    expect(selectItemEvolutions(source, 82)?.nodes[1]!.methods).toEqual([used, held]);
    expect(selectItemEvolutions(source, 500)).toBeNull();
    expect(
      selectItemEvolutions(chain([node(38, 37, [method(3, { item_id: 82 })])]), 82),
    ).toBeNull();
  });

  it("retains required parent forms and resulting forms for the shared evolution renderer", () => {
    const selected = selectItemEvolutions(
      chain([
        node(37, null),
        node(38, 37, [
          method(
            1,
            {
              evolution_item_id: 82,
              required_pokemon_form_id: 10103,
              evolved_pokemon_form_id: 10104,
            },
            17,
          ),
        ]),
      ]),
      82,
    )!;
    const text = {
      text: "Regional form",
      requestedLanguage: "en",
      sourceLanguageId: 9,
      fallback: false,
    } as const;
    const roots = evolutionTree(selected, {
      10103: {
        speciesId: 37,
        identifier: "vulpix-alola",
        separate: true,
        versionGroupId: 17,
        name: text,
      },
      10104: {
        speciesId: 38,
        identifier: "ninetales-alola",
        separate: true,
        versionGroupId: 17,
        name: text,
      },
    });
    const regional = roots.find((row) => row.key === "37:10103");
    expect(regional?.form?.identifier).toBe("vulpix-alola");
    expect(regional?.children[0]?.form?.identifier).toBe("ninetales-alola");
    expect(regional?.children[0]?.methods[0]?.conditions.required_pokemon_form_id).toBe(10103);
  });

  it("terminates on malformed ancestor cycles and does not manufacture missing parent identities", () => {
    const selected = selectItemEvolutions(
      chain([node(37, 38), node(38, 37, [method(1, { held_item_id: 82 })])]),
      82,
    );
    expect(selected?.nodes.map((row) => row.speciesId)).toEqual([37, 38]);
    expect(
      selectItemEvolutions(chain([node(38, 999, [method(1, { held_item_id: 82 })])]), 82)?.nodes,
    ).toHaveLength(1);
  });

  it("preserves a missing source chain ID instead of assigning a fabricated identity", () => {
    const selected = selectItemEvolutions(
      {
        ...chain([node(38, null, [method(1, { evolution_item_id: 82 })])]),
        chainId: null,
      },
      82,
    );
    expect(selected?.chainId).toBeNull();
    expect(selected?.nodes[0]?.methods[0]?.conditions.evolution_item_id).toBe(82);
  });
});
