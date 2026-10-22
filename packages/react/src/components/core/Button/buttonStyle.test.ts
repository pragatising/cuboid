import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { resolveButtonStyle } from "./buttonStyle";

const t = tokens.light;
const style = (o: Parameters<typeof resolveButtonStyle>[1]) => resolveButtonStyle(t, o) as Record<string, string>;

describe("resolveButtonStyle (pure: tokens and options in, style out)", () => {
  it("colours from tokens.button, geometry from size.control, padding from the button.paddingInline token", () => {
    const s = style({ variant: "primary", size: "md" });
    expect(s["--button-bg-rest"]).toBe(t.button.primary.bgColor.rest);
    expect(s["--button-gap"]).toBe(t.size.control.md.gap);
    expect(s["--button-icon-size"]).toBe(t.size.control.md.icon);
    expect(s.height).toBe(t.size.control.md.size);
    expect(s.paddingInline).toBe(t.button.paddingInline.md);
    expect(s.borderRadius).toBe(t.size.control.md.borderRadius);
    expect(s.font).toBe(t.button.font.md);
  });

  it("the rounded variant is a pill", () => {
    expect(style({ variant: "rounded", size: "sm" }).borderRadius).toBe(t.borderRadius.full);
  });

  it("always sets the focus ring, border width and transition", () => {
    const s = style({ variant: "secondary", size: "sm" });
    expect(s["--button-focus-color"]).toBe(t.focusRing.color);
    expect(s["--button-focus-width"]).toBe(t.focusRing.width);
    expect(s["--button-focus-offset"]).toBe(t.focusRing.offset);
    expect(s.borderWidth).toBe(t.borderWidth.thin);
    expect(s.transition).toContain("background-color");
  });

  it("resolves against whichever mode's tokens it is given", () => {
    const dark = resolveButtonStyle(tokens.dark, { variant: "primary", size: "sm" }) as Record<string, string>;
    expect(dark["--button-bg-rest"]).toBe(tokens.dark.button.primary.bgColor.rest);
    expect(dark["--button-bg-rest"]).not.toBe(t.button.primary.bgColor.rest);
  });
});
