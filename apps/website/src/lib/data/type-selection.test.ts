import { describe, expect, it } from "vite-plus/test";
import { readTypeSelection, typeSelectionUrl, typesHref } from "./type-selection.ts";

describe("type selection URLs", () => {
  it("reads single and dual numeric IDs and deduplicates defenders", () => {
    expect(readTypeSelection(new URLSearchParams("type=10&type2=3"))).toEqual({
      ids: [10, 3],
      invalid: false,
    });
    expect(readTypeSelection(new URLSearchParams("type=10&type2=10"))).toEqual({
      ids: [10],
      invalid: false,
    });
    expect(readTypeSelection(new URLSearchParams("type2=3"))).toEqual({ ids: [3], invalid: false });
    expect(readTypeSelection(new URLSearchParams())).toEqual({ ids: [], invalid: false });
  });
  it("rejects malformed, repeated and unsupported selections instead of inventing a chart", () => {
    for (const query of [
      "type=19",
      "type=10001",
      "type=fire",
      "type=01",
      "type=1.5",
      "type=",
      "type=10&type=3",
      "type=10&type2=19",
    ]) {
      expect(readTypeSelection(new URLSearchParams(query)).invalid).toBe(true);
    }
  });
  it("updates and resets only type parameters while preserving game and language", () => {
    const original = new URL("https://example.test/ja/types/?type=10&type=3&type2=18&version=red");
    const next = typeSelectionUrl(original, [11, 5, 3]);
    expect(next.pathname).toBe("/ja/types/");
    expect(next.searchParams.get("version")).toBe("red");
    expect(next.searchParams.getAll("type")).toEqual(["11"]);
    expect(next.searchParams.get("type2")).toBe("5");
    expect(typeSelectionUrl(next, []).search).toBe("?version=red");
    expect(original.searchParams.getAll("type")).toEqual(["10", "3"]);
  });
  it("builds single-type links without an old second defender", () => {
    expect(typesHref("fr", [10], "red")).toBe("fr/types/?type=10&version=red");
    expect(typesHref("en", [10, 3], null)).toBe("en/types/?type=10&type2=3");
  });
});
