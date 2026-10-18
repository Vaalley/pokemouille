import type {
  DatasetManifest,
  NamedResource,
  ReferenceData,
  VersionGroup,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { pokemonName } from "../../../../../packages/pokemon-data/src/resolve.ts";
import {
  breedingMechanic,
  compatibleParent,
  type BreedingMember,
  type BreedingProjection,
  type MoveSource,
} from "../data/breeding.ts";
import { createSnapshotCache, forEachSpecies, readDataJson } from "./snapshot.ts";

interface BreedingIndex {
  revision: string;
  groups: NamedResource[];
  versionGroups: VersionGroup[];
  members: Map<number, BreedingMember>;
  species: Map<number, number[]>;
  eggMoves: Map<number, Map<string, Set<number>>>;
  sources: Map<string, MoveSource[]>;
}

/** One bounded, revision-aware server pass; full species/learnset records are discarded. */
const getIndex = createSnapshotCache(async (manifest: DatasetManifest): Promise<BreedingIndex> => {
  const refs = await readDataJson<ReferenceData>(manifest.files.references.path);
  const groupOrders = new Map(refs.versionGroups.map((group) => [group.id, group.order]));
  const eggMethod = refs.learnMethods.find((method) => method.identifier === "egg")?.id;
  if (eggMethod === undefined) throw new Error("Missing egg learn method in published snapshot");
  const index: BreedingIndex = {
    revision: manifest.datasetRevision,
    groups: refs.eggGroups,
    versionGroups: refs.versionGroups,
    members: new Map(),
    species: new Map(),
    eggMoves: new Map(),
    sources: new Map(),
  };
  await forEachSpecies(manifest, (record) => {
    const varietyIds: number[] = [];
    const eggMoves = new Map<string, Set<number>>();
    for (const variety of record.varieties) {
      let form = variety.forms.find((entry) => entry.isDefault) ?? null;
      if (!form) {
        form =
          variety.forms
            .filter(
              (entry) => entry.versionGroupId !== null && groupOrders.has(entry.versionGroupId),
            )
            .toSorted(
              (a, b) =>
                groupOrders.get(a.versionGroupId!)! - groupOrders.get(b.versionGroupId!)! ||
                a.id - b.id,
            )[0] ?? null;
      }
      const names = {
        en: pokemonName(record, variety, form, "en"),
        fr: pokemonName(record, variety, form, "fr"),
        ja: pokemonName(record, variety, form, "ja"),
      };
      const member: BreedingMember = {
        speciesId: record.id,
        pokemonId: variety.id,
        form: variety.isDefault ? null : (form?.identifier ?? variety.identifier),
        names,
        generationId: record.generationId,
        introductionOrder:
          form?.versionGroupId == null ? null : (groupOrders.get(form.versionGroupId) ?? null),
        genderRate: record.genderRate,
        eggGroupIds: record.eggGroupIds,
        isBaby: record.isBaby,
      };
      index.members.set(variety.id, member);
      varietyIds.push(variety.id);
      const moves = new Map<string, boolean>();
      for (const row of variety.learnsets) {
        const key = `${row.versionGroupId}:${row.moveId}`;
        moves.set(key, (moves.get(key) ?? false) || row.learnMethodId !== eggMethod);
        if (row.learnMethodId === eggMethod) {
          let recipients = eggMoves.get(key);
          if (!recipients) eggMoves.set(key, (recipients = new Set()));
          recipients.add(variety.id);
        }
      }
      for (const [key, direct] of moves) {
        let sources = index.sources.get(key);
        if (!sources) index.sources.set(key, (sources = []));
        sources.push({ pokemonId: variety.id, direct });
      }
    }
    index.species.set(record.id, varietyIds);
    index.eggMoves.set(record.id, eggMoves);
  });
  for (const sources of index.sources.values()) sources.sort((a, b) => a.pokemonId - b.pokemonId);
  return index;
});

export async function getEggGroups() {
  const index = await getIndex();
  return { revision: index.revision, groups: index.groups };
}

export async function getEggGroupMembers(groupId: number) {
  const index = await getIndex();
  return [...index.members.values()]
    .filter((member) => member.eggGroupIds.includes(groupId))
    .sort((a, b) => a.speciesId - b.speciesId || a.pokemonId - b.pokemonId);
}

/** Emit only the requested species' egg-move relationships, never the global learnset index. */
export async function getBreedingProjection(
  speciesId: number,
  revision: string,
): Promise<BreedingProjection | null> {
  const index = await getIndex();
  const ids = index.species.get(speciesId);
  if (index.revision !== revision || !ids) return null;
  const targets = ids.map((id) => index.members.get(id)!);
  const members = new Map(targets.map((member) => [member.pokemonId, member]));
  const moves: BreedingProjection["moves"] = [];
  const groups = new Map(index.versionGroups.map((group) => [group.id, group]));
  for (const [key, recipients] of index.eggMoves.get(speciesId) ?? []) {
    const [versionGroupId = 0, moveId = 0] = key.split(":").map(Number);
    const group = groups.get(versionGroupId);
    if (!group || breedingMechanic(group) === "none") continue;
    const sources = (index.sources.get(key) ?? []).filter((source) => {
      const member = index.members.get(source.pokemonId)!;
      if (
        breedingMechanic(group) !== "mirror-herb" &&
        !targets.some((target) => compatibleParent(target, member, group.generationId))
      )
        return false;
      members.set(member.pokemonId, member);
      return true;
    });
    moves.push({
      versionGroupId,
      moveId,
      recipientPokemonIds: [...recipients].sort((a, b) => a - b),
      sources,
    });
  }
  return {
    speciesId,
    members: [...members.values()].sort((a, b) => a.pokemonId - b.pokemonId),
    moves: moves.sort((a, b) => a.versionGroupId - b.versionGroupId || a.moveId - b.moveId),
  };
}
