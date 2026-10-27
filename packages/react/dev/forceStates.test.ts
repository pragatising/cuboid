import { describe, expect, it } from "vitest";
import postcss from "postcss";
import { forceStates, forceStatesInSelector } from "./forceStates";

describe("forceStatesInSelector", () => {
  it("makes :hover also match data-force=hover, in place", () => {
    expect(forceStatesInSelector(".A:hover")).toBe('.A:is(:hover, [data-force~="hover"])');
  });

  it.each([
    [":active", "press"],
    [":focus-visible", "focus"],
    [":focus-within", "focus"],
  ])("maps %s to %s", (pseudo, name) => {
    expect(forceStatesInSelector(`.A${pseudo}`)).toBe(`.A:is(${pseudo}, [data-force~="${name}"])`);
  });

  it("rewrites every one in a compound, a list, and inside :where() and :not()", () => {
    const out = forceStatesInSelector(':where(.ButtonBase:hover:not(:disabled, [aria-disabled="true"])), .B:focus-visible');
    expect(out).toBe(
      ':where(.ButtonBase:is(:hover, [data-force~="hover"]):not(:disabled, [aria-disabled="true"])), .B:is(:focus-visible, [data-force~="focus"])',
    );
  });

  it("leaves other pseudo-classes, and names that only start the same, alone", () => {
    expect(forceStatesInSelector(".A:disabled, .B:focus, .C:hovered, .D::before, .E:first-child")).toBe(".A:disabled, .B:focus, .C:hovered, .D::before, .E:first-child");
  });

  it("does nothing the second time", () => {
    const once = forceStatesInSelector(".A:hover");
    expect(forceStatesInSelector(once)).toBe(once);
  });

  it("keeps the specificity: :is() takes its most specific argument, and an attribute equals a pseudo-class", () => {
    // (0,2,0) either way: .A plus the pseudo-class or the attribute. Checked by the selector text having no extra class or id.
    expect(forceStatesInSelector(".A:hover")).not.toMatch(/[#.]\w+.*[#.]\w+/);
  });
});

describe("forceStates (PostCSS)", () => {
  const run = async (css: string) => (await postcss([forceStates()]).process(css, { from: undefined })).css;

  it("rewrites rules and leaves declarations and other rules untouched", async () => {
    const out = await run(".A { color: red } .A:hover { color: blue } .A:active, .B:focus-visible { outline: 1px solid }");
    expect(out).toContain(".A { color: red }");
    expect(out).toContain('.A:is(:hover, [data-force~="hover"]) { color: blue }');
    expect(out).toContain('.A:is(:active, [data-force~="press"]), .B:is(:focus-visible, [data-force~="focus"]) { outline: 1px solid }');
  });

  it("does not touch keyframe selectors", async () => {
    const out = await run("@keyframes x { from { opacity: 0 } 50% { opacity: .5 } to { opacity: 1 } }");
    expect(out).toContain("from {");
    expect(out).toContain("50% {");
  });

  it("works inside media queries", async () => {
    expect(await run("@media (min-width: 1px) { .A:hover { color: red } }")).toContain('.A:is(:hover, [data-force~="hover"])');
  });
});
