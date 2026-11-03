import { describe, expect, it } from "vitest";
import { keyDrag, MAX_WIDTH, MIN_HEIGHT, MIN_WIDTH, resizeBox } from "./resize";
import type { Box } from "./resize";

const start: Box = { width: 400, height: 300, x: 0, y: 0 };

describe("resizeBox", () => {
  it("an east or south side grows with the pointer and leaves the frame where it is", () => {
    expect(resizeBox(start, "e", 50, 99)).toEqual({ width: 450, height: 300, x: 0, y: 0 });
    expect(resizeBox(start, "s", 99, 40)).toEqual({ width: 400, height: 340, x: 0, y: 0 });
    expect(resizeBox(start, "se", 50, 40)).toEqual({ width: 450, height: 340, x: 0, y: 0 });
  });

  it("a west side drags the left edge: dragging it left widens, and the right edge stays", () => {
    const next = resizeBox(start, "w", -60, 0);
    expect(next.width).toBe(460);
    expect(next.x).toBe(-60);
    expect(next.x + next.width).toBe(start.x + start.width);
  });

  it("a north side drags the top edge: dragging it up makes it taller, and the bottom edge stays", () => {
    const next = resizeBox(start, "n", 0, -50);
    expect(next.height).toBe(350);
    expect(next.y).toBe(-50);
    expect(next.y + next.height).toBe(start.y + start.height);
  });

  it("a corner moves both sides it is made of", () => {
    expect(resizeBox(start, "nw", -20, -30)).toEqual({ width: 420, height: 330, x: -20, y: -30 });
    expect(resizeBox(start, "ne", 20, -30)).toEqual({ width: 420, height: 330, x: 0, y: -30 });
    expect(resizeBox(start, "sw", -20, 30)).toEqual({ width: 420, height: 330, x: -20, y: 0 });
  });

  it("stops at the limits, and the frame stops moving with its edge", () => {
    const narrow = resizeBox(start, "w", 900, 0);
    expect(narrow.width).toBe(MIN_WIDTH);
    expect(narrow.x + narrow.width).toBe(start.width);
    expect(resizeBox(start, "e", 99999, 0).width).toBe(MAX_WIDTH);
    expect(resizeBox(start, "s", 0, -99999).height).toBe(MIN_HEIGHT);
    const short = resizeBox(start, "n", 0, 9999);
    expect(short.y + short.height).toBe(start.height);
  });

  it("is measured from where the drag began, so moving back undoes it", () => {
    const moved: Box = { width: 400, height: 300, x: 30, y: 10 };
    expect(resizeBox(moved, "w", 0, 0)).toEqual(moved);
    expect(resizeBox(moved, "nw", 0, 0)).toEqual(moved);
  });

  it("rounds to whole pixels", () => {
    expect(resizeBox(start, "e", 10.6, 0).width).toBe(411);
  });
});

describe("keyDrag", () => {
  it("an arrow along a side's own direction grows the frame, the opposite shrinks it", () => {
    expect(keyDrag("e", "ArrowRight", 16)).toEqual({ dx: 16, dy: 0 });
    expect(keyDrag("e", "ArrowLeft", 16)).toEqual({ dx: -16, dy: 0 });
    expect(keyDrag("s", "ArrowDown", 16)).toEqual({ dx: 0, dy: 16 });
    expect(keyDrag("n", "ArrowUp", 16)).toEqual({ dx: 0, dy: -16 });
  });

  it("a west or north side grows it the way the pointer would: left and up", () => {
    const grown = resizeBox(start, "w", ...(Object.values(keyDrag("w", "ArrowLeft", 16)!) as [number, number]));
    expect(grown.width).toBe(416);
  });

  it("ignores an arrow across the side, and any other key", () => {
    expect(keyDrag("e", "ArrowUp", 16)).toBeNull();
    expect(keyDrag("s", "ArrowRight", 16)).toBeNull();
    expect(keyDrag("e", "Enter", 16)).toBeNull();
  });
});
