import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { contrastRatio } from "./contrast";

// The semantic foreground colours that are meant for text (the `strong` step of each family, and the neutrals that carry copy) are
// checked against the canvas in both modes (WCAG AA: 4.5:1). `subtle` and `muted` of a family are decoration, not text, and are exempt.
const AA = 4.5;

describe.each(["light", "dark"] as const)("foreground text colours on the canvas, %s", (mode) => {
  const t = tokens[mode];
  const text: [string, string][] = [
    ["neutral.contrast", t.fgColor.neutral.contrast],
    ["neutral.default", t.fgColor.neutral.default],
    ["neutral.muted", t.fgColor.neutral.muted],
    ["informational.strong", t.fgColor.informational.strong],
    ["success.strong", t.fgColor.success.strong],
    ["alert.strong", t.fgColor.alert.strong],
    ["warning.strong", t.fgColor.warning.strong],
    ["danger.strong", t.fgColor.danger.strong],
  ];

  it.each(text)("%s is at least 4.5:1", (_name, fg) => {
    expect(contrastRatio(fg, t.bgColor.canvas.default)).toBeGreaterThanOrEqual(AA);
  });
});
