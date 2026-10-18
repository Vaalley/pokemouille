import type {
  LocalizedText,
  ReferenceData,
} from "../../../../../packages/pokemon-data/src/index.ts";
import { localize } from "../../../../../packages/pokemon-data/src/localization.ts";
import { introductionStatus } from "../../../../../packages/pokemon-data/src/resolve.ts";
import type { RelatedPokemonData } from "./catalogue.ts";
import type { Language } from "../i18n/core.ts";

export interface MachinePokemon {
  speciesId: number;
  pokemonId: number;
  form: string | null;
  name: LocalizedText;
}

export interface MachineMapping {
  id: number;
  versionGroupId: number;
  item: { id: number; identifier: string; name: LocalizedText };
  move: { id: number; typeId: number; name: LocalizedText };
  pokemonIds: number[];
  missingIntroduction: number;
}

export interface MachinesData {
  mappings: MachineMapping[];
  pokemon: MachinePokemon[];
}

type MachineReferences = {
  machines: ReferenceData["machines"];
  items: Pick<ReferenceData["items"][number], "id" | "identifier" | "names">[];
  moves: Pick<ReferenceData["moves"][number], "id" | "identifier" | "names" | "typeId">[];
  learnMethods: Pick<ReferenceData["learnMethods"][number], "id" | "identifier">[];
  versionGroups: Pick<ReferenceData["versionGroups"][number], "id" | "generationId" | "order">[];
};

/**
 * Project only this resource's source mappings. An item's learners must have a
 * MACHINE record for the taught move in the mapping's exact version group.
 * Identity is shared across mappings; unrelated moves, groups and methods never
 * cross the page boundary. Unknown introduction chronology is counted separately
 * from confirmed learners, using the same status rules as Pokémon resolution.
 * Move pages already have their own learner section.
 */
export function projectMachines(
  refs: MachineReferences,
  lang: Language,
  resource: { kind: "item" | "move"; id: number },
  related: ReadonlyMap<number, RelatedPokemonData> = new Map(),
): MachinesData {
  const machineMethodId = refs.learnMethods.find((row) => row.identifier === "machine")?.id;
  const groups = new Map(refs.versionGroups.map((group) => [group.id, group]));
  const pokemon = new Map<number, MachinePokemon>();
  const mappings: MachineMapping[] = [];
  for (const machine of refs.machines) {
    if ((resource.kind === "item" ? machine.itemId : machine.moveId) !== resource.id) continue;
    const item = refs.items.find((row) => row.id === machine.itemId);
    const move = refs.moves.find((row) => row.id === machine.moveId);
    // Do not invent a label or target when a referenced source record is absent.
    if (!item || !move) continue;
    const pokemonIds: number[] = [];
    let missingIntroduction = 0;
    const group = groups.get(machine.versionGroupId);
    if (resource.kind === "item" && machineMethodId !== undefined) {
      for (const entry of related.get(move.id)?.pokemon ?? []) {
        if (
          !entry.learnsets.some(
            (row) =>
              row.versionGroupId === machine.versionGroupId &&
              row.learnMethodId === machineMethodId,
          )
        )
          continue;
        const introduced =
          entry.introducedVersionGroupId === null
            ? undefined
            : groups.get(entry.introducedVersionGroupId)?.order;
        const status = group
          ? introductionStatus(entry.generationId, introduced, group)
          : "unknown";
        if (status === "not-introduced") continue;
        if (status === "unknown") {
          missingIntroduction += 1;
          continue;
        }
        pokemonIds.push(entry.pokemonId);
        if (!pokemon.has(entry.pokemonId)) {
          pokemon.set(entry.pokemonId, {
            speciesId: entry.speciesId,
            pokemonId: entry.pokemonId,
            form: entry.form,
            name: entry.name,
          });
        }
      }
    }
    mappings.push({
      id: machine.id,
      versionGroupId: machine.versionGroupId,
      item: {
        id: item.id,
        identifier: item.identifier,
        name: localize(item.names, lang, item.identifier),
      },
      move: { id: move.id, typeId: move.typeId, name: localize(move.names, lang, move.identifier) },
      pokemonIds,
      missingIntroduction,
    });
  }
  return {
    mappings,
    pokemon: [...pokemon.values()].sort(
      (a, b) => a.speciesId - b.speciesId || a.pokemonId - b.pokemonId,
    ),
  };
}

/** Never carry a machine mapping forward to a different game group. */
export function machinesForGroup(data: MachinesData, versionGroupId: number): MachineMapping[] {
  return data.mappings.filter((row) => row.versionGroupId === versionGroupId);
}
