import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HIGHLIGHT_GROUPS, HIGHLIGHT_LABELS, HIGHLIGHT_NAMES, TEXT_COLOR_GROUPS, highlightVars, isHighlightName, isTextColor, textColorVar } from "./palette";

// The names must resolve in the built theme, or a colour would silently be no colour.
const theme = readFileSync(resolve(__dirname, "../../../primitives/dist/css/theme.css"), "utf8");
const variableOf = (css: string) => /var\((--[\w-]+)\)/.exec(css)![1];

describe("palette", () => {
  it("turns a colour name into a Cuboid variable", () => {
    expect(textColorVar("danger.strong")).toBe("var(--cube-fgColor-danger-strong)");
    expect(highlightVars("yellow")).toEqual({ background: "var(--cube-highlight-yellow-bgColor)", color: "var(--cube-highlight-yellow-fgColor)" });
  });

  it("only uses variables the theme defines", () => {
    const used = [
      ...TEXT_COLOR_GROUPS.flatMap((g) => g.colors.map((c) => variableOf(c.color))),
      ...HIGHLIGHT_GROUPS.flatMap((g) => g.colors.flatMap((c) => [variableOf(highlightVars(c.value).background), variableOf(highlightVars(c.value).color)])),
    ];
    const missing = used.filter((name) => !theme.includes(`${name}:`));
    expect(missing).toEqual([]);
  });

  it("accepts only names it lists", () => {
    expect(isTextColor("danger.strong")).toBe(true);
    expect(isTextColor("red")).toBe(false);
    expect(isTextColor("url(javascript:alert(1))")).toBe(false);
    expect(isHighlightName("lime")).toBe(true);
    expect(isHighlightName("pink")).toBe(false);
  });

  it("gives every colour a distinct value", () => {
    const values = TEXT_COLOR_GROUPS.flatMap((g) => g.colors.map((c) => c.value));
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("the highlight palette", () => {
  it("offers the portfolio's twelve, in the order its grid shows them, two rows of six", () => {
    expect([...HIGHLIGHT_NAMES]).toEqual(["neutral", "gray", "blue", "teal", "green", "yellowSoft", "yellow", "orange", "red", "magenta", "purple", "lime"]);
    expect(HIGHLIGHT_NAMES).toHaveLength(12);
    expect(HIGHLIGHT_NAMES.every((name) => HIGHLIGHT_LABELS[name])).toBe(true);
  });

  it("has the portfolio's pale and strong yellow under their own names", () => {
    expect(HIGHLIGHT_LABELS.yellowSoft).toBe("Yellow");
    expect(HIGHLIGHT_LABELS.yellow).toBe("Yellow (strong)");
  });

  // The values the portfolio draws (its editor-colors.css), which the theme must give for a migrated page to look as it did.
  it.each([
    ["neutral", "#f4f4f2"],
    ["gray", "#efeeea"],
    ["blue", "#e1eafb"],
    ["teal", "#d4f0f5"],
    ["green", "#dbf8d8"],
    ["yellowSoft", "#fff3b0"],
    ["yellow", "#ffe100"],
    ["orange", "#fee8d8"],
    ["red", "#ffd9d5"],
    ["magenta", "#fce4f3"],
    ["purple", "#eeddff"],
    ["lime", "#cbff00"],
  ])("draws %s as the portfolio does (%s)", (name, hex) => {
    const light = theme.slice(0, theme.indexOf('data-mode="dark"') > 0 ? theme.indexOf('data-mode="dark"') : undefined);
    const resolve = (variable: string): string => {
      const value = new RegExp(`${variable}:\\s*([^;]+);`).exec(light)?.[1].trim() ?? "";
      const next = /^var\((--[\w-]+)\)$/.exec(value);
      return next ? resolve(next[1]) : value;
    };
    expect(resolve(`--cube-highlight-${name}-bgColor`).toLowerCase()).toBe(hex);
  });

  it("has a dark-mode value for every highlight, so none is a light patch on a dark page", () => {
    const dark = theme.slice(theme.indexOf('data-mode="dark"'));
    for (const name of ["teal", "magenta", "yellowSoft"]) expect(dark, name).toMatch(new RegExp(`--cube-display-highlight-${name}:`));
  });
});
