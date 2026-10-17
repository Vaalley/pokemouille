import type { SnapshotInput } from "./types.ts";

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}
function object(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    fail(path, "expected an object");
  return value as Record<string, unknown>;
}
function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, "expected an array");
  return value;
}
function integer(value: unknown, path: string, minimum = 0): void {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum)
    fail(path, `expected an integer >= ${minimum}`);
}
function text(value: unknown, path: string, empty = false): void {
  if (typeof value !== "string" || (!empty && !value.trim()))
    fail(path, "expected a string" + (empty ? "" : " containing text"));
}
function flag(value: unknown, path: string): void {
  if (typeof value !== "boolean") fail(path, "expected a boolean");
}
function nullableInteger(value: unknown, path: string, minimum = 1): void {
  if (value !== null) integer(value, path, minimum);
}
function names(value: unknown, path: string): void {
  const seen = new Set<unknown>();
  for (const [index, entry] of array(value, path).entries()) {
    const row = object(entry, `${path}[${index}]`);
    integer(row.languageId, `${path}.languageId`, 1);
    text(row.name, `${path}.name`, true);
    if (seen.has(row.languageId)) fail(path, "duplicate language identity");
    seen.add(row.languageId);
  }
}
function resource(value: unknown, path: string): Record<string, unknown> {
  const row = object(value, path);
  integer(row.id, `${path}.id`, 1);
  text(row.identifier, `${path}.identifier`);
  names(row.names, `${path}.names`);
  return row;
}
function counted(row: Record<string, unknown>, keys: readonly string[], path: string): void {
  const counts = object(row.sourceCounts, `${path}.sourceCounts`);
  for (const key of keys) {
    integer(counts[key], `${path}.sourceCounts.${key}`);
    if (counts[key] !== array(row[key], `${path}.${key}`).length)
      fail(
        path,
        `truncated or inconsistent ${key}: expected ${String(counts[key])}, got ${array(row[key], key).length}`,
      );
  }
}
function typeSlots(value: unknown, path: string): void {
  const seen = new Set<unknown>();
  const seenTypes = new Set<unknown>();
  for (const entry of array(value, path)) {
    const row = object(entry, path);
    integer(row.slot, `${path}.slot`, 1);
    integer(row.typeId, `${path}.typeId`, 1);
    if (seen.has(row.slot) || seenTypes.has(row.typeId))
      fail(path, "duplicate type slot or type identity");
    seen.add(row.slot);
    seenTypes.add(row.typeId);
  }
}
function stat(value: unknown, path: string): Record<string, unknown> {
  const row = object(value, path);
  integer(row.statId, `${path}.statId`, 1);
  integer(row.baseStat, `${path}.baseStat`);
  integer(row.effort, `${path}.effort`);
  return row;
}
function abilitySlot(value: unknown, path: string): Record<string, unknown> {
  const row = object(value, path);
  integer(row.slot, `${path}.slot`, 1);
  nullableInteger(row.abilityId, `${path}.abilityId`);
  flag(row.isHidden, `${path}.isHidden`);
  return row;
}
function variety(value: unknown, path: string): void {
  const row = object(value, path);
  integer(row.id, `${path}.id`, 1);
  text(row.identifier, `${path}.identifier`);
  flag(row.isDefault, `${path}.isDefault`);
  for (const key of ["height", "weight"]) integer(row[key], `${path}.${key}`);
  integer(row.order, `${path}.order`, -1);
  nullableInteger(row.baseExperience, `${path}.baseExperience`, 0);
  counted(
    row,
    [
      "types",
      "typeHistory",
      "stats",
      "statHistory",
      "abilities",
      "abilityHistory",
      "forms",
      "learnsets",
    ],
    path,
  );
  typeSlots(row.types, `${path}.types`);
  for (const entry of array(row.typeHistory, `${path}.typeHistory`)) {
    const history = object(entry, `${path}.typeHistory`);
    integer(history.generationId, `${path}.typeHistory.generationId`, 1);
    typeSlots(history.types, `${path}.typeHistory.types`);
    if (!array(history.types, path).length) fail(path, "empty historical type set");
  }
  for (const entry of array(row.stats, `${path}.stats`)) stat(entry, `${path}.stats`);
  for (const entry of array(row.statHistory, `${path}.statHistory`))
    integer(stat(entry, `${path}.statHistory`).generationId, `${path}.statHistory.generationId`, 1);
  for (const entry of array(row.abilities, `${path}.abilities`))
    abilitySlot(entry, `${path}.abilities`);
  for (const entry of array(row.abilityHistory, `${path}.abilityHistory`))
    integer(
      abilitySlot(entry, `${path}.abilityHistory`).generationId,
      `${path}.abilityHistory.generationId`,
      1,
    );
  for (const entry of array(row.forms, `${path}.forms`)) {
    const form = resource(entry, `${path}.forms`);
    text(form.formIdentifier, `${path}.forms.formIdentifier`, true);
    names(form.formNames, `${path}.forms.formNames`);
    nullableInteger(form.versionGroupId, `${path}.forms.versionGroupId`);
    for (const key of ["isDefault", "isBattleOnly", "isMega"])
      flag(form[key], `${path}.forms.${key}`);
    for (const key of ["order", "formOrder"]) integer(form[key], `${path}.forms.${key}`, -1);
  }
  for (const entry of array(row.learnsets, `${path}.learnsets`)) {
    const move = object(entry, `${path}.learnsets`);
    for (const key of ["moveId", "versionGroupId", "learnMethodId"])
      integer(move[key], `${path}.learnsets.${key}`, 1);
    integer(move.level, `${path}.learnsets.level`);
    nullableInteger(move.order, `${path}.learnsets.order`, 0);
    nullableInteger(move.mastery, `${path}.learnsets.mastery`, 0);
  }
  const media = object(row.media, `${path}.media`);
  if (!Object.hasOwn(media, "sprites")) fail(path, "missing source sprite metadata");
  if (media.artwork !== null) text(media.artwork, `${path}.media.artwork`);
}
function scalarFacts(value: unknown, path: string): void {
  for (const [key, fact] of Object.entries(object(value, path))) {
    if (
      fact !== null &&
      typeof fact !== "string" &&
      typeof fact !== "boolean" &&
      (typeof fact !== "number" || !Number.isFinite(fact))
    )
      fail(`${path}.${key}`, "expected a finite scalar source fact");
  }
}
function species(value: unknown, path: string): void {
  const row = resource(value, path);
  integer(row.generationId, `${path}.generationId`, 1);
  nullableInteger(row.evolvesFromSpeciesId, `${path}.evolvesFromSpeciesId`);
  nullableInteger(row.evolutionChainId, `${path}.evolutionChainId`);
  integer(row.genderRate, `${path}.genderRate`, -1);
  integer(row.captureRate, `${path}.captureRate`);
  nullableInteger(row.baseHappiness, `${path}.baseHappiness`, 0);
  for (const key of ["isBaby", "isLegendary", "isMythical"]) flag(row[key], `${path}.${key}`);
  scalarFacts(row.sourceFacts, `${path}.sourceFacts`);
  names(row.genera, `${path}.genera`);
  counted(row, ["names", "genera", "flavorTexts", "varieties", "evolutions"], path);
  for (const entry of array(row.flavorTexts, `${path}.flavorTexts`)) {
    const flavor = object(entry, `${path}.flavorTexts`);
    integer(flavor.languageId, `${path}.flavorTexts.languageId`, 1);
    integer(flavor.versionId, `${path}.flavorTexts.versionId`, 1);
    text(flavor.text, `${path}.flavorTexts.text`, true);
  }
  for (const entry of array(row.varieties, `${path}.varieties`))
    variety(entry, `${path}.varieties`);
  for (const entry of array(row.evolutions, `${path}.evolutions`)) {
    const method = object(entry, `${path}.evolutions`);
    for (const key of ["id", "evolvedSpeciesId", "triggerId"])
      integer(method[key], `${path}.evolutions.${key}`, 1);
    nullableInteger(method.versionGroupId, `${path}.evolutions.versionGroupId`);
    flag(method.isDefault, `${path}.evolutions.isDefault`);
    scalarFacts(method.conditions, `${path}.evolutions.conditions`);
  }
}

