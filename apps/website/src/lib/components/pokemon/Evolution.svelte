<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import type {
    EvolutionChainProjection,
    EvolutionMethod,
    LocalizedText,
    ReferenceData,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { pokemonHref } from "#lib/data/context.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { messageKey, t, versionGroupName } from "#lib/i18n/pokemon.ts";
  import Localized from "./Localized.svelte";

  type ChainNode = EvolutionChainProjection["nodes"][number];

  let {
    lang,
    chain,
    hasChain,
    speciesId,
    version,
    generationId,
    game,
    references,
  }: {
    lang: Language;
    chain: EvolutionChainProjection | null;
    /** Whether the species record names an evolution chain at all. */
    hasChain: boolean;
    speciesId: number;
    version: string;
    /** Generation of the selected game. */
    generationId: number;
    game: string;
    references: ReferenceData;
  } = $props();

  const descendants = $derived.by(() => {
    const byParent: Record<number, ChainNode[]> = {};
    for (const node of chain?.nodes ?? []) {
      const parent = node.evolvesFromSpeciesId ?? 0;
      (byParent[parent] ??= []).push(node);
    }
    return byParent;
  });
  const roots = $derived.by(() => {
    const nodes = chain?.nodes ?? [];
    return nodes.filter(
      (node) =>
        node.evolvesFromSpeciesId === null ||
        !nodes.some((other) => other.speciesId === node.evolvesFromSpeciesId),
    );
  });

  // Source condition columns that hold IDs of reference resources we can name.
  const RESOURCE_CONDITIONS: Record<string, "items" | "moves" | "types"> = {
    evolution_item_id: "items",
    held_item_id: "items",
    known_move_id: "moves",
    used_move_id: "moves",
    known_move_type_id: "types",
    party_type_id: "types",
  };
  // Enumerated source values with translated labels, keyed by message-key prefix.
  const ENUM_CONDITIONS: Record<string, string> = {
    time_of_day: "evolution.time",
    gender_id: "evolution.gender",
    relative_physical_stats: "evolution.physical",
  };

  interface Condition {
    key: string;
    label: string | null;
    value: LocalizedText | string;
    code: boolean;
  }

  function conditions(method: EvolutionMethod): Condition[] {
    const rows: Condition[] = [];
    for (const [key, raw] of Object.entries(method.conditions)) {
      if (raw === null || raw === "" || raw === false) continue;
      const labelKey = messageKey(`condition.${key}`);
      const label = labelKey ? t(lang, labelKey) : null;
      let value: Condition["value"] = raw === true ? t(lang, "value.yes") : String(raw);
      const resource = RESOURCE_CONDITIONS[key];
      const enumPrefix = ENUM_CONDITIONS[key];
      if (resource && typeof raw === "number") {
        const row = references[resource].find((entry) => entry.id === raw);
        value = row
          ? localize(row.names, lang, row.identifier)
          : t(lang, "value.id", { id: raw });
      } else if (enumPrefix) {
        const enumKey = messageKey(`${enumPrefix}.${raw}`);
        if (enumKey) value = t(lang, enumKey);
      } else if (key === "party_species_id" || key === "trade_species_id") {
        const node = chain?.nodes.find((entry) => entry.speciesId === raw);
        value = node
          ? localize(node.names, lang, node.identifier)
          : t(lang, "value.id", { id: String(raw) });
      } else if (key === "evolved_pokemon_form_id" || key === "required_pokemon_form_id") {
        value = t(lang, "evolution.form", { id: String(raw) });
      } else if (key === "percentage_chance") {
        value = t(lang, "evolution.percent", { value: String(raw) });
      }
      rows.push({ key, label, value, code: key === "condition_expression" });
    }
    return rows;
  }
</script>

{#snippet methodList(methods: EvolutionMethod[])}
  <dl>
    <dt>{t(lang, "evolution.methods")}</dt>
    {#each methods as method (method.id)}
      {@const trigger = references.evolutionTriggers.find((row) => row.id === method.triggerId)}
      {@const rows = conditions(method)}
      <dd>
        <Localized
          text={localize(trigger?.names ?? [], lang, trigger?.identifier ?? String(method.triggerId))}
        />
        <small>
          ({method.versionGroupId === null
            ? t(lang, "evolution.noGame")
            : t(lang, "evolution.recordedFor", {
                games: versionGroupName(lang, references.versions, method.versionGroupId),
              })}{method.isDefault ? `, ${t(lang, "evolution.sourceDefault")}` : ""})
        </small>
        {#if rows.length}
          <dl>
            {#each rows as row (row.key)}
              <dt>{#if row.label}{row.label}{:else}<code>{row.key}</code>{/if}</dt>
              <dd>
                {#if typeof row.value !== "string"}
                  <Localized text={row.value} />
                {:else if row.code}
                  <code>{row.value}</code>
                {:else}
                  {row.value}
                {/if}
              </dd>
            {/each}
          </dl>
        {/if}
      </dd>
    {/each}
  </dl>
{/snippet}

{#snippet branch(nodes: ChainNode[])}
  <ul>
    {#each nodes as node (node.speciesId)}
      {@const name = localize(node.names, lang, node.identifier)}
      <li>
        {#if node.speciesId === speciesId}
          <strong aria-current="page"><Localized text={name} /></strong>
          <small>({t(lang, "evolution.current")})</small>
        {:else}
          <a
            href={resolve(
              pokemonHref(lang, node.speciesId, { version, form: null }).slice(
                1,
              ) as PathnameWithSearchOrHash,
            )}><Localized text={name} /></a
          >
        {/if}
        {#if node.generationId > generationId}
          <small>({t(lang, "evolution.notIntroduced", { game })})</small>
        {/if}
        {#if node.methods.length}
          {@render methodList(node.methods)}
        {/if}
        {#if descendants[node.speciesId]}
          {@render branch(descendants[node.speciesId]!)}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

<section aria-labelledby="evolution-heading">
  <h2 id="evolution-heading">{t(lang, "evolution.heading")}</h2>
  {#if chain}
    {#if chain.applicability === "unresolved"}
      <p>{t(lang, "evolution.note", { game })}</p>
    {/if}
    {@render branch(roots)}
  {:else if hasChain}
    <p>{t(lang, "evolution.missing")}</p>
  {:else}
    <p>{t(lang, "evolution.none")}</p>
  {/if}
</section>
