import { getMainSeriesGames } from "./games.ts";
import { assertLanguage, localize } from "./localization.ts";
import type {
  Ability,
  AbilitySlot,
  Field,
  GameOption,
  Language,
  LocalizedText,
  NamedResource,
  PokemonForm,
  PokemonVariety,
  ReferenceData,
  ResolvedPokemon,
  SpeciesRecord,
  VersionGroup,
} from "./types.ts";

function available<T>(value: T): Field<T> {
  return { status: "available", value };
}
function missing<T>(reason: string): Field<T> {
  return { status: "missing", reason };
}

function resourceIndex<T extends { id: number }>(rows: readonly T[]): Map<number, T> {
  return new Map(rows.map((row) => [row.id, row]));
}
interface ReferenceIndex {
  types: Map<number, NamedResource>;
  stats: Map<number, NamedResource>;
  abilities: Map<number, Ability>;
  moves: Map<number, NamedResource>;
  learnMethods: Map<number, NamedResource>;
  triggers: Map<number, NamedResource>;
  groups: Map<number, VersionGroup>;
  games: Map<string, GameOption>;
}
function makeReferenceIndex(refs: ReferenceData): ReferenceIndex {
  return {
    types: resourceIndex(refs.types),
    stats: resourceIndex(refs.stats),
    abilities: resourceIndex(refs.abilities),
    moves: resourceIndex(refs.moves),
    learnMethods: resourceIndex(refs.learnMethods),
    triggers: resourceIndex(refs.evolutionTriggers),
    groups: resourceIndex(refs.versionGroups),
    games: new Map(getMainSeriesGames(refs).map((game) => [game.version.identifier, game])),
  };
}
const referenceCache = new WeakMap<ReferenceData, ReferenceIndex>();
function referenceIndex(refs: ReferenceData) {
  let index = referenceCache.get(refs);
  if (!index) {
    index = makeReferenceIndex(refs);
    referenceCache.set(refs, index);
  }
  return index;
}
interface Selection {
  variety: PokemonVariety;
  form: PokemonForm | null;
}
interface RecordIndex {
  forms: Selection[];
  selections: Map<string, Selection>;
  primary: Selection | undefined;
  learnsets: Map<PokemonVariety, Map<number, PokemonVariety["learnsets"]>>;
}
function makeRecordIndex(record: SpeciesRecord): RecordIndex {
  const forms: Selection[] = [];
  const selections = new Map<string, Selection>();
  const learnsets = new Map<PokemonVariety, Map<number, PokemonVariety["learnsets"]>>();
  let primary: Selection | undefined;
  for (const variety of record.varieties) {
    const selection = {
      variety,
      form:
        variety.forms.find((form) => form.isDefault) ??
        (variety.forms.length === 1 ? variety.forms[0]! : null),
    };
    selections.set(variety.identifier, selection);
    if (variety.isDefault) primary = selection;
    for (const form of variety.forms) {
      const entry = { variety, form };
      selections.set(form.identifier, entry);
      forms.push(entry);
    }
    const byGroup = new Map<number, PokemonVariety["learnsets"]>();
    for (const row of variety.learnsets) {
      const rows = byGroup.get(row.versionGroupId);
      if (rows) rows.push(row);
      else byGroup.set(row.versionGroupId, [row]);
    }
    learnsets.set(variety, byGroup);
  }
  return { forms, selections, primary, learnsets };
}
const recordCache = new WeakMap<SpeciesRecord, RecordIndex>();
function recordIndex(record: SpeciesRecord) {
  let index = recordCache.get(record);
  if (!index) {
    index = makeRecordIndex(record);
    recordCache.set(record, index);
  }
  return index;
}

export function pokemonName(
  record: SpeciesRecord,
  variety: PokemonVariety,
  form: PokemonForm | null,
  language: Language,
): LocalizedText {
  const speciesName = localize(record.names, language, record.identifier);
  // Form names are sparse per language (Rotom's default form is named only in French);
  // a missing row in the requested chain must not surface the raw identifier.
  const formName = form ? localize(form.names, language, form.identifier) : null;
  if (formName && formName.sourceLanguageId !== null) return formName;
  if (variety.isDefault && (!form || form.isDefault)) return speciesName;
  const label = localize(
    form?.formNames ?? [],
    language,
    form?.formIdentifier || variety.identifier,
  );
  return {
    ...label,
    text: `${speciesName.text} (${label.text})`,
    fallback: label.fallback || speciesName.fallback,
  };
}

