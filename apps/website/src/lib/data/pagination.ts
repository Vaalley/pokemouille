export const PAGE_SIZE = 50;

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

/** Only canonical page-two-and-later paths exist; page one is the base URL. */
export function validPage(value: string, total: number): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 2 && number <= pageCount(total) ? number : null;
}

export function pageFromPath(pathname: string): number {
  const match = /\/page\/([1-9]\d*)\/$/.exec(pathname);
  return match ? Number(match[1]) : 1;
}

/** Preserve deployment prefixes, filters, game/form context, and the fragment. */
export function paginationUrl(
  source: { readonly href: string },
  page: number,
  version?: string | null,
): URL {
  const next = new URL(source.href);
  const base = next.pathname.replace(/\/page\/[1-9]\d*\/$/, "/");
  next.pathname = page === 1 ? base : `${base}page/${page}/`;
  if (version) next.searchParams.set("version", version);
  return next;
}

/** Filter before slicing, including when a shared filter leaves fewer pages. */
export function paginate<T>(entries: readonly T[], requestedPage: number) {
  const pages = pageCount(entries.length);
  const page = Math.max(1, Math.min(requestedPage, pages));
  return { page, pages, rows: entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}
