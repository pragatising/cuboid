import { afterEach, describe, expect, it, vi } from "vitest";
import { lengthToPx } from "./length";

afterEach(() => vi.unstubAllGlobals());

describe("lengthToPx", () => {
  it("converts rem against a 16px root", () => expect(lengthToPx("0.125rem")).toBe(2));
  it("passes px through", () => expect(lengthToPx("6px")).toBe(6));
  it("reads a bare number", () => expect(lengthToPx("4")).toBe(4));
  it("falls back for a non-length", () => expect(lengthToPx("auto", 7)).toBe(7));
  it("falls back for a percentage, which has no pixel value on its own", () => expect(lengthToPx("50%", 9)).toBe(9));

  describe("viewport units and functions (Sheet's min(90vw, 56rem))", () => {
    it("resolves vw and vh against the window", () => {
      vi.stubGlobal("innerWidth", 1000);
      vi.stubGlobal("innerHeight", 500);
      expect(lengthToPx("90vw")).toBe(900);
      expect(lengthToPx("50vh")).toBe(250);
    });

    it("min() takes the smaller, and the window can make either side win", () => {
      vi.stubGlobal("innerWidth", 1000);
      expect(lengthToPx("min(90vw, 56rem)")).toBe(896);
      vi.stubGlobal("innerWidth", 800);
      expect(lengthToPx("min(90vw, 56rem)")).toBe(720);
    });

    it("max() takes the larger", () => {
      vi.stubGlobal("innerWidth", 1000);
      expect(lengthToPx("max(10vw, 20rem)")).toBe(320);
    });

    it("clamp(min, value, max)", () => {
      vi.stubGlobal("innerWidth", 1000);
      expect(lengthToPx("clamp(6.5rem, 25vw, 10rem)")).toBe(160);
      expect(lengthToPx("clamp(6.5rem, 5vw, 10rem)")).toBe(104);
    });

    it("nests", () => {
      vi.stubGlobal("innerWidth", 1000);
      expect(lengthToPx("min(max(5rem, 2vw), 100px)")).toBe(80);
    });

    it("falls back when any part cannot be resolved", () => {
      expect(lengthToPx("min(50%, 10rem)", 3)).toBe(3);
      expect(lengthToPx("calc(100% - 2rem)", 3)).toBe(3);
    });
  });
});