// Sparse histories are independent per stat / ability slot. The earliest
// applicable inclusive upper bound wins; an explicit null is a real value.
function historicalByKey<T, H extends T & { generationId: number }>(
  current: readonly T[],
  history: readonly H[],
  generationId: number,
  key: (row: T) => number,
): T[] {
  const values = new Map(current.map((row) => [key(row), row]));
  const bounds = new Map<number, number>();
  for (const row of history) {
    const id = key(row);
    const bound = bounds.get(id);
    if (row.generationId >= generationId && (bound === undefined || row.generationId < bound)) {
      values.set(id, row);
      bounds.set(id, row.generationId);
    }
  }
  return [...values.values()];
}

function exactText(
  rows: { languageId: number; text: string }[],
  language: Language,
): Field<LocalizedText> {
  const text = localize(
    rows.map((row) => ({ languageId: row.languageId, name: row.text })),
    language,
    "",
  );
  return text.sourceLanguageId === null
    ? missing(
        "No text in the selected language or its fallback languages for this exact source context",
      )
    : available(text);
}
function named(resource: NamedResource | undefined, language: Language, id: number): LocalizedText {
  return localize(resource?.names ?? [], language, resource?.identifier ?? String(id));
}

/** Introduction of a species/form in a game, from source facts only. `formGroupOrder` is the
 * order of the form's introducing version group; null/undefined when the source does not
 * establish it. "available" means introduced, never proof of obtainability. Shared by detail
 * resolution and search badges so both always agree.
 */
export function introductionStatus(
  speciesGenerationId: number,
  formGroupOrder: number | null | undefined,
  game: { generationId: number; order: number },
): ResolvedPokemon["status"] {
  if (speciesGenerationId > game.generationId) return "not-introduced";
  if (formGroupOrder === null || formGroupOrder === undefined) return "unknown";
  return formGroupOrder > game.order ? "not-introduced" : "available";
}

/** Sparse type histories use the earliest inclusive generation upper bound. */
export function pokemonTypesAtGeneration(
  variety: Pick<PokemonVariety, "types" | "typeHistory">,
  generationId: number,
): PokemonVariety["types"] {
  let rows = variety.types;
  let bound = Infinity;
  for (const history of variety.typeHistory) {
    if (history.generationId >= generationId && history.generationId < bound) {
      bound = history.generationId;
      rows = history.types;
    }
  }
  return rows;
}

/** Resolve immutable normalized data. Unknown game/form/language inputs throw.
 * "available" means introduced, never proof of obtainability in that game.
 * Modern generation histories do not establish game-specific battle mechanics.
 */
