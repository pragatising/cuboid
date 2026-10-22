import { describe, expect, it } from "vitest";
import { lengthToPx } from "./length";

describe("lengthToPx", () => {
  it("converts rem against a 16px root", () => expect(lengthToPx("0.125rem")).toBe(2));
  it("passes px through", () => expect(lengthToPx("6px")).toBe(6));
  it("reads a bare number", () => expect(lengthToPx("4")).toBe(4));
  it("falls back for a non-length", () => expect(lengthToPx("auto", 7)).toBe(7));
});
