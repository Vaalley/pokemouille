import { error, json } from "@sveltejs/kit";
import { projectMoveLearners } from "#lib/data/moveset.ts";
import { getRelatedPokemon, getResourceCatalogue } from "#lib/server/catalogue.ts";
import type { EntryGenerator, RequestHandler } from "./$types";

// One language-independent learner file per move, pinned to the built dataset revision so
// the moveset tool downloads only the selected moves, from the snapshot its page came from.
// Served as static assets (not under /data, which .assetsignore routes to R2).
export const prerender = true;

export const entries: EntryGenerator = async () => {
  const revision = import.meta.env.DATASET_REVISION;
  if (!revision) return [];
  const { entries: moves } = await getResourceCatalogue("move", "en");
  return moves.map((move) => ({ revision, move: String(move.id) }));
};

export const GET: RequestHandler = async ({ params }) => {
  if (params.revision !== import.meta.env.DATASET_REVISION) error(404, "Unknown dataset revision");
  if (!/^[1-9]\d*$/.test(params.move)) error(404, "Unknown move");
  const id = Number(params.move);
  const { entries: moves } = await getResourceCatalogue("move", "en");
  if (!moves.some((move) => move.id === id)) error(404, "Unknown move");
  // Identities and learnsets are language-independent; the language only selects names.
  const related = await getRelatedPokemon("move", id, "en");
  return json(projectMoveLearners(id, related.pokemon));
};
