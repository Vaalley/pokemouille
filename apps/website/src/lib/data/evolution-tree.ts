import type {
  EvolutionChainProjection,
  EvolutionMethod,
  LocalizedText,
} from "../../../../../packages/pokemon-data/src/index.ts";

type ChainNode = EvolutionChainProjection["nodes"][number];

/** A Pokémon form referenced by an evolution condition in the chain, keyed by form ID. */
export interface EvolutionForm {
  speciesId: number;
  /** Form identifier, as accepted by the detail page's `form` parameter. */
  identifier: string;
  /** Belongs to a non-default variety (regional form, etc.), so it is a distinct Pokémon. */
  separate: boolean;
  versionGroupId: number | null;
  name: LocalizedText;
}

export interface EvolutionTreeNode extends Omit<ChainNode, "methods"> {
  key: string;
  /** Distinct variety this card stands for; null for the species card. */
  form: (EvolutionForm & { id: number }) | null;
  methods: EvolutionMethod[];
  children: EvolutionTreeNode[];
}

/**
 * Species-level chain → display tree. Methods whose resulting form is a distinct variety
 * become a sibling card for that variety (Vulpix → Ninetales | Alolan Ninetales); cosmetic
 * results stay on the species card. A later stage whose methods all require one such
 * variety hangs off its card (Galarian Mr. Mime → Mr. Rime); others off the species card.
 */
export function evolutionTree(
  chain: Pick<EvolutionChainProjection, "nodes">,
  forms: Readonly<Record<number, EvolutionForm>>,
): EvolutionTreeNode[] {
  const cards = new Map<number, EvolutionTreeNode[]>();
  const byForm = new Map<number, EvolutionTreeNode>();
  for (const { methods, ...node } of chain.nodes) {
    const species: EvolutionTreeNode = {
      ...node,
      key: String(node.speciesId),
      form: null,
      methods: [],
      children: [],
    };
    const own = [species];
    for (const method of methods) {
      const formId = method.conditions.evolved_pokemon_form_id;
      const form = typeof formId === "number" ? forms[formId] : undefined;
      if (typeof formId !== "number" || !form?.separate || form.speciesId !== node.speciesId) {
        species.methods.push(method);
        continue;
      }
      let card = byForm.get(formId);
      if (!card) {
        card = {
          ...node,
          key: `${node.speciesId}:${formId}`,
          form: { ...form, id: formId },
          methods: [],
          children: [],
        };
        byForm.set(formId, card);
        own.push(card);
      }
      card.methods.push(method);
    }
    cards.set(node.speciesId, own);
  }
  // A regional form that no method produces (Alolan Vulpix, Galarian Meowth) still gets a
  // card beside its species card when a later stage requires it.
  const requiredForms = new Map<EvolutionTreeNode, number>();
  for (const card of [...cards.values()].flat()) {
    const required = new Set(card.methods.map((row) => row.conditions.required_pokemon_form_id));
    const [formId] = required;
    if (required.size !== 1 || typeof formId !== "number") continue;
    requiredForms.set(card, formId);
    const form = forms[formId];
    const parent =
      card.evolvesFromSpeciesId === null ? undefined : cards.get(card.evolvesFromSpeciesId)?.[0];
    if (byForm.has(formId) || !form?.separate || !parent || form.speciesId !== parent.speciesId)
      continue;
    const formCard: EvolutionTreeNode = {
      ...parent,
      key: `${parent.speciesId}:${formId}`,
      form: { ...form, id: formId },
      methods: [],
      children: [],
    };
    byForm.set(formId, formCard);
    cards.get(parent.speciesId)!.push(formCard);
  }
  const roots: EvolutionTreeNode[] = [];
  for (const node of chain.nodes) {
    for (const card of cards.get(node.speciesId)!) {
      const formId = requiredForms.get(card);
      const formParent = formId === undefined ? undefined : byForm.get(formId);
      const parent =
        formParent && formParent.speciesId === node.evolvesFromSpeciesId
          ? formParent
          : node.evolvesFromSpeciesId === null
            ? undefined
            : cards.get(node.evolvesFromSpeciesId)?.[0];
      (parent ? parent.children : roots).push(card);
    }
  }
  return roots;
}
