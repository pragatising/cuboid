import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { contrastRatio } from "../../../test/contrast";

// jsdom cannot compute colour contrast, so the text colours the form controls and their rows use are checked against the
// surface each sits on, in both modes (WCAG AA: 4.5:1 for text). Disabled text is exempt and not listed.
const AA = 4.5;

describe.each(["light", "dark"] as const)("form-control text contrast, %s", (mode) => {
  const t = tokens[mode];
  const pairs: [string, string, string][] = [
    ["field value", t.input.fgColor.rest, t.input.bgColor.rest],
    ["placeholder", t.input.fgColor.placeholder, t.input.bgColor.rest],
    ["read-only value", t.input.fgColor.readOnly, t.input.bgColor.readOnly],
    ["label", t.input.label.fgColor.rest, t.bgColor.canvas.default],
    ["label, hovered or focused", t.input.label.fgColor.active, t.bgColor.canvas.default],
    ["help text", t.input.description.fgColor, t.bgColor.canvas.default],
    ["error message", t.input.error.fgColor, t.bgColor.canvas.default],
    ["menu row", t.actionMenu.item.fgColor.rest, t.actionMenu.item.bgColor.rest],
    ["menu row, hovered", t.actionMenu.item.fgColor.hover, t.actionMenu.item.bgColor.hover],
    ["menu row description", t.actionMenu.item.fgColor.subtext, t.actionMenu.item.bgColor.rest],
    ["menu row description, hovered", t.actionMenu.item.fgColor.subtext, t.actionMenu.item.bgColor.hover],
    ["menu row, chosen", t.actionMenu.item.fgColor.selected, t.actionMenu.item.bgColor.selected.rest],
    ["menu section label", t.actionMenu.section.fgColor, t.actionMenu.item.bgColor.rest],
    ["neutral.subtle text", t.fgColor.neutral.subtle, t.bgColor.canvas.default],
  ];

  it.each(pairs)("%s is at least 4.5:1", (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });
});
