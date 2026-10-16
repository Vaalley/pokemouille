<script lang="ts">
  import { resolve } from "$app/paths";
  import type { PathnameWithSearchOrHash } from "$app/types";
  import { localize } from "../../../../../../packages/pokemon-data/src/localization.ts";
  import type {
    EvolutionChainProjection,
    EvolutionMethod,
    LocalizedText,
    NamedResource,
    ReferenceData,
  } from "../../../../../../packages/pokemon-data/src/index.ts";
  import { pokemonHref } from "#lib/data/context.ts";
  import { evolutionTree } from "#lib/data/evolution-tree.ts";
  import type { EvolutionForm, EvolutionTreeNode } from "#lib/data/evolution-tree.ts";
  import type { Language } from "#lib/i18n/core.ts";
  import { messageKey, t, versionGroupName } from "#lib/i18n/pokemon.ts";
  import { t as evolutionText } from "#lib/i18n/evolution.ts";
  import PokemonIcon from "../PokemonIcon.svelte";
  import ItemLink from "../ItemLink.svelte";
  import MoveIcon from "../MoveIcon.svelte";
  import TypeBadge from "../TypeBadge.svelte";
  import Localized from "./Localized.svelte";

  let {
    lang,
    chain,
    forms,
    hasChain,
    speciesId,
    formId,
    version,
    generationId,
    game,
    references,
  }: {
    lang: Language;
    chain: EvolutionChainProjection | null;
    /** Forms named by the chain's evolution conditions, keyed by form ID. */
    forms: Record<number, EvolutionForm>;
    /** Whether the species record names an evolution chain at all. */
    hasChain: boolean;
    speciesId: number;
    /** Form shown on this page; null when the form could not be resolved. */
    formId: number | null;
    version: string;
    /** Generation of the selected game. */
    generationId: number;
    game: string;
    references: ReferenceData;
  } = $props();

  const roots = $derived(chain ? evolutionTree(chain, forms) : []);
  // A variety with its own card is "this page" there; every other form of the species
  // (default, cosmetic, or without a card) marks the species card.
  const currentKey = $derived.by(() => {
    const formKey = `${speciesId}:${formId}`;
    const hasCard = (nodes: EvolutionTreeNode[]): boolean =>
      nodes.some((node) => node.key === formKey || hasCard(node.children));
    return formId !== null && hasCard(roots) ? formKey : String(speciesId);
  });
  function introducedGeneration(node: EvolutionTreeNode): number {
    const group = node.form?.versionGroupId;
    const formGeneration = references.versionGroups.find((row) => row.id === group)?.generationId;
    return Math.max(node.generationId, formGeneration ?? 0);
  }

  // Source condition columns that hold IDs of reference resources we can name.
  const RESOURCE_CONDITIONS: Record<string, "items" | "moves" | "types"> = {
    evolution_item_id: "items",
    held_item_id: "items",
    item_id: "items",
    trigger_item_id: "items",
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
    item?: NamedResource;
    move?: { typeId: number | null | undefined };
    typeId?: number;
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
      let item: NamedResource | undefined;
      let move: Condition["move"];
      let typeId: number | undefined;
      if (resource && typeof raw === "number") {
        const row = references[resource].find((entry) => entry.id === raw);
        if (resource === "items") item = row;
        if (resource === "types") typeId = raw;
        if (resource === "moves") {
          move = {
            typeId: row && "typeId" in row && typeof row.typeId === "number" ? row.typeId : undefined,
          };
        }
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
        value = (typeof raw === "number" ? forms[raw]?.name : undefined) ??
          t(lang, "evolution.form", { id: String(raw) });
      } else if (key === "percentage_chance") {
        value = t(lang, "evolution.percent", { value: String(raw) });
      }
      rows.push({ key, label, value, item, move, typeId, code: key === "condition_expression" });
    }
    return rows;
  }
</script>

