import { describe, expect, it } from "vite-plus/test";
import { CELL, COLUMNS, fitCell, packIcons, slotModule } from "../src/item-icons.ts";
import type { Rgba } from "../src/item-icons.ts";

function icon(size: number, pixels: [x: number, y: number, rgba: number[]][]): Rgba {
  const data = new Uint8Array(size * size * 4);
  for (const [x, y, rgba] of pixels) data.set(rgba, (y * size + x) * 4);
  return { width: size, height: size, data };
}

function pixel(cell: Uint8Array, x: number, y: number): number[] {
  return [...cell.subarray((y * CELL + x) * 4, (y * CELL + x) * 4 + 4)];
}

describe("fitCell", () => {
  it("centres smaller icons without scaling", () => {
    const cell = fitCell(icon(24, [[0, 0, [1, 2, 3, 255]]]), "small");
    expect(pixel(cell, 3, 3)).toEqual([1, 2, 3, 255]);
    expect(cell.filter((byte) => byte !== 0)).toHaveLength(4);
  });

  it("drops only fully transparent margins of larger icons", () => {
    const cell = fitCell(
      icon(32, [
        [1, 30, [9, 9, 9, 128]],
        [0, 0, [5, 5, 5, 0]],
      ]),
      "large",
    );
    expect(pixel(cell, 0, 29)).toEqual([9, 9, 9, 128]);
    expect(() => fitCell(icon(32, [[31, 5, [0, 0, 0, 1]]]), "clipped")).toThrow(/clipped/);
  });
});

describe("packIcons", () => {
  it("assigns slots in sorted identifier order across rows", () => {
    const icons = new Map<string, Rgba>();
    for (let index = COLUMNS; index >= 0; index--)
      icons.set(`item-${String(index).padStart(2, "0")}`, icon(CELL, [[0, 0, [index, 0, 0, 255]]]));
    const sheet = packIcons(icons);
    expect([sheet.width, sheet.height]).toEqual([COLUMNS * CELL, 2 * CELL]);
    expect(sheet.slots.get("item-00")).toBe(0);
    expect(sheet.slots.get(`item-${COLUMNS}`)).toBe(COLUMNS);
    expect(sheet.data[CELL * sheet.width * 4]).toBe(COLUMNS);
    expect(slotModule(sheet.slots)).toContain(`"item-01": 1,`);
  });
});
