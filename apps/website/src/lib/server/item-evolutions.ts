import type {
  DatasetManifest,
  EvolutionChainProjection,
  Language,
  PokemonReferences,
  ReferenceData,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { pokemonName } from "../../../../../packages/pokemon-data/src/resolve.ts";
import type { EvolutionForm } from "../data/evolution-tree.ts";
import { createSnapshotCache, forEachSpecies, readDataJson } from "./snapshot.ts";

const LANGUAGES: readonly Language[] = ["en", "fr", "ja"];

type EvolutionReferences = Pick<
  PokemonReferences,
  "evolutionTriggers" | "versionGroups" | "versions" | "items" | "types"
> & {
  moves: Pick<PokemonReferences["moves"][number], "id" | "identifier" | "names" | "typeId">[];
};

type ItemEvolutionChain = Omit<EvolutionChainProjection, "chainId"> & { chainId: number | null };

export interface ItemEvolutionData {
  chains: {
    key: string;
    chain: ItemEvolutionChain;
    forms: Record<number, EvolutionForm>;
  }[];
  references: EvolutionReferences;
}

interface IndexedChain {
  key: string;
  chain: ItemEvolutionChain;
  forms: Record<Language, Record<number, EvolutionForm>>;
}
interface Snapshot {
  items: Map<number, IndexedChain[]>;
  references: EvolutionReferences;
}

/** Keep every conjunctive requirement and source scope; only remove unrelated methods/branches. */
export function selectItemEvolutions(
  chain: ItemEvolutionChain,
  itemId: number,
): ItemEvolutionChain | null {
  const selected = new Map<number, EvolutionChainProjection["nodes"][number]>();
  const source = new Map(chain.nodes.map((node) => [node.speciesId, node]));
  for (const node of chain.nodes) {
    const methods = node.methods.filter(
      (method) =>
        method.conditions.evolution_item_id === itemId || method.conditions.held_item_id === itemId,
    );
    if (methods.length) selected.set(node.speciesId, { ...node, methods });
  }
  if (!selected.size) return null;
  for (const node of selected.values()) {
    let parentId = node.evolvesFromSpeciesId;
    const visited = new Set<number>();
    while (parentId !== null && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = source.get(parentId);
      if (!parent) break;
      if (!selected.has(parentId)) selected.set(parentId, { ...parent, methods: [] });
      parentId = parent.evolvesFromSpeciesId;
    }
  }
  return {
    ...chain,
    nodes: chain.nodes
      .filter((node) => selected.has(node.speciesId))
      .map((node) => selected.get(node.speciesId)!),
  };
}

/** One bounded species pass per immutable dataset revision, shared across all item routes/locales. */
async function buildSnapshot(manifest: DatasetManifest): Promise<Snapshot> {
  const refs = await readDataJson<ReferenceData>(manifest.files.references.path);
  const references: EvolutionReferences = {
    evolutionTriggers: refs.evolutionTriggers,
    versionGroups: refs.versionGroups,
    versions: refs.versions,
    items: refs.items.map(({ id, identifier, names }) => ({ id, identifier, names })),
    moves: refs.moves.map(({ id, identifier, names, typeId }) => ({
      id,
      identifier,
      names,
      typeId,
    })),
    types: refs.types,
  };
  const chains = new Map<string, IndexedChain>();
  await forEachSpecies(manifest, (record) => {
    // A missing chain ID must not merge unrelated species into an invented chain.
    const key =
      record.evolutionChainId === null
        ? `species:${record.id}`
        : `chain:${record.evolutionChainId}`;
    let entry = chains.get(key);
    if (!entry) {
      entry = {
        key,
        chain: { chainId: record.evolutionChainId, applicability: "unresolved", nodes: [] },
        forms: { en: {}, fr: {}, ja: {} },
      };
      chains.set(key, entry);
    }
    entry.chain.nodes.push({
      speciesId: record.id,
      identifier: record.identifier,
      names: record.names,
      generationId: record.generationId,
      evolvesFromSpeciesId: record.evolvesFromSpeciesId,
      methods: record.evolutions,
    });
    // Keep identities only, never retain full records or their learnsets in the index.
    for (const variety of record.varieties)
      for (const form of variety.forms)
        for (const lang of LANGUAGES)
          entry.forms[lang][form.id] = {
            speciesId: record.id,
            identifier: form.identifier,
            separate: !variety.isDefault,
            versionGroupId: form.versionGroupId,
            name: pokemonName(record, variety, form, lang),
          };
  });
  const items = new Map<number, IndexedChain[]>();
  for (const entry of chains.values()) {
    entry.chain.nodes.sort((a, b) => a.speciesId - b.speciesId);
    const itemIds = new Set<number>();
    for (const node of entry.chain.nodes)
      for (const method of node.methods)
        for (const key of ["evolution_item_id", "held_item_id"] as const) {
          const id = method.conditions[key];
          if (typeof id === "number") itemIds.add(id);
        }
    for (const itemId of itemIds) {
      const chain = selectItemEvolutions(entry.chain, itemId)!;
      const formIds = new Set<number>();
      for (const node of chain.nodes)
        for (const method of node.methods)
          for (const key of ["evolved_pokemon_form_id", "required_pokemon_form_id"] as const) {
            const id = method.conditions[key];
            if (typeof id === "number") formIds.add(id);
          }
      const forms = (lang: Language) =>
        Object.fromEntries(
          [...formIds]
            .filter((id) => entry.forms[lang][id])
            .map((id) => [id, entry.forms[lang][id]!]),
        );
      const rows = items.get(itemId) ?? [];
      rows.push({
        key: entry.key,
        chain,
        forms: { en: forms("en"), fr: forms("fr"), ja: forms("ja") },
      });
      items.set(itemId, rows);
    }
  }
  for (const rows of items.values())
    rows.sort((a, b) => a.chain.nodes[0]!.speciesId - b.chain.nodes[0]!.speciesId);
  return { items, references };
}

const getSnapshot = createSnapshotCache(buildSnapshot);

/** Only this item's matching methods and the reference names they use reach the browser. */
export async function getItemEvolutions(
  itemId: number,
  lang: Language,
): Promise<ItemEvolutionData> {
  const snapshot = await getSnapshot();
  const chains = (snapshot.items.get(itemId) ?? []).map((entry) => ({
    key: entry.key,
    chain: entry.chain,
    forms: entry.forms[lang],
  }));
  const used = {
    items: new Set<number>(),
    moves: new Set<number>(),
    types: new Set<number>(),
    triggers: new Set<number>(),
  };
  for (const { chain } of chains)
    for (const node of chain.nodes)
      for (const method of node.methods) {
        used.triggers.add(method.triggerId);
        for (const [key, value] of Object.entries(method.conditions)) {
          if (typeof value !== "number") continue;
          if (["evolution_item_id", "held_item_id", "item_id", "trigger_item_id"].includes(key))
            used.items.add(value);
          if (["known_move_id", "used_move_id"].includes(key)) used.moves.add(value);
          if (["known_move_type_id", "party_type_id"].includes(key)) used.types.add(value);
        }
      }
  return {
    chains,
    references: {
      versions: chains.length ? snapshot.references.versions : [],
      versionGroups: chains.length ? snapshot.references.versionGroups : [],
      evolutionTriggers: snapshot.references.evolutionTriggers.filter((row) =>
        used.triggers.has(row.id),
      ),
      items: snapshot.references.items.filter((row) => used.items.has(row.id)),
      moves: snapshot.references.moves.filter((row) => used.moves.has(row.id)),
      types: snapshot.references.types.filter((row) => used.types.has(row.id)),
    },
  };
}
