import { describe, expect, it } from "vite-plus/test";
import { resolveMainSprite, spriteStyle } from "./sprite-preference.ts";

describe("main Pokémon sprite preference", () => {
  const sprites = {
    front_default: "pixel.png",
    versions: {
      "generation-ii": {
        crystal: { front_default: "crystal.png", animated: { front_default: "crystal.gif" } },
      },
    },
  };

  it("selects the exact historical source and animation rather than the modern sprite", () => {
    expect(resolveMainSprite(sprites, "artwork.png", spriteStyle("crystal"))).toEqual({
      url: "crystal.png",
      fallback: false,
      pixelated: true,
    });
    expect(resolveMainSprite(sprites, "artwork.png", spriteStyle("crystal-animated"))).toEqual({
      url: "crystal.gif",
      fallback: false,
      pixelated: true,
    });
  });

  it("uses only this form's artwork when its preferred style is missing", () => {
    expect(
      resolveMainSprite(
        { front_default: "modern.png" },
        "form-artwork.png",
        spriteStyle("crystal"),
      ),
    ).toEqual({ url: "form-artwork.png", fallback: true, pixelated: false });
    expect(resolveMainSprite(null, null, spriteStyle("crystal"))).toEqual({
      url: null,
      fallback: true,
      pixelated: false,
    });
  });

  it("rejects invalid saved styles and unusable image values", () => {
    expect(spriteStyle("unknown-style").id).toBe("official");
    for (const front_default of [null, "", 25, {}]) {
      expect(resolveMainSprite({ front_default }, "artwork.png", spriteStyle("pixel"))).toEqual({
        url: "artwork.png",
        fallback: true,
        pixelated: false,
      });
    }
  });
});