{#snippet methodList(methods: EvolutionMethod[])}
  <div class="methods">
    <p class="methods-label">{t(lang, "evolution.methods")}</p>
    {#each methods as method, index (method.id)}
      {@const trigger = references.evolutionTriggers.find((row) => row.id === method.triggerId)}
      {@const rows = conditions(method)}
      {#if index > 0}
        <p class="alternative">{evolutionText(lang, "or")}</p>
      {/if}
      <div class="method">
        <p class="trigger">
          <Localized
            text={localize(trigger?.names ?? [], lang, trigger?.identifier ?? String(method.triggerId))}
          />
        </p>
        <p class="provenance">
          {method.versionGroupId === null
            ? t(lang, "evolution.noGame")
            : t(lang, "evolution.recordedFor", {
                games: versionGroupName(lang, references.versions, method.versionGroupId),
              })}{method.isDefault ? `, ${t(lang, "evolution.sourceDefault")}` : ""}
        </p>
        {#if rows.length}
          <p class="requirements">{evolutionText(lang, "requirements")}</p>
          <dl class="conditions">
            {#each rows as row, rowIndex (row.key)}
              <div class="condition">
                <dt>
                  {#if rowIndex > 0}<span class="and">{evolutionText(lang, "and")}</span>{/if}
                  {#if row.label}{row.label}{:else}<code>{row.key}</code>{/if}
                </dt>
                <dd>
                  {#if row.item}
                    <ItemLink item={row.item} {lang} {version} />
                  {:else if row.typeId && typeof row.value !== "string"}
                    <TypeBadge typeId={row.typeId} name={row.value} />
                  {:else if row.move}
                    <MoveIcon typeId={row.move.typeId} />
                    {#if typeof row.value === "string"}{row.value}{:else}<Localized text={row.value} />{/if}
                  {:else if typeof row.value !== "string"}
                    <Localized text={row.value} />
                  {:else if row.code}
                    <code>{row.value}</code>
                  {:else}
                    {row.value}
                  {/if}
                </dd>
              </div>
            {/each}
          </dl>
        {/if}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet branch(nodes: EvolutionTreeNode[])}
  <ul class="branches">
    {#each nodes as node (node.key)}
      {@const name = node.form?.name ?? localize(node.names, lang, node.identifier)}
      <li class="branch">
        <article class:current={node.key === currentKey} class="card">
          <div class="identity">
            <PokemonIcon speciesId={node.speciesId} />
            <div>
              <span class="dex"><span class="sr-only">{evolutionText(lang, "dex")} </span>#{String(node.speciesId).padStart(4, "0")}</span>
              {#if node.key === currentKey}
                <strong aria-current="page"><Localized text={name} /></strong>
                <span class="badge">{t(lang, "evolution.current")}</span>
              {:else}
                <a
                  href={resolve(
                    pokemonHref(lang, node.speciesId, {
                      version,
                      form: node.form?.identifier ?? null,
                    }).slice(1) as PathnameWithSearchOrHash,
                  )}><Localized text={name} /></a
                >
              {/if}
            </div>
          </div>
          {#if introducedGeneration(node) > generationId}
            <p class="badge">{t(lang, "evolution.notIntroduced", { game })}</p>
          {/if}
          {#if node.methods.length}
            {@render methodList(node.methods)}
          {/if}
        </article>
        {#if node.children.length}
          {@render branch(node.children)}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

<section aria-labelledby="evolution-heading">
  <h2 id="evolution-heading">{t(lang, "evolution.heading")}</h2>
  {#if chain}
    <p class="note">{evolutionText(lang, "scope")}</p>
    {#if chain.applicability === "unresolved"}
      <p class="note">{t(lang, "evolution.note", { game })}</p>
    {/if}
    {@render branch(roots)}
  {:else if hasChain}
    <p>{t(lang, "evolution.missing")}</p>
  {:else}
    <p>{t(lang, "evolution.none")}</p>
  {/if}
</section>

<style>
  section {
    min-width: 0;
  }
  .branches {
    display: grid;
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    min-width: 0;
  }
  .branch {
    position: relative;
    min-width: 0;
  }
  /* Each child owns its connector; a list-wide border would trail below
     the last child and cannot follow branches that wrap into grid rows. */
  .branch > .branches {
    margin-top: 0;
    margin-left: 1rem;
    padding-top: 1rem;
    padding-left: 1rem;
  }
  .branch > .branches > .branch::before {
    content: "";
    position: absolute;
    top: -1rem;
    bottom: -1rem;
    left: -1rem;
    border-left: 2px solid var(--border, #8888);
  }
  .branch > .branches > .branch:last-child::before {
    bottom: auto;
    height: 2.5rem;
  }
  .branch > .branches > .branch::after {
    content: "";
    position: absolute;
    top: 1.5rem;
    left: -1rem;
    width: 1rem;
    border-top: 2px solid var(--border, #8888);
  }
  .card {
    min-width: 0;
    border: 1px solid var(--border, #8888);
    border-radius: 0.75rem;
    padding: 1rem;
    overflow-wrap: anywhere;
  }
  .current {
    border-width: 2px;
    border-color: currentColor;
  }
  .identity {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .identity > div {
    min-width: 0;
  }
  .identity a,
  .identity strong {
    font-size: 1.1rem;
  }
  .identity a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
    border-radius: 2px;
  }
  .dex {
    display: block;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    opacity: 0.75;
  }
  .badge {
    display: inline-block;
    margin: 0.25rem 0 0 0.25rem;
    padding: 0.15rem 0.4rem;
    border: 1px solid var(--border, #8888);
    border-radius: 0.3rem;
    font-size: 0.8rem;
  }
  .methods {
    margin-top: 0.75rem;
  }
  .methods-label,
  .trigger {
    margin: 0 0 0.4rem;
    font-weight: 600;
  }
  .method {
    padding: 0.75rem;
    border-radius: 0.4rem;
    background: color-mix(in srgb, currentColor 5%, transparent);
  }
  .provenance,
  .requirements {
    margin: 0.25rem 0;
    font-size: 0.8rem;
  }
  .requirements {
    margin-top: 0.75rem;
  }
  .conditions {
    margin: 0.25rem 0 0;
  }
  .condition + .condition {
    margin-top: 0.5rem;
  }
  .condition dt {
    font-size: 0.85rem;
  }
  .condition dd {
    margin: 0.15rem 0 0;
    font-weight: 500;
  }
  .and {
    margin-right: 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .alternative {
    text-align: center;
    font-weight: 700;
    margin: 0.5rem;
  }
  code {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (max-width: 30rem) {
    .card {
      padding: 0.65rem;
    }
    .branch > .branches {
      margin-left: 0.35rem;
      padding-left: 0.65rem;
    }
    .branch > .branches > .branch::before,
    .branch > .branches > .branch::after {
      left: -0.65rem;
    }
    .branch > .branches > .branch::after {
      width: 0.65rem;
    }
  }
</style>
