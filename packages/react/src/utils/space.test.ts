import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { resolveSize, resolveSpace, resolveSpaceValue } from "./space";

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

describe("resolveSize", () => {
  it("resolves a step of the Nx scale, including the large ones a width needs", () => {
    expect(resolveSize(t, "1x")).toBe(t.size["8"]);
    expect(resolveSize(t, "20x")).toBe(t.size["160"]);
    expect(resolveSize(t, "0.125x")).toBe(t.size["1"]);
  });

  it("passes anything else through as written: percentages, keywords, functions, absolute lengths", () => {
    expect(resolveSize(t, "100%")).toBe("100%");
    expect(resolveSize(t, "auto")).toBe("auto");
    expect(resolveSize(t, "fit-content")).toBe("fit-content");
    expect(resolveSize(t, "min(90vw, 56rem)")).toBe("min(90vw, 56rem)");
    expect(resolveSize(t, "320px")).toBe("320px");
  });

  it("throws, naming the value, for something shaped like a step that is not one", () => {
    expect(() => resolveSize(t, "0.3x")).toThrow(/Unknown spacing value "0.3x"/);
  });
});

describe("resolveSpaceValue", () => {
  it("resolves tokens (the ladder and the Nx scale) and 0", () => {
    expect(resolveSpaceValue(t, "sm")).toBe(t.space.sm);
    expect(resolveSpaceValue(t, "1.5x")).toBe(t.size["12"]);
    expect(resolveSpaceValue(t, 0)).toBe("0");
  });

  it("passes a raw CSS length through as written: px, rem, em, %, viewport units, negatives, functions", () => {
    for (const raw of ["0", "8px 16px", "0 auto", "0 0 8px 8px", "12px", "0.75rem", "1.5em", "50%", "10vh", "-4px", ".5rem", "calc(100% - 2rem)", "var(--gutter)", "min(10px, 2vw)", "clamp(1rem, 2vw, 2rem)"]) {
      expect(resolveSpaceValue(t, raw as never)).toBe(raw);
    }
  });

  it("still throws for a typo: an unknown name, a bare number, a unit-less string, an off-scale step", () => {
    for (const bad of ["huge", "12", "12 px", "px", "0.3x"]) {
      expect(() => resolveSpaceValue(t, bad as never)).toThrow(/Unknown spacing value/);
    }
  });
});
