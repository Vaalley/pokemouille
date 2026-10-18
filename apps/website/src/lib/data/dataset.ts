import { revisionPath } from "../../../../../packages/pokemon-data/src/index.ts";

/**
 * Static-asset path of a file in the dataset revision this site was built from. Prerendered
 * page data and browser downloads therefore always come from the same snapshot.
 */
export function datasetPath(file: string): string {
  const revision = import.meta.env.DATASET_REVISION;
  if (!revision) throw new Error("This site was built without a published dataset");
  return `data/${revisionPath(revision, file)}`;
}
