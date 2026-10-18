import { error, json } from "@sveltejs/kit";
import { getBreedingProjection, getEggGroups } from "#lib/server/breeding.ts";
import { createSnapshotCache } from "#lib/server/snapshot.ts";
import type { EntryGenerator, RequestHandler } from "./$types";

export const prerender = true;
const getSpeciesIds = createSnapshotCache(async (manifest) => Object.keys(manifest.files.pokemon));
export const entries: EntryGenerator = async () => {
  const { revision } = await getEggGroups();
  return (await getSpeciesIds()).map((id) => ({ revision, id }));
};
export const GET: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== params.id)
    error(404, "Unknown species");
  const projection = await getBreedingProjection(id, params.revision);
  if (!projection) error(404, "Unknown breeding snapshot");
  return json(projection, { headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
};
