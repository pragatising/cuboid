import { describe, expect, it } from "vitest";
import { needsOutline } from "./outline";

describe("which swatches need an outline", () => {
  it("is white and near-white: they would be lost on the page", () => {
    expect(needsOutline("#ffffff")).toBe(true);
    expect(needsOutline("rgb(255, 255, 255)")).toBe(true);
    expect(needsOutline("#f4f4f2")).toBe(true);
  });

  it("is a colour that is mostly transparent: it is not there to see", () => {
    expect(needsOutline("rgba(0, 0, 0, 0.1)")).toBe(true);
    expect(needsOutline("rgba(255, 0, 0, 0.3)")).toBe(true);
  });

  it("is not a colour that stands out by itself: a dark, a saturated, a mid one", () => {
    expect(needsOutline("#000000")).toBe(false);
    expect(needsOutline("#3d9a5f")).toBe(false);
    expect(needsOutline("rgb(196, 55, 45)")).toBe(false);
    expect(needsOutline("#6f6f6d")).toBe(false);
    expect(needsOutline("rgba(0, 0, 0, 0.8)")).toBe(false);
  });

  it("makes no claim for what the browser cannot read: a variable the page defines", () => {
    expect(needsOutline("var(--brand)")).toBe(false);
    expect(needsOutline("inherit")).toBe(false);
  });
});
