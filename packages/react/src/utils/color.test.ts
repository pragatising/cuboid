import { describe, expect, it } from "vitest";
import { hexToHsv, hsvToHex, normalizeHex } from "./color";

describe("normalizeHex", () => {
  it("takes three or six digits, with or without #, in any case", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("ff8800")).toBe("#ff8800");
    expect(normalizeHex(" #FF8800 ")).toBe("#ff8800");
  });
  it("rejects what is not a hex colour", () => {
    for (const bad of ["", "#12", "#12345", "#gggggg", "red", "rgb(0,0,0)"]) expect(normalizeHex(bad)).toBeUndefined();
  });
});

describe("hex and HSV", () => {
  it.each(["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#1c60d4", "#c85700", "#4a9a35"])("round-trips %s", (hex) => {
    expect(hsvToHex(hexToHsv(hex)!)).toBe(hex);
  });
  it("reads the primaries as their hue", () => {
    expect(hexToHsv("#ff0000")).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv("#00ff00")!.h).toBe(120);
    expect(hexToHsv("#0000ff")!.h).toBe(240);
  });
  it("has no hue to speak of for a grey, and no saturation for black", () => {
    expect(hexToHsv("#808080")!.s).toBe(0);
    expect(hexToHsv("#000000")).toEqual({ h: 0, s: 0, v: 0 });
  });
});
