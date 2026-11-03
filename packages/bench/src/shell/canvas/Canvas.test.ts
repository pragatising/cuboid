import { describe, expect, it } from "vitest";
import { MAX_SCALE, MIN_SCALE, fitView, zoomAt } from "./Canvas";

describe("zooming", () => {
  it("keeps the point under the pointer where it is", () => {
    const before = { x: 40, y: 20, scale: 1 };
    const after = zoomAt(before, 2, 140, 120);
    // The content point under (140, 120) before: ((140 - 40) / 1, (120 - 20) / 1) = (100, 100). After: x + 100 * 2 = 140.
    expect(after.x + 100 * after.scale).toBe(140);
    expect(after.y + 100 * after.scale).toBe(120);
    expect(after.scale).toBe(2);
  });

  it("stays between the least and most there is", () => {
    expect(zoomAt({ x: 0, y: 0, scale: 1 }, 100, 0, 0).scale).toBe(MAX_SCALE);
    expect(zoomAt({ x: 0, y: 0, scale: 1 }, 0.0001, 0, 0).scale).toBe(MIN_SCALE);
  });
});

describe("fitting", () => {
  it("shrinks what is larger than the room, and centres it", () => {
    const view = fitView({ width: 1000, height: 600 }, { width: 2000, height: 600 }, 0);
    expect(view.scale).toBe(0.5);
    expect(view.x).toBe(0);
    expect(view.y).toBe((600 - 300) / 2);
  });

  it("never enlarges what already fits", () => {
    expect(fitView({ width: 1000, height: 600 }, { width: 100, height: 100 }).scale).toBe(1);
  });
});
