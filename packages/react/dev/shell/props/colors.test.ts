import tokens from "@sragatiping/cuboid-primitives";
import { describe, expect, it } from "vitest";
import { isColorEnum, isColorSet, scaleOf, swatchColor, swatchGroups } from "./colors";

const light = tokens.light as never;

describe("which scale a colour prop is in", () => {
  it("is a background, a border, or a foreground", () => {
    expect(scaleOf("backgroundColor")).toBe("bgColor");
    expect(scaleOf("borderColor")).toBe("borderColor");
    expect(scaleOf("color")).toBe("fgColor");
  });
});

describe("the colour a value is drawn in", () => {
  it("resolves a token path as the library does", () => {
    expect(swatchColor(light, "neutral.muted", "fgColor")).toBe(tokens.light.fgColor.neutral.muted);
    expect(swatchColor(light, "canvas.inset", "bgColor")).toBe(tokens.light.bgColor.canvas.inset);
  });

  it("is a CSS colour as it is written", () => {
    expect(swatchColor(light, "#ff0000", "fgColor")).toBe("#ff0000");
    expect(swatchColor(light, "rebeccapurple", "fgColor")).toBe("rebeccapurple");
  });

  it("is one shade of a palette family, for the family on its own", () => {
    expect(swatchColor(light, "green", "fgColor", true)).toBe(tokens.light.display.green["7"]);
    // Typed as a colour, `green` is the CSS name.
    expect(swatchColor(light, "green", "fgColor")).toBe("green");
  });

  it("has none for what is no colour: none, a keyword, a variable the page defines", () => {
    expect(swatchColor(light, "none", "fgColor")).toBeNull();
    expect(swatchColor(light, "inherit", "fgColor")).toBeNull();
    expect(swatchColor(light, "var(--brand)", "fgColor")).toBeNull();
  });
});

describe("a choice of colours", () => {
  it("is a prop named for colour whose values mostly are: Highlight's color and Pill's shade, not a size", () => {
    expect(isColorEnum("color", ["none", "neutral", "green", "purple", "blue", "yellow", "red", "orange", "lime"], light)).toBe(true);
    expect(isColorEnum("shade", ["gray", "green", "purple", "indigo", "blue"], light)).toBe(true);
    expect(isColorEnum("size", ["sm", "md", "lg"], light)).toBe(false);
    expect(isColorEnum("variant", ["primary", "ghost"], light)).toBe(false);
  });
});

describe("values as swatches", () => {
  it("are grouped by the family of the token path, and leave out what has no colour", () => {
    const groups = swatchGroups(light, ["neutral.default", "neutral.muted", "danger.strong", "none", "var(--x)", "#fff"], "fgColor");
    expect(groups.map((g) => g.label)).toEqual(["neutral", "danger", "Colours"]);
    expect(groups[0].swatches.map((s) => s.value)).toEqual(["neutral.default", "neutral.muted"]);
    expect(groups[2].swatches.map((s) => s.value)).toEqual(["#fff"]);
  });

  it("know a set is colours by its name, or by what is in it", () => {
    expect(isColorSet("FgColor", ["x"], light, "fgColor")).toBe(true);
    expect(isColorSet("SizeScale", ["1x", "2x"], light, "fgColor")).toBe(false);
    expect(isColorSet("values", ["green", "red", "blue"], light, "fgColor")).toBe(true);
  });
});