const REFERENCE_COLLECTIONS = [
  "generations",
  "versionGroups",
  "versions",
  "types",
  "stats",
  "abilities",
  "moves",
  "learnMethods",
  "items",
  "evolutionTriggers",
] as const;

function validateShape(input: unknown): asserts input is SnapshotInput {
  const root = object(input, "snapshot");
  const refs = object(root.references, "references");
  counted(refs, REFERENCE_COLLECTIONS, "references");
  for (const entry of array(refs.generations, "references.generations")) {
    const row = object(entry, "generation");
    integer(row.id, "generation.id", 1);
    text(row.identifier, "generation.identifier");
  }
  for (const entry of array(refs.versionGroups, "references.versionGroups")) {
    const row = object(entry, "versionGroup");
    integer(row.id, "versionGroup.id", 1);
    text(row.identifier, "versionGroup.identifier");
    integer(row.generationId, "versionGroup.generationId", 1);
    integer(row.order, "versionGroup.order");
  }
  for (const entry of array(refs.versions, "references.versions")) {
    const row = resource(entry, "version");
    integer(row.versionGroupId, "version.versionGroupId", 1);
  }
  for (const key of ["types", "stats", "learnMethods", "evolutionTriggers"])
    for (const row of array(refs[key], `references.${key}`)) resource(row, `references.${key}`);
  for (const entry of array(refs.abilities, "references.abilities")) {
    const row = resource(entry, "ability");
    integer(row.generationId, "ability.generationId", 1);
    for (const entry of array(row.flavorTexts, "ability.flavorTexts")) {
      const flavor = object(entry, "ability.flavorText");
      integer(flavor.languageId, "ability.flavorText.languageId", 1);
      integer(flavor.versionGroupId, "ability.flavorText.versionGroupId", 1);
      text(flavor.text, "ability.flavorText.text", true);
    }
    for (const entry of array(row.effects, "ability.effects")) {
      const effect = object(entry, "ability.effect");
      integer(effect.languageId, "ability.effect.languageId", 1);
      text(effect.effect, "ability.effect.effect", true);
      text(effect.shortEffect, "ability.effect.shortEffect", true);
    }
    for (const entry of array(row.effectChanges, "ability.effectChanges")) {
      const change = object(entry, "ability.effectChange");
      integer(change.versionGroupId, "ability.effectChange.versionGroupId", 1);
      for (const entry of array(change.effects, "ability.effectChange.effects")) {
        const effect = object(entry, "ability.effectChange.effect");
        integer(effect.languageId, "ability.effectChange.effect.languageId", 1);
        text(effect.effect, "ability.effectChange.effect.effect", true);
      }
    }
  }
  for (const entry of array(refs.items, "references.items")) {
    const row = resource(entry, "item");
    for (const entry of array(row.flavorTexts, "item.flavorTexts")) {
      const flavor = object(entry, "item.flavorText");
      integer(flavor.languageId, "item.flavorText.languageId", 1);
      integer(flavor.versionGroupId, "item.flavorText.versionGroupId", 1);
      text(flavor.text, "item.flavorText.text", true);
    }
    for (const entry of array(row.effects, "item.effects")) {
      const effect = object(entry, "item.effect");
      integer(effect.languageId, "item.effect.languageId", 1);
      text(effect.effect, "item.effect.effect", true);
      text(effect.shortEffect, "item.effect.shortEffect", true);
    }
  }
  for (const entry of array(refs.moves, "references.moves")) {
    const row = resource(entry, "move");
    for (const key of ["generationId", "typeId", "damageClassId"])
      integer(row[key], `move.${key}`, 1);
    for (const key of ["power", "accuracy", "pp", "effectChance"])
      nullableInteger(row[key], `move.${key}`, 0);
    integer(row.priority, "move.priority", -7);
    for (const entry of array(row.flavorTexts, "move.flavorTexts")) {
      const flavor = object(entry, "move.flavorText");
      integer(flavor.languageId, "move.flavorText.languageId", 1);
      integer(flavor.versionGroupId, "move.flavorText.versionGroupId", 1);
      text(flavor.text, "move.flavorText.text", true);
    }
    for (const entry of array(row.effects, "move.effects")) {
      const effect = object(entry, "move.effect");
      integer(effect.languageId, "move.effect.languageId", 1);
      text(effect.effect, "move.effect.effect", true);
      text(effect.shortEffect, "move.effect.shortEffect", true);
    }
  }
  for (const entry of array(refs.coverage, "references.coverage")) {
    const coverage = object(entry, "coverage");
    integer(coverage.versionGroupId, "coverage.versionGroupId", 1);
    integer(coverage.learnsetRows, "coverage.learnsetRows");
    integer(coverage.speciesFlavorTextRows, "coverage.speciesFlavorTextRows");
  }
  const census = object(refs.census, "references.census");
  for (const key of ["species", "pokemon", "forms", "learnsets", "evolutions"])
    integer(census[key], `census.${key}`);
  for (const row of array(root.species, "species")) species(row, "species");
}

