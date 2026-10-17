import type {
  Ability,
  Item,
  Name,
  Move,
  NamedResource,
  PokemonVariety,
  ReferenceData,
  SpeciesRecord,
  TypeSlot,
} from "../../../packages/pokemon-data/src/index.ts";
import type {
  ReferencesQuery,
  SourceCensusFragment,
  SpeciesPageQuery,
} from "./generated/operations.ts";
export function sourceCount(
  value: { aggregate?: { count?: number } | null } | null | undefined,
): number {
  const count = value?.aggregate?.count;
  if (!Number.isSafeInteger(count) || count === undefined || count < 0)
    throw new Error("Missing or invalid upstream aggregate count");
  return count;
}

function required<T>(value: T | null | undefined, field: string): T {
  if (value === null || value === undefined)
    throw new Error(`Missing required source field: ${field}`);
  return value;
}

const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u3000-\u303f\uff00-\uffef]/u;

/**
 * In-game text keeps the cartridge text-box wrapping: `\n` line wraps, `\f` page breaks,
 * soft hyphens splitting words across lines, and sometimes a literal `\n` escape sequence.
 * None of these are paragraph breaks, so join them into flowing prose. Breaks next to
 * Japanese text join without a space; Japanese already separates words with U+3000.
 */
export function gameText(text: string): string {
  return text
    .replaceAll("\\n", "\n")
    .replace(/\u00ad[ \t]*[\n\f]\s*/g, "")
    .replace(/(\S)[ \t]*[\n\f]\s*/gu, (match, before: string, offset: number, all: string) => {
      const rest = all.slice(offset + match.length);
      // "Fire-\nand Ice-type" is a suspended hyphen, not a word split.
      if (before === "-" && !/^(?:and|or)\b/.test(rest)) return before;
      if (cjk.test(before) || cjk.test(rest[0] ?? "")) return before;
      return `${before} `;
    })
    .replace(/\s*[\n\f]\s*/g, " ")
    .replaceAll("\u00ad", "")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function validateCensus(data: SourceCensusFragment): void {
  const keys: (keyof SourceCensusFragment)[] = [
    "species",
    "pokemon",
    "forms",
    "learnsets",
    "evolutions",
    "names",
    "flavorTexts",
    "types",
    "typeHistory",
    "stats",
    "statHistory",
    "abilities",
    "abilityHistory",
    "sprites",
    "formNames",
    "generations",
    "versionGroups",
    "versions",
    "referenceTypes",
    "referenceStats",
    "referenceAbilities",
    "moves",
    "learnMethods",
    "items",
    "evolutionTriggers",
    "abilityFlavorTexts",
    "abilityEffects",
    "abilityEffectChanges",
    "abilityEffectChangeTexts",
    "moveFlavorTexts",
    "moveEffects",
    "moveEffectTexts",
    "itemFlavorTexts",
    "itemEffects",
    "typeNames",
    "statNames",
    "abilityNames",
    "moveNames",
    "learnMethodNames",
    "itemNames",
    "evolutionTriggerNames",
    "versionNames",
  ];
  for (const key of keys) {
    const count = sourceCount(data[key]);
    const maximum = data[key]?.aggregate?.max?.id;
    if (
      (count > 0 &&
        (!Number.isSafeInteger(maximum) ||
          maximum === null ||
          maximum === undefined ||
          maximum < 1)) ||
      (count === 0 && maximum !== null)
    )
      throw new Error(`Invalid census maximum: ${key}`);
  }
  if (sourceCount(data.species) === 0 || sourceCount(data.pokemon) === 0)
    throw new Error("Empty upstream species census");
}

function names(rows: { languageId: number | null; name: string | null }[]): Name[] {
  return rows
    .filter((row) => row.name !== null)
    .map((row) => ({
      languageId: required(row.languageId, "name.languageId"),
      name: required(row.name, "name.name"),
    }));
}

function namedResource(row: {
  id: number;
  identifier: string;
  names: { languageId: number | null; name: string | null }[];
}): NamedResource {
  return { id: row.id, identifier: row.identifier, names: names(row.names) };
}

export function mapReferences(
  raw: ReferencesQuery,
  census: ReferenceData["census"],
): ReferenceData {
  const versionGroups = raw.versionGroups.map((row) => ({
    id: row.id,
    identifier: row.identifier,
    generationId: required(row.generationId, "group.generationId"),
    order: required(row.order, "group.order"),
  }));
  const versions = raw.versionGroups.flatMap((group) =>
    group.versions.map((row) => {
      if (row.versionGroupId !== group.id)
        throw new Error(`Version ${row.id} has inconsistent group relationship`);
      return {
        id: row.id,
        identifier: row.identifier,
        versionGroupId: group.id,
        names: names(row.names),
      };
    }),
  );
  const abilities: Ability[] = raw.abilities.map((row) => ({
    ...namedResource(row),
    generationId: required(row.generationId, "ability.generationId"),
    flavorTexts: row.flavorTexts
      .filter((text) => text.text !== null)
      .map((text) => ({
        languageId: required(text.languageId, "ability.flavor.languageId"),
        versionGroupId: required(text.versionGroupId, "ability.flavor.versionGroupId"),
        text: gameText(required(text.text, "ability.flavor.text")),
      })),
    effects: row.effects
      .filter((text) => text.effect !== null || text.shortEffect !== null)
      .map((text) => ({
        languageId: required(text.languageId, "ability.effect.languageId"),
        effect: text.effect ?? "",
        shortEffect: text.shortEffect ?? "",
      })),
    effectChanges: row.effectChanges.map((change) => ({
      versionGroupId: required(change.versionGroupId, "ability.effectChange.versionGroupId"),
      effects: change.effects.map((text) => ({
        languageId: required(text.languageId, "ability.effectChange.languageId"),
        effect: text.effect,
      })),
    })),
  }));
  // Effects are shared by moves upstream; fetch each effect once and retain
  // genuine missing text as an empty collection rather than inventing prose.
  const moveEffects = new Map<number, Move["effects"]>();
  for (const row of raw.moveEffects) {
    if (moveEffects.has(row.id)) throw new Error(`Duplicate source move effect id ${row.id}`);
    const translations = new Map<number, Move["effects"][number]>();
    for (const text of row.effects) {
      const languageId = required(text.languageId, "move.effect.languageId");
      const previous = translations.get(languageId);
      // The source can contain repeated, identical translations. Raw row counts
      // are still checked independently; normalize only lossless duplicates.
      if (previous) {
        if (previous.effect !== text.effect || previous.shortEffect !== text.shortEffect)
          throw new Error(`Conflicting source move effect translation: ${row.id}/${languageId}`);
      } else {
        translations.set(languageId, {
          languageId,
          effect: text.effect,
          shortEffect: text.shortEffect,
        });
      }
    }
    moveEffects.set(row.id, [...translations.values()]);
  }
  const moves: Move[] = raw.moves.map((row) => ({
    ...namedResource(row),
    generationId: required(row.generationId, "move.generationId"),
    typeId: required(row.typeId, "move.typeId"),
    damageClassId: required(row.damageClassId, "move.damageClassId"),
    power: row.power,
    accuracy: row.accuracy,
    pp: row.pp,
    priority: required(row.priority, "move.priority"),
    effectChance: row.effectChance,
    flavorTexts: row.flavorTexts.map((text) => ({
      languageId: required(text.languageId, "move.flavor.languageId"),
      versionGroupId: required(text.versionGroupId, "move.flavor.versionGroupId"),
      text: gameText(text.text),
    })),
    effects:
      row.effectId === null
        ? []
        : required(moveEffects.get(row.effectId), `move.effectId ${row.effectId}`),
  }));
  const items: Item[] = raw.items.map((row) => ({
    ...namedResource(row),
    flavorTexts: row.flavorTexts.map((text) => ({
      languageId: required(text.languageId, "item.flavor.languageId"),
      versionGroupId: required(text.versionGroupId, "item.flavor.versionGroupId"),
      text: gameText(text.text),
    })),
    effects: row.effects.map((text) => ({
      languageId: required(text.languageId, "item.effect.languageId"),
      effect: text.effect,
      shortEffect: text.shortEffect,
    })),
  }));
  return {
    generations: raw.generations.map((row) => ({ id: row.id, identifier: row.identifier })),
    versionGroups,
    versions,
    types: raw.types.map(namedResource),
    stats: raw.stats.map(namedResource),
    abilities,
    moves,
    learnMethods: raw.learnMethods.map(namedResource),
    items,
    evolutionTriggers: raw.evolutionTriggers.map(namedResource),
    coverage: raw.versionGroups.map((group) => ({
      versionGroupId: group.id,
      learnsetRows: sourceCount(group.learnsetsCount),
      speciesFlavorTextRows: group.versions.reduce(
        (sum, version) => sum + sourceCount(version.flavorTextsCount),
        0,
      ),
    })),
    sourceCounts: {
      generations: sourceCount(raw.generationsCount),
      versionGroups: sourceCount(raw.versionGroupsCount),
      versions: sourceCount(raw.versionsCount),
      types: sourceCount(raw.typesCount),
      stats: sourceCount(raw.statsCount),
      abilities: sourceCount(raw.abilitiesCount),
      moves: sourceCount(raw.movesCount),
      learnMethods: sourceCount(raw.learnMethodsCount),
      items: sourceCount(raw.itemsCount),
      evolutionTriggers: sourceCount(raw.evolutionTriggersCount),
    },
    census,
  };
}

type RawSpecies = SpeciesPageQuery["species"][number];
type RawVariety = RawSpecies["varieties"][number];
function mapVariety(raw: RawVariety, speciesId: number): PokemonVariety {
  if (raw.speciesId !== speciesId)
    throw new Error(`Pokemon ${raw.id} has inconsistent species relationship`);
  const grouped = new Map<number, TypeSlot[]>();
  for (const row of raw.typeHistory) {
    const generationId = required(row.generationId, "typeHistory.generationId");
    const rows = grouped.get(generationId) ?? [];
    rows.push({
      slot: required(row.slot, "typeHistory.slot"),
      typeId: required(row.typeId, "typeHistory.typeId"),
    });
    grouped.set(generationId, rows);
  }
  if (raw.sprites.length > 1) throw new Error(`Pokemon ${raw.id} has ambiguous sprite records`);
  const sprites: unknown = raw.sprites[0]?.sprites ?? null;
  let artwork: string | null = null;
  if (
    sprites !== null &&
    typeof sprites === "object" &&
    "other" in sprites &&
    sprites.other !== null &&
    typeof sprites.other === "object" &&
    "official-artwork" in sprites.other
  ) {
    const official = sprites.other["official-artwork"];
    if (
      official !== null &&
      typeof official === "object" &&
      "front_default" in official &&
      typeof official.front_default === "string"
    )
      artwork = official.front_default;
  }
  return {
    id: raw.id,
    identifier: raw.identifier,
    isDefault: raw.isDefault,
    height: required(raw.height, "pokemon.height"),
    weight: required(raw.weight, "pokemon.weight"),
    baseExperience: raw.baseExperience ?? null,
    order: required(raw.order, "pokemon.order"),
    types: raw.types.map((row) => ({
      slot: required(row.slot, "type.slot"),
      typeId: required(row.typeId, "type.typeId"),
    })),
    typeHistory: [...grouped].map(([generationId, types]) => ({ generationId, types })),
    stats: raw.stats.map((row) => ({
      statId: required(row.statId, "stat.statId"),
      baseStat: required(row.baseStat, "stat.baseStat"),
      effort: required(row.effort, "stat.effort"),
    })),
    statHistory: raw.statHistory.map((row) => ({
      generationId: required(row.generationId, "statHistory.generationId"),
      statId: required(row.statId, "statHistory.statId"),
      baseStat: required(row.baseStat, "statHistory.baseStat"),
      effort: required(row.effort, "statHistory.effort"),
    })),
    abilities: raw.abilities.map((row) => ({
      slot: required(row.slot, "ability.slot"),
      abilityId: row.abilityId ?? null,
      isHidden: row.isHidden,
    })),
    abilityHistory: raw.abilityHistory.map((row) => ({
      generationId: required(row.generationId, "abilityHistory.generationId"),
      slot: required(row.slot, "abilityHistory.slot"),
      abilityId: row.abilityId ?? null,
      isHidden: row.isHidden,
    })),
    forms: raw.forms.map((form) => {
      if (form.pokemonId !== raw.id)
        throw new Error(`Form ${form.id} has inconsistent Pokemon relationship`);
      return {
        id: form.id,
        identifier: form.identifier,
        formIdentifier: form.formIdentifier,
        names: form.names
          .filter((row) => row.pokemonName !== null)
          .map((row) => ({
            languageId: required(row.languageId, "form.languageId"),
            name: required(row.pokemonName, "form.pokemonName"),
          })),
        formNames: names(form.names),
        versionGroupId: form.versionGroupId ?? null,
        isDefault: form.isDefault,
        isBattleOnly: form.isBattleOnly,
        isMega: form.isMega,
        order: required(form.order, "form.order"),
        formOrder: required(form.formOrder, "form.formOrder"),
      };
    }),
    learnsets: raw.learnsets.map((row) => ({
      moveId: required(row.moveId, "learnset.moveId"),
      versionGroupId: required(row.versionGroupId, "learnset.versionGroupId"),
      learnMethodId: required(row.learnMethodId, "learnset.learnMethodId"),
      level: required(row.level, "learnset.level"),
      mastery: row.mastery ?? null,
      order: row.order ?? null,
    })),
    media: { sprites, artwork },
    sourceCounts: {
      types: sourceCount(raw.typesCount),
      typeHistory: grouped.size,
      stats: sourceCount(raw.statsCount),
      statHistory: sourceCount(raw.statHistoryCount),
      abilities: sourceCount(raw.abilitiesCount),
      abilityHistory: sourceCount(raw.abilityHistoryCount),
      forms: sourceCount(raw.formsCount),
      learnsets: sourceCount(raw.learnsetsCount),
    },
  };
}

export function mapSpecies(raw: RawSpecies): SpeciesRecord {
  return {
    id: raw.id,
    identifier: raw.identifier,
    generationId: required(raw.generationId, "species.generationId"),
    evolvesFromSpeciesId: raw.evolvesFromSpeciesId ?? null,
    evolutionChainId: raw.evolutionChainId ?? null,
    names: names(raw.names),
    genera: raw.names
      .filter((row) => row.genus !== null)
      .map((row) => ({
        languageId: required(row.languageId, "species.genus.languageId"),
        name: required(row.genus, "species.genus"),
      })),
    flavorTexts: raw.flavorTexts.map((row) => ({
      languageId: required(row.languageId, "flavor.languageId"),
      versionId: required(row.versionId, "flavor.versionId"),
      text: gameText(required(row.text, "flavor.text")),
    })),
    genderRate: required(raw.genderRate, "species.genderRate"),
    captureRate: required(raw.captureRate, "species.captureRate"),
    baseHappiness: raw.baseHappiness ?? null,
    isBaby: raw.isBaby,
    isLegendary: raw.isLegendary,
    isMythical: raw.isMythical,
    sourceFacts: {
      hatch_counter: raw.hatch_counter,
      growth_rate_id: raw.growth_rate_id,
      pokemon_color_id: raw.pokemon_color_id,
      pokemon_shape_id: raw.pokemon_shape_id,
      pokemon_habitat_id: raw.pokemon_habitat_id,
      order: raw.order,
      forms_switchable: raw.forms_switchable,
      has_gender_differences: raw.has_gender_differences,
    },
    varieties: raw.varieties.map((row) => mapVariety(row, raw.id)),
    evolutions: raw.evolutions.map((row) => {
      const { id, evolvedSpeciesId, versionGroupId, isDefault, triggerId, ...conditions } = row;
      return {
        id,
        evolvedSpeciesId: required(evolvedSpeciesId, "evolution.evolvedSpeciesId"),
        versionGroupId: versionGroupId ?? null,
        isDefault,
        triggerId: required(triggerId, "evolution.triggerId"),
        conditions,
      };
    }),
    sourceCounts: {
      names: raw.names.filter((row) => row.name !== null).length,
      genera: raw.names.filter((row) => row.genus !== null).length,
      flavorTexts: sourceCount(raw.flavorTextsCount),
      varieties: sourceCount(raw.varietiesCount),
      evolutions: sourceCount(raw.evolutionsCount),
    },
  };
}