export function resolvePokemon(
  record: SpeciesRecord,
  references: ReferenceData,
  context: { language: Language; version: string; form?: string },
): ResolvedPokemon {
  assertLanguage(context.language);
  const refs = referenceIndex(references);
  const game = refs.games.get(context.version);
  if (!game) throw new Error(`Unknown or non-selectable main-series version: ${context.version}`);
  const index = recordIndex(record);
  const selected = context.form === undefined ? index.primary : index.selections.get(context.form);
  if (!selected)
    throw new Error(
      context.form === undefined
        ? `Species ${record.id} has no default variety`
        : `Unknown form for species ${record.id}: ${context.form}`,
    );
  const { variety, form } = selected;
  const { language } = context;
  const generationId = game.group.generationId;
  const formStatus = (target: PokemonForm | null) =>
    introductionStatus(
      record.generationId,
      target?.versionGroupId == null ? null : refs.groups.get(target.versionGroupId)?.order,
      game.group,
    );
  const status = formStatus(form);
  const eligible = status === "available";
  const reason =
    status === "not-introduced"
      ? "Species or form was not introduced in the selected context"
      : "The source does not establish this form’s introduction";
  const blocked = <T>(): Field<T> => missing(reason);

  let types: ResolvedPokemon["types"] = blocked();
  let stats: ResolvedPokemon["stats"] = blocked();
  let abilities: ResolvedPokemon["abilities"] = blocked();
  let learnset: ResolvedPokemon["learnset"] = blocked();
  let flavorText: ResolvedPokemon["flavorText"] = blocked();
  if (eligible) {
    const typeRows = pokemonTypesAtGeneration(variety, generationId);
    types = typeRows.length
      ? available(
          typeRows
            .map((row) => ({
              id: row.typeId,
              slot: row.slot,
              name: named(refs.types.get(row.typeId), language, row.typeId),
            }))
            .sort((a, b) => a.slot - b.slot),
        )
      : missing("No type facts for this context");
    const statRows = historicalByKey(
      variety.stats,
      variety.statHistory,
      generationId,
      (row) => row.statId,
    );
    const statIds = generationId === 1 ? [1, 2, 3, 6, 9] : [1, 2, 3, 4, 5, 6];
    const byStat = new Map(statRows.map((row) => [row.statId, row]));
    stats = statIds.every((id) => byStat.has(id))
      ? available(
          statIds.map((id) => {
            const row = byStat.get(id)!;
            return {
              id,
              value: row.baseStat,
              effort: row.effort,
              name: named(refs.stats.get(id), language, id),
            };
          }),
        )
      : missing("Source lacks one or more stats in the selected generation’s stat layout");
    if (generationId < 3)
      abilities = {
        status: "not-applicable",
        reason: "Abilities did not exist before Generation III",
      };
    else if (!variety.abilities.length && !variety.abilityHistory.length)
      abilities = missing("No ability facts for this Pokémon");
    else {
      const rows = historicalByKey<AbilitySlot, AbilitySlot & { generationId: number }>(
        variety.abilities,
        variety.abilityHistory,
        generationId,
        (row) => row.slot,
      );
      abilities = available(
        rows
          .filter((row) => row.abilityId !== null)
          .sort((a, b) => a.slot - b.slot)
          .map((row) => {
            const id = row.abilityId!;
            const ability = refs.abilities.get(id);
            return {
              id,
              slot: row.slot,
              isHidden: row.isHidden,
              name: named(ability, language, id),
              flavorText: exactText(
                ability?.flavorTexts.filter((text) => text.versionGroupId === game.group.id) ?? [],
                language,
              ),
              currentEffect: exactText(
                ability?.effects.map((text) => ({
                  languageId: text.languageId,
                  text: text.effect,
                })) ?? [],
                language,
              ),
              effectScope: "current-not-game-specific" as const,
            };
          }),
      );
    }
    const rows = index.learnsets.get(variety)?.get(game.group.id) ?? [];
    learnset = rows.length
      ? available(
          rows.map((row) => ({
            moveId: row.moveId,
            name: named(refs.moves.get(row.moveId), language, row.moveId),
            methodId: row.learnMethodId,
            method: named(refs.learnMethods.get(row.learnMethodId), language, row.learnMethodId),
            level: row.level,
            order: row.order,
            mastery: row.mastery,
          })),
        )
      : missing(
          "No learnset rows for this exact Pokémon and version group; this does not prove unavailability",
        );
    flavorText = exactText(
      record.flavorTexts.filter((text) => text.versionId === game.version.id),
      language,
    );
  }

  return {
    status,
    ...(eligible ? {} : { reason }),
    speciesId: record.id,
    pokemonId: variety.id,
    formId: form?.id ?? null,
    name: pokemonName(record, variety, form, language),
    speciesName: localize(record.names, language, record.identifier),
    context: {
      language,
      version: context.version,
      versionId: game.version.id,
      versionGroupId: game.group.id,
      generationId,
    },
    availability: {
      status: "unknown",
      reason:
        "Introduction and source-row existence do not establish obtainability in a particular game",
    },
    mechanics: { status: "generation-based", gameSpecificRules: "unverified" },
    types,
    stats,
    abilities,
    learnset,
    flavorText,
    genus: localize(record.genera, language, ""),
    physical: eligible
      ? available({
          scope: "current-not-game-specific" as const,
          height: variety.height,
          weight: variety.weight,
          baseExperience: variety.baseExperience,
        })
      : blocked(),
    speciesFacts: eligible
      ? available({
          scope: "current-not-game-specific" as const,
          genderRate: record.genderRate,
          captureRate: record.captureRate,
          baseHappiness: record.baseHappiness,
          isBaby: record.isBaby,
          isLegendary: record.isLegendary,
          isMythical: record.isMythical,
          sourceFacts: record.sourceFacts,
        })
      : blocked(),
    media: variety.media,
    forms: index.forms.map((entry) => ({
      id: entry.form!.id,
      pokemonId: entry.variety.id,
      identifier: entry.form!.identifier,
      name: pokemonName(record, entry.variety, entry.form, language),
      status: formStatus(entry.form),
      isBattleOnly: entry.form!.isBattleOnly,
      isMega: entry.form!.isMega,
    })),
    evolution: {
      applicability: "unresolved",
      methods: record.evolutions.map((method) => ({
        ...method,
        trigger: named(refs.triggers.get(method.triggerId), language, method.triggerId),
        introduction:
          method.versionGroupId === null ? null : (refs.groups.get(method.versionGroupId) ?? null),
      })),
    },
    coverage: {
      base: game.coverage,
      baseState: game.coverageState,
      expansions: game.expansions,
      learnsetContext: "exact-version-group",
      flavorTextContext: "exact-version",
    },
  };
}
