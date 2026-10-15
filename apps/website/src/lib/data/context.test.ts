import { describe, expect, it } from "vite-plus/test";
import type { GameOption } from "../../../../../packages/pokemon-data/src/index.ts";
import { pickRootLanguage, pokemonHref, resolveContext, swapLanguageHref } from "./context.ts";

const games: Pick<GameOption, "version">[] = ["red", "scarlet", "violet"].map(
  (identifier, index) => ({
    version: { id: index + 1, identifier, versionGroupId: index + 1, names: [] },
  }),
);

function context(search: string, savedVersion: string | null = null) {
  return resolveContext({
    url: new URL(`https://example.test/fr/pokemon/25/${search}`),
    language: "fr",
    games,
    savedVersion,
  });
}

describe("resolveContext", () => {
  it("prefers a valid explicit version over the saved preference", () => {
    expect(context("?version=red", "violet")).toEqual({
      language: "fr",
      version: "red",
      versionSource: "url",
      form: null,
      rejectedVersion: null,
    });
  });

  it("uses a valid saved preference when the URL has no version", () => {
    expect(context("", "violet")).toMatchObject({
      version: "violet",
      versionSource: "preference",
      rejectedVersion: null,
    });
  });

  it("defaults to Scarlet without URL version or preference", () => {
    expect(context("")).toMatchObject({
      version: "scarlet",
      versionSource: "default",
      rejectedVersion: null,
    });
  });

  it("records an invalid explicit version and falls back to the preference", () => {
    expect(context("?version=pokemon-stadium", "red")).toMatchObject({
      version: "red",
      versionSource: "preference",
      rejectedVersion: "pokemon-stadium",
    });
  });

  it("records an invalid explicit version and falls back to Scarlet", () => {
    expect(context("?version=pokemon-stadium")).toMatchObject({
      version: "scarlet",
      versionSource: "default",
      rejectedVersion: "pokemon-stadium",
    });
  });

  it("ignores an unknown saved preference", () => {
    expect(context("", "colosseum")).toMatchObject({
      version: "scarlet",
      versionSource: "default",
      rejectedVersion: null,
    });
  });

  it("passes the form through unvalidated", () => {
    expect(context("?version=red&form=pikachu-gmax").form).toBe("pikachu-gmax");
    expect(context("?form=not-a-form").form).toBe("not-a-form");
    expect(context("?version=red").form).toBeNull();
  });
});

describe("pokemonHref", () => {
  it("materializes version and omits a null form", () => {
    expect(pokemonHref("ja", 25, { version: "scarlet", form: null })).toBe(
      "/ja/pokemon/25/?version=scarlet",
    );
  });

  it("includes a selected form", () => {
    expect(pokemonHref("en", 6, { version: "x", form: "charizard-mega-x" })).toBe(
      "/en/pokemon/6/?version=x&form=charizard-mega-x",
    );
  });
});

describe("swapLanguageHref", () => {
  it("replaces the language segment and preserves the query", () => {
    expect(
      swapLanguageHref(new URL("https://example.test/en/pokemon/25/?version=red&form=x"), "fr"),
    ).toBe("/fr/pokemon/25/?version=red&form=x");
  });

  it("adds a language to a path without one", () => {
    expect(swapLanguageHref(new URL("https://example.test/"), "ja")).toBe("/ja/");
  });
});

describe("pickRootLanguage", () => {
  it("prefers a valid saved language", () => {
    expect(pickRootLanguage("ja", ["fr-FR"])).toBe("ja");
  });

  it("matches browser languages by primary subtag", () => {
    expect(pickRootLanguage(null, ["fr-CA", "en"])).toBe("fr");
    expect(pickRootLanguage(null, ["de-DE", "ja-JP"])).toBe("ja");
  });

  it("ignores an invalid saved language", () => {
    expect(pickRootLanguage("jp", ["fr"])).toBe("fr");
  });

  it("falls back to English", () => {
    expect(pickRootLanguage(null, ["de", "es-MX"])).toBe("en");
    expect(pickRootLanguage(null, [])).toBe("en");
  });
});
