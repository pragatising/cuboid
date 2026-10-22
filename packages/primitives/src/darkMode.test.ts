import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Color from "colorjs.io";
import { build } from "./build.ts";

/**
 * Quality gates for cuboid's own dark mode, against a real build. The dark
 * palette is contrast-matched to light by scripts/generators/generate-dark-palette.mjs,
 * so these tests lock that property in (a regenerated or hand-edited palette
 * that breaks readability fails here) and cover the tokens that no palette
 * swap can fix: white-on-fill backgrounds, scrims, hard-coded colours.
 */

type Tree = { [key: string]: Tree | string };
type Tokens = { light: Tree; dark: Tree };

const get = (tree: Tree, dotted: string): string => dotted.split(".").reduce<Tree | string>((node, key) => (node as Tree)[key], tree) as string;
const ratio = (a: string, b: string) => Color.contrast(new Color(a), new Color(b), "WCAG21");
const leaves = (tree: Tree, prefix = ""): [string, string][] =>
  Object.entries(tree).flatMap(([k, v]) => (typeof v === "object" ? leaves(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v] as [string, string]]));

let work: string;
let t: Tokens;

before(async () => {
  work = await mkdtemp(path.join(tmpdir(), "cuboid-dark-test-"));
  await build({ outDir: work, silent: true });
  t = (await import(path.join(work, "js", "tokens.js"))).default;
});
after(() => rm(work, { recursive: true, force: true }));

describe("dark mode: palette keeps light mode's contrast roles", () => {
  it("every foreground colour has at least light mode's contrast on its own canvas (small tolerance)", () => {
    const lightCanvas = get(t.light, "bgColor.canvas.default");
    const darkCanvas = get(t.dark, "bgColor.canvas.default");
    const tooWeak: string[] = [];
    for (const [key, lightValue] of leaves(t.light.fgColor as Tree)) {
      if (!/^#[0-9a-f]{6}$/i.test(lightValue)) continue; // skip alpha / non-opaque values
      const darkValue = get(t.dark.fgColor as Tree, key);
      if (!/^#[0-9a-f]{6}$/i.test(darkValue)) continue;
      if (ratio(darkValue, darkCanvas) < ratio(lightValue, lightCanvas) - 0.15) tooWeak.push(`fgColor.${key}`);
    }
    assert.deepEqual(tooWeak, []);
  });

  it("body text clears WCAG AA and strong text clears AAA on the dark canvas", () => {
    const canvas = get(t.dark, "bgColor.canvas.default");
    assert.ok(ratio(get(t.dark, "fgColor.neutral.default"), canvas) >= 4.5);
    assert.ok(ratio(get(t.dark, "fgColor.neutral.contrast"), canvas) >= 7);
    assert.ok(ratio(get(t.dark, "fgColor.link.default"), canvas) >= 4.5);
  });

  it("the dark canvas really is dark and inverted surfaces really are light", () => {
    assert.ok(new Color(get(t.dark, "bgColor.canvas.default")).oklch.l < 0.3);
    assert.ok(new Color(get(t.dark, "bgColor.neutral.inverted.1")).oklch.l > 0.9);
  });
});

describe("dark mode: tokens a palette swap cannot fix", () => {
  const strong = ["informational", "debug", "notice", "success", "danger", "critical", "alert", "error", "warning"];

  for (const name of strong) {
    it(`bgColor.${name}.strong keeps white text readable (>= 4.5)`, () => {
      assert.ok(ratio("#ffffff", get(t.dark, `bgColor.${name}.strong`)) >= 4.5);
    });
  }

  it("the modal scrim darkens the page (black, not light gray) and translucent borders lighten it", () => {
    const blanket = get(t.dark, "bgColor.canvas.overlay.blanket"); // #rrggbbaa
    assert.match(blanket, /^#000000[4-9a-f][0-9a-f]$/i);
    assert.ok(new Color(get(t.dark, "borderColor.translucent.3").slice(0, 7)).oklch.l > 0.9);
  });

  it("hard-coded syntax colours stay readable on the dark canvas", () => {
    const canvas = get(t.dark, "bgColor.canvas.default");
    for (const key of ["syntax.typescript.bracket", "syntax.typescript.constantOtherReferenceLink", "syntax.json.bracket"]) {
      assert.ok(ratio(get(t.dark, key), canvas) >= 4.5, key);
    }
  });

  it("every highlight keeps its text readable in both modes and is visible against the page", () => {
    const canvas = get(t.dark, "bgColor.canvas.default");
    for (const name of ["neutral", "green", "blue", "yellow", "orange", "red", "lime", "purple"]) {
      for (const mode of ["light", "dark"] as const) {
        const bg = get(t[mode], `highlight.${name}.bgColor`);
        const fg = get(t[mode], `highlight.${name}.fgColor`);
        assert.ok(ratio(fg, bg) >= 4.5, `${mode} highlight.${name} text`);
      }
      // As visible against the page as light mode's own highlight is (neutral is a faint tint in both).
      const lightVisibility = ratio(get(t.light, `highlight.${name}.bgColor`), get(t.light, "bgColor.canvas.default"));
      assert.ok(ratio(get(t.dark, `highlight.${name}.bgColor`), canvas) >= Math.min(1.3, lightVisibility - 0.15), `dark highlight.${name} vs page`);
    }
  });

  it("filled buttons keep their text as readable on the fill as light mode does, for every enabled state", () => {
    // Parity, not an absolute bar: light mode's own danger button is white on #e74646 (~3.9:1), a
    // design-side issue tracked separately. Dark mode must simply not be worse than light.
    const b = (mode: "light" | "dark", variant: string, state: string) => {
      const look = (t[mode].button as unknown as Record<string, Record<string, Record<string, string>>>)[variant];
      return ratio(look.fgColor[state], look.bgColor[state]);
    };
    for (const variant of ["primary", "danger"]) {
      for (const state of ["rest", "hover", "pressed"]) {
        assert.ok(b("dark", variant, state) >= b("light", variant, state) - 0.15, `button.${variant} ${state}: dark text on fill is weaker than light`);
      }
    }
  });
});
