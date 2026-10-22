import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { resolveSpace } from "./space";

const t = tokens.light;

describe("resolveSpace", () => {
  it("resolves the semantic ladder from tokens.space", () => {
    expect(resolveSpace(t, "xxs")).toBe(t.space.xxs);
    expect(resolveSpace(t, "md")).toBe(t.space.md);
    expect(resolveSpace(t, "xxl")).toBe(t.space.xxl);
  });

  it("resolves the Nx scale (1x = 8px) from the px-keyed size tokens", () => {
    expect(resolveSpace(t, "1x")).toBe(t.size["8"]);
    expect(resolveSpace(t, "1.5x")).toBe(t.size["12"]);
    expect(resolveSpace(t, "0.5x")).toBe(t.size["4"]);
    expect(resolveSpace(t, "0.125x")).toBe(t.size["1"]);
    expect(resolveSpace(t, "7x")).toBe(t.size["56"]);
  });

  it("an Nx value and the semantic name for the same pixels resolve to the same length", () => {
    expect(resolveSpace(t, "1.5x")).toBe(resolveSpace(t, "sm")); // sm is 12px
    expect(resolveSpace(t, "2x")).toBe(resolveSpace(t, "md")); // md is 16px
  });

  it("throws, naming the value, for a value that is not in the scale", () => {
    expect(() => resolveSpace(t, "0.3x" as never)).toThrow(/Unknown spacing value "0.3x"/);
  });
});
