export const DERIVED_DATA_PREFIXES = ["learners", "breeding"] as const;

const DERIVED_DATA_KEY = /^(?:learners|breeding)\/[a-f0-9]{64}\/[1-9]\d*\.json$/;

/** Only revision-pinned, positive-ID JSON projections are public immutable assets. */
export function isDerivedDataKey(key: string): boolean {
  return DERIVED_DATA_KEY.test(key);
}
