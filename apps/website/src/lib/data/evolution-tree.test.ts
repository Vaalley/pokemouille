import { describe, expect, it } from "vite-plus/test";
import type {
  EvolutionChainProjection,
  EvolutionMethod,
  LocalizedText,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { evolutionTree } from "./evolution-tree.ts";
import type { EvolutionForm } from "./evolution-tree.ts";

function method(
  id: number,
  evolvedSpeciesId: number,
  conditions: EvolutionMethod["conditions"] = {},
): EvolutionMethod {
  return { id, evolvedSpeciesId, versionGroupId: 1, isDefault: true, triggerId: 3, conditions };
}
function node(
  speciesId: number,
  evolvesFromSpeciesId: number | null,
  methods: EvolutionMethod[],
): EvolutionChainProjection["nodes"][number] {
  return {
    speciesId,
    identifier: `s${speciesId}`,
    names: [],
    generationId: 1,
    evolvesFromSpeciesId,
    methods,
  };
}
function form(speciesId: number, identifier: string, separate: boolean): EvolutionForm {
  const name: LocalizedText = {
    text: identifier,
    requestedLanguage: "en",
    sourceLanguageId: 9,
    fallback: false,
  };
  return { speciesId, identifier, separate, versionGroupId: 17, name };
}

const vulpix: EvolutionChainProjection = {
  chainId: 15,
  applicability: "unresolved",
  nodes: [
    node(37, null, []),
    node(38, 37, [
      method(25, 38, { evolution_item_id: 82, evolved_pokemon_form_id: null }),
      method(26, 38, {
        evolution_item_id: 885,
        required_pokemon_form_id: 10205,
        evolved_pokemon_form_id: 10206,
      }),
    ]),
  ],
};

describe("evolutionTree", () => {
  it("branches Alolan Vulpix → Alolan Ninetales beside Vulpix → Ninetales", () => {
    const forms = {
      10205: form(37, "vulpix-alola", true),
      10206: form(38, "ninetales-alola", true),
    };
    const roots = evolutionTree(vulpix, forms);
    const shape = (nodes: typeof roots): unknown =>
      nodes.map((node) => [
        node.form?.identifier ?? node.speciesId,
        node.methods.map((row) => row.id),
        shape(node.children),
      ]);
    expect(shape(roots)).toEqual([
      [37, [], [[38, [25], []]]],
      ["vulpix-alola", [], [["ninetales-alola", [26], []]]],
    ]);
  });

  it("keeps cosmetic-form evolutions on the species card", () => {
    const forms = { 10206: form(38, "ninetales-cosmetic", false) };
    const [root] = evolutionTree(vulpix, forms);
    expect(root?.children).toHaveLength(1);
    expect(root?.children[0]?.methods.map((row) => row.id)).toEqual([25, 26]);
  });

  it("attaches later stages without a required form to the species card", () => {
    const chain: EvolutionChainProjection = {
      ...vulpix,
      nodes: [...vulpix.nodes, node(99, 38, [method(30, 99)])],
    };
    const [root] = evolutionTree(chain, { 10206: form(38, "ninetales-alola", true) });
    expect(root?.children[0]?.children.map((child) => child.speciesId)).toEqual([99]);
    expect(root?.children[1]?.children).toEqual([]);
  });

  it("hangs a stage that requires a regional form under that form's card", () => {
    // Mr. Mime → Galarian Mr. Mime → Mr. Rime (Mr. Rime requires the Galarian form).
    const chain: EvolutionChainProjection = {
      chainId: 57,
      applicability: "unresolved",
      nodes: [
        node(439, null, []),
        node(122, 439, [method(1, 122), method(2, 122, { evolved_pokemon_form_id: 10327 })]),
        node(866, 122, [method(3, 866, { required_pokemon_form_id: 10327 })]),
      ],
    };
    const [root] = evolutionTree(chain, { 10327: form(122, "mr-mime-galar", true) });
    const [plain, galar] = root?.children ?? [];
    expect(plain?.children).toEqual([]);
    expect(galar?.children.map((child) => child.speciesId)).toEqual([866]);
  });

  it("gives a regional base form its own card when only a later stage needs it", () => {
    // Meowth | Galarian Meowth → Perrserker; Galarian Meowth is not produced by evolution.
    const chain: EvolutionChainProjection = {
      chainId: 22,
      applicability: "unresolved",
      nodes: [
        node(52, null, []),
        node(53, 52, [method(1, 53)]),
        node(863, 52, [method(2, 863, { required_pokemon_form_id: 10161 })]),
      ],
    };
    const roots = evolutionTree(chain, { 10161: form(52, "meowth-galar", true) });
    expect(roots.map((root) => [root.speciesId, root.form?.identifier ?? null])).toEqual([
      [52, null],
      [52, "meowth-galar"],
    ]);
    expect(roots[0]?.children.map((child) => child.speciesId)).toEqual([53]);
    expect(roots[1]?.methods).toEqual([]);
    expect(roots[1]?.children.map((child) => child.speciesId)).toEqual([863]);
  });
});
