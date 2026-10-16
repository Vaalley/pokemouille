import type { Language } from "#lib/i18n/core.ts";

export function typesHref(
  lang: Language,
  types: readonly number[],
  version: string | null,
): string {
  const params = new URLSearchParams();
  const ids = [...new Set(types)].slice(0, 2);
  if (ids[0] !== undefined) params.set("type", String(ids[0]));
  if (ids[1] !== undefined) params.set("type2", String(ids[1]));
  if (version) params.set("version", version);
  return `${lang}/types/${params.size ? `?${params}` : ""}`;
}

export function readTypeSelection(params: URLSearchParams): { ids: number[]; invalid: boolean } {
  const ids: number[] = [];
  let invalid = false;
  for (const key of ["type", "type2"]) {
    const values = params.getAll(key);
    if (values.length > 1) invalid = true;
    const value = values[0];
    if (value === undefined) continue;
    if (!/^(?:[1-9]|1[0-8])$/.test(value)) {
      invalid = true;
      continue;
    }
    const id = Number(value);
    if (!ids.includes(id)) ids.push(id);
  }
  return { ids, invalid };
}

export function typeSelectionUrl(current: URL, ids: readonly number[]): URL {
  const url = new URL(current.href);
  url.searchParams.delete("type");
  url.searchParams.delete("type2");
  const unique = [...new Set(ids)].slice(0, 2);
  if (unique[0] !== undefined) url.searchParams.set("type", String(unique[0]));
  if (unique[1] !== undefined) url.searchParams.set("type2", String(unique[1]));
  return url;
}
