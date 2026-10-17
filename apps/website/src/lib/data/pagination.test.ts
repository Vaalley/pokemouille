import { describe, expect, it } from "vite-plus/test";
import { pageCount, pageFromPath, paginate, paginationUrl, validPage } from "./pagination.ts";

describe("catalogue pagination", () => {
  it("exposes only canonical pages backed by actual rows", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(50)).toBe(1);
    expect(pageCount(51)).toBe(2);
    expect(validPage("2", 51)).toBe(2);
    expect(validPage("21", 1025)).toBe(21);
    for (const value of ["1", "0", "-1", "02", "2.0", "2e0", "2x", "9007199254740993", ""]) {
      expect(validPage(value, 1025)).toBeNull();
    }
    expect(validPage("2", 50)).toBeNull();
    expect(validPage("22", 1025)).toBeNull();
  });

  it("slices the entire filtered result without dropping or repeating boundary rows", () => {
    const entries = Array.from({ length: 205 }, (_, index) => index + 1);
    const filtered = entries.filter((id) => id % 2 === 1);
    const first = paginate(filtered, 1);
    const second = paginate(filtered, 2);
    const last = paginate(filtered, 3);
    expect(first.rows).toHaveLength(50);
    expect(first.rows.at(-1)).toBe(99);
    expect(second.rows[0]).toBe(101);
    expect(second.rows).toHaveLength(50);
    expect(last.rows).toEqual([201, 203, 205]);
    expect([...first.rows, ...second.rows, ...last.rows]).toEqual(filtered);
    expect(paginate(filtered, 9)).toEqual(last);
    expect(paginate([], 2)).toEqual({ page: 1, pages: 1, rows: [] });
  });

  it("uses base URLs for page one and keeps filters and context on every page", () => {
    for (const section of ["", "move/", "ability/", "item/"]) {
      const source = new URL(
        `https://example.test/base/fr/${section}?q=chu&type=13&generation=1&category=2&version=red&form=alola#results`,
      );
      const second = paginationUrl(source, 2);
      expect(second.pathname).toBe(`/base/fr/${section}page/2/`);
      expect(pageFromPath(second.pathname)).toBe(2);
      expect(second.search).toBe(source.search);
      expect(second.hash).toBe(source.hash);
      const third = paginationUrl(second, 3, "blue");
      expect(third.pathname).toBe(`/base/fr/${section}page/3/`);
      expect(third.searchParams.get("version")).toBe("blue");
      expect(third.searchParams.get("q")).toBe("chu");
      expect(paginationUrl(second, 1).href).toBe(source.href);
      expect(pageFromPath(source.pathname)).toBe(1);
      expect(source.pathname).toBe(`/base/fr/${section}`);
    }
  });
});
