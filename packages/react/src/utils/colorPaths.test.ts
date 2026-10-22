import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { isCssColor, resolveBorderValue, resolveColorPath, resolveColorValue } from "./colorPaths";

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

describe("resolveColorValue", () => {
  it("a token path resolves to its value, in whichever mode", () => {
    expect(resolveColorValue(tokens.light.bgColor, "canvas.inset")).toBe(tokens.light.bgColor.canvas.inset);
    expect(resolveColorValue(tokens.dark.bgColor, "canvas.inset")).toBe(tokens.dark.bgColor.canvas.inset);
  });

  it("any CSS colour passes through as written", () => {
    for (const raw of ["transparent", "currentColor", "CurrentColor", "inherit", "red", "RebeccaPurple", "#fff", "#FFFF", "#e2e1dd", "#e2e1dd80", "rgb(0 0 0 / 50%)", "rgba(0,0,0,.5)", "hsl(10 20% 30%)", "oklch(60% 0.1 200)", "var(--x)", "light-dark(#fff, #000)"]) {
      expect(resolveColorValue(tokens.light.fgColor, raw)).toBe(raw);
    }
  });

  it("throws, naming the value, for something that is neither a token nor a CSS colour", () => {
    for (const bad of ["neutral.nope", "canvs", "#12", "#gggggg", "rgb", "not-a-colour", ""]) {
      expect(() => resolveColorValue(tokens.light.fgColor, bad)).toThrow(/Unknown colour/);
    }
  });

  it("isCssColor is true only for CSS colours", () => {
    expect(isCssColor("red")).toBe(true);
    expect(isCssColor("#abc")).toBe(true);
    expect(isCssColor("neutral.muted")).toBe(false);
  });
});

describe("resolveBorderValue", () => {
  it("a token resolves to its shorthand, and a raw CSS border passes through", () => {
    expect(resolveBorderValue(tokens.light.border, "subtle")).toBe(tokens.light.border.subtle);
    for (const raw of ["1px solid red", "2px dashed #fff", "none", "0", "inherit", "0.0625rem solid var(--c)", "3px double rgb(0 0 0)"]) {
      expect(resolveBorderValue(tokens.light.border, raw)).toBe(raw);
    }
  });

  it("throws for something that is neither", () => {
    expect(() => resolveBorderValue(tokens.light.border, "nope")).toThrow(/Unknown border "nope"/);
    expect(() => resolveBorderValue(tokens.light.border, "1px red")).toThrow(/Unknown border/);
  });
});
