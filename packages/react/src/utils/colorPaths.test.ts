import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { resolveColorPath } from "./colorPaths";

describe("resolveColorPath", () => {
  it("resolves two-level and three-level paths in each colour group", () => {
    expect(resolveColorPath(tokens.light.fgColor, "success.strong")).toBe(tokens.light.fgColor.success.strong);
    expect(resolveColorPath(tokens.light.bgColor, "canvas.default")).toBe(tokens.light.bgColor.canvas.default);
    expect(resolveColorPath(tokens.light.bgColor, "neutral.light.2")).toBe(tokens.light.bgColor.neutral.light[2]);
    expect(resolveColorPath(tokens.light.borderColor, "translucent.3")).toBe(tokens.light.borderColor.translucent[3]);
  });

  it("resolves against whichever mode's tree it is given", () => {
    expect(resolveColorPath(tokens.dark.bgColor, "canvas.default")).toBe(tokens.dark.bgColor.canvas.default);
    expect(resolveColorPath(tokens.dark.bgColor, "canvas.default")).not.toBe(resolveColorPath(tokens.light.bgColor, "canvas.default"));
  });

  it("throws, naming the path, for one that is missing or points at a group instead of a colour", () => {
    expect(() => resolveColorPath(tokens.light.fgColor, "success.nope")).toThrow(/Unknown colour token "success.nope"/);
    expect(() => resolveColorPath(tokens.light.fgColor, "success")).toThrow(/Unknown colour token "success"/);
  });
});