function unique<T>(rows: readonly T[], key: (row: T) => string | number, path: string): void {
  const seen = new Set<string | number>();
  for (const row of rows) {
    const identity = key(row);
    if (seen.has(identity)) fail(path, `duplicate identity ${identity}`);
    seen.add(identity);
  }
}
function identities(
  rows: readonly { id: number; identifier: string }[],
  path: string,
): Set<number> {
  unique(rows, (row) => row.id, path);
  return new Set(rows.map((row) => row.id));
}
function relationship(ids: Set<number>, id: number | null, path: string): void {
  if (id !== null && !ids.has(id)) fail(path, `unknown referenced ID ${id}`);
}

/** Validate complete extraction counts and relationships, without requiring
 * nonempty translations/history or inventing facts missing from the source.
 * Counts must originate in independent upstream aggregates, not array lengths.
 */
export function validateSnapshot(input: unknown): asserts input is SnapshotInput {
  validateShape(input);
  const refs = input.references;
  const generations = identities(refs.generations, "generations");
  const groups = identities(refs.versionGroups, "versionGroups");
  const versions = identities(refs.versions, "versions");
  const types = identities(refs.types, "types");
  const stats = identities(refs.stats, "stats");
  const abilities = identities(refs.abilities, "abilities");
  const moves = identities(refs.moves, "moves");
  const methods = identities(refs.learnMethods, "learnMethods");
  const items = identities(refs.items, "items");
  const triggers = identities(refs.evolutionTriggers, "evolutionTriggers");
  const speciesIds = identities(input.species, "species");
  const varieties = input.species.flatMap((record) => record.varieties);
  const pokemon = identities(varieties, "pokemon");
  const allForms = varieties.flatMap((row) => row.forms);
  const forms = identities(allForms, "forms");
  const evolutionRows = input.species.flatMap((row) => row.evolutions);
  unique(evolutionRows, (row) => row.id, "evolutions");
  unique(refs.versionGroups, (row) => row.order, "versionGroup.order");
  unique(refs.versionGroups, (row) => row.identifier, "versionGroup.identifier");
  unique(refs.versions, (row) => row.identifier, "version.identifier");
  for (const group of refs.versionGroups)
    relationship(generations, group.generationId, "versionGroup.generationId");
  for (const version of refs.versions)
    relationship(groups, version.versionGroupId, "version.versionGroupId");
  for (const ability of refs.abilities) {
    relationship(generations, ability.generationId, "ability.generationId");
    unique(
      ability.flavorTexts,
      (row) => `${row.languageId}/${row.versionGroupId}`,
      "ability.flavorTexts",
    );
    unique(ability.effects, (row) => row.languageId, "ability.effects");
    for (const row of ability.flavorTexts)
      relationship(groups, row.versionGroupId, "ability.flavorText.versionGroupId");
    unique(ability.effectChanges, (row) => row.versionGroupId, "ability.effectChanges");
    for (const change of ability.effectChanges) {
      relationship(groups, change.versionGroupId, "ability.effectChange.versionGroupId");
      unique(change.effects, (row) => row.languageId, "ability.effectChange.effects");
    }
  }
  for (const move of refs.moves) {
    relationship(generations, move.generationId, "move.generationId");
    relationship(types, move.typeId, "move.typeId");
    unique(
      move.flavorTexts,
      (row) => `${row.languageId}/${row.versionGroupId}`,
      "move.flavorTexts",
    );
    unique(move.effects, (row) => row.languageId, "move.effects");
    for (const row of move.flavorTexts)
      relationship(groups, row.versionGroupId, "move.flavorText.versionGroupId");
  }
  for (const item of refs.items) {
    unique(
      item.flavorTexts,
      (row) => `${row.languageId}/${row.versionGroupId}`,
      "item.flavorTexts",
    );
    unique(item.effects, (row) => row.languageId, "item.effects");
    for (const row of item.flavorTexts)
      relationship(groups, row.versionGroupId, "item.flavorText.versionGroupId");
  }
  const versionGroups = new Map(refs.versions.map((row) => [row.id, row.versionGroupId]));
  const learnsetCounts = new Map<number, number>();
  const flavorCounts = new Map<number, number>();
  for (const record of input.species) {
    relationship(generations, record.generationId, "species.generationId");
    relationship(speciesIds, record.evolvesFromSpeciesId, "species.evolvesFromSpeciesId");
    if (record.evolvesFromSpeciesId === record.id) fail("species", "self evolution relationship");
    if (record.varieties.filter((row) => row.isDefault).length !== 1)
      fail("species.varieties", "expected exactly one default Pokémon variety");
    unique(record.varieties, (row) => row.identifier, "pokemon.identifier");
    unique(
      record.varieties.flatMap((row) => row.forms),
      (row) => row.identifier,
      "form.identifier",
    );
    unique(
      record.flavorTexts,
      (row) => `${row.versionId}/${row.languageId}`,
      "species.flavorTexts",
    );
    for (const row of record.flavorTexts) {
      relationship(versions, row.versionId, "species.flavorText.versionId");
      const groupId = versionGroups.get(row.versionId)!;
      flavorCounts.set(groupId, (flavorCounts.get(groupId) ?? 0) + 1);
    }
    for (const row of record.varieties) {
      unique(row.stats, (stat) => stat.statId, "pokemon.stats");
      unique(
        row.statHistory,
        (stat) => `${stat.generationId}/${stat.statId}`,
        "pokemon.statHistory",
      );
      unique(row.abilities, (ability) => ability.slot, "pokemon.abilities");
      unique(
        row.abilityHistory,
        (ability) => `${ability.generationId}/${ability.slot}`,
        "pokemon.abilityHistory",
      );
      unique(row.typeHistory, (history) => history.generationId, "pokemon.typeHistory");
      unique(
        row.learnsets,
        (move) => `${move.moveId}/${move.versionGroupId}/${move.learnMethodId}/${move.level}`,
        "pokemon.learnsets",
      );
      if (row.forms.filter((form) => form.isDefault).length > 1)
        fail("pokemon.forms", "ambiguous default forms");
      for (const form of row.forms)
        relationship(groups, form.versionGroupId, "form.versionGroupId");
      for (const type of row.types) relationship(types, type.typeId, "pokemon.typeId");
      for (const history of row.typeHistory) {
        relationship(generations, history.generationId, "typeHistory.generationId");
        for (const type of history.types) relationship(types, type.typeId, "typeHistory.typeId");
      }
      for (const stat of row.stats) relationship(stats, stat.statId, "pokemon.statId");
      for (const history of row.statHistory) {
        relationship(generations, history.generationId, "statHistory.generationId");
        relationship(stats, history.statId, "statHistory.statId");
      }
      for (const ability of row.abilities)
        relationship(abilities, ability.abilityId, "pokemon.abilityId");
      for (const history of row.abilityHistory) {
        relationship(generations, history.generationId, "abilityHistory.generationId");
        relationship(abilities, history.abilityId, "abilityHistory.abilityId");
      }
      for (const move of row.learnsets) {
        relationship(moves, move.moveId, "learnset.moveId");
        relationship(groups, move.versionGroupId, "learnset.versionGroupId");
        relationship(methods, move.learnMethodId, "learnset.learnMethodId");
        learnsetCounts.set(move.versionGroupId, (learnsetCounts.get(move.versionGroupId) ?? 0) + 1);
      }
    }
  }
  const conditionReferences: Record<string, Set<number>> = {
    evolution_item_id: items,
    item_id: items,
    trigger_item_id: items,
    held_item_id: items,
    used_move_id: moves,
    known_move_id: moves,
    known_move_type_id: types,
    party_type_id: types,
    party_species_id: speciesIds,
    trade_species_id: speciesIds,
    required_form_id: forms,
    evolved_form_id: forms,
    required_pokemon_form_id: forms,
    evolved_pokemon_form_id: forms,
  };
  for (const evolution of evolutionRows) {
    relationship(speciesIds, evolution.evolvedSpeciesId, "evolution.evolvedSpeciesId");
    relationship(groups, evolution.versionGroupId, "evolution.versionGroupId");
    relationship(triggers, evolution.triggerId, "evolution.triggerId");
    for (const [key, value] of Object.entries(evolution.conditions)) {
      if (Object.hasOwn(conditionReferences, key) && value !== null) {
        integer(value, `evolution.conditions.${key}`, 1);
        relationship(conditionReferences[key]!, value as number, `evolution.conditions.${key}`);
      }
    }
  }
  // Detect cycles as well as dangling evolution parents, without traversing every
  // chain again from every species in the full snapshot.
  const parentBySpecies = new Map(
    input.species.map((record) => [record.id, record.evolvesFromSpeciesId]),
  );
  const completed = new Set<number>();
  for (const record of input.species) {
    const active = new Set<number>();
    let id: number | null = record.id;
    while (id !== null && !completed.has(id)) {
      if (active.has(id)) fail("species.evolution", "cycle in species ancestry");
      active.add(id);
      id = parentBySpecies.get(id) ?? null;
    }
    for (const visited of active) completed.add(visited);
  }
  unique(refs.coverage, (row) => row.versionGroupId, "coverage");
  if (refs.coverage.length !== refs.versionGroups.length)
    fail("coverage", "expected one coverage record for every source version group");
  for (const coverage of refs.coverage) {
    relationship(groups, coverage.versionGroupId, "coverage.versionGroupId");
    if (coverage.learnsetRows !== (learnsetCounts.get(coverage.versionGroupId) ?? 0))
      fail("coverage", "learnset row count disagrees with exported data");
    if (coverage.speciesFlavorTextRows !== (flavorCounts.get(coverage.versionGroupId) ?? 0))
      fail("coverage", "species text row count disagrees with exported data");
  }
  const actual = {
    species: input.species.length,
    pokemon: pokemon.size,
    forms: forms.size,
    learnsets: varieties.reduce((sum, row) => sum + row.learnsets.length, 0),
    evolutions: evolutionRows.length,
  };
  for (const key of ["species", "pokemon", "forms", "learnsets", "evolutions"] as const)
    if (refs.census[key] !== actual[key])
      fail(
        `census.${key}`,
        `truncated or inconsistent export: expected ${refs.census[key]}, got ${actual[key]}`,
      );
}
