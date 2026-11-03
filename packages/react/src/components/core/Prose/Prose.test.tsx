import { render, screen } from "@testing-library/react";
import tokens from "@sragatiping/cuboid-primitives";
import { describe, expect, it } from "vitest";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { cubeVariablesRead, readSource, resolveVariable, themeVariables } from "../../../test/themeCss";
import { Prose } from "./Prose";
import classes from "./Prose.module.css";

behavesAsComponent({ Component: Prose, dataComponent: "Prose", baseClassName: classes.Prose });

describe("Prose", () => {
  it("renders its children as they are: it adds no elements around them", () => {
    render(
      <Prose>
        <h1>Title</h1>
        <p>Body</p>
      </Prose>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Title");
    expect(screen.getByText("Body").parentElement).toHaveAttribute("data-component", "Prose");
  });

  it("reads only --cube-* variables that exist in the built theme.css, in both modes", () => {
    const read = cubeVariablesRead(readSource("src/components/core/Prose/Prose.module.css"));
    expect(read).toContain("--cube-prose-sizes-blockGap");
    for (const variable of read) {
      expect(themeVariables().light.has(variable), `${variable} (light)`).toBe(true);
      expect(themeVariables().dark.has(variable), `${variable} (dark)`).toBe(true);
    }
  });

  it("takes the inset, the gap between blocks and each heading's extra space from the prose tokens, in both modes", () => {
    const { sizes } = tokens.light.prose;
    for (const mode of ["light", "dark"] as const) {
      expect(resolveVariable("--cube-prose-sizes-inset", mode)).toBe(sizes.inset);
      expect(resolveVariable("--cube-prose-sizes-blockGap", mode)).toBe(sizes.blockGap);
      for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"] as const) expect(resolveVariable(`--cube-prose-sizes-headingInset-${level}`, mode)).toBe(sizes.headingInset[level]);
    }
  });

  it("spaces the children of the root and of a data-prose-flow container the same way, from the container, not from the kind of block", () => {
    const css = readSource("src/components/core/Prose/Prose.module.css");
    expect(css).toMatch(/:where\(\.Prose, \[data-prose-flow\]\) > \* \+ \* \{\s*margin-top: calc\(var\(--cube-prose-sizes-blockGap\) \+ var\(--prose-lead\) \+ var\(--prose-trail\) \+ var\(--prose-extra\)\)/);
    // The inset a text row has as padding, any other block has as margin, before it and after it.
    expect(css).toMatch(/> :where\(:not\(p, h1, h2, h3, h4, h5, h6\)\) \{\s*--prose-lead: var\(--cube-prose-sizes-inset\)/);
    expect(css).toMatch(/> :where\(:not\(p, h1, h2, h3, h4, h5, h6\)\) \+ \* \{\s*--prose-trail: var\(--cube-prose-sizes-inset\)/);
    for (const level of [1, 2, 3, 4, 5, 6]) expect(css).toContain(`> :where(h${level}) { --prose-extra: var(--cube-prose-sizes-headingInset-h${level}); }`);
  });

  it("draws a link as Link's inline variant does: its rest and hover colours, underlined, with the focus ring", () => {
    const css = readSource("src/components/core/Prose/Prose.module.css");
    expect(css).toMatch(/:where\(a\) \{[^}]*color: var\(--cube-link-inline-fgColor-rest\)[^}]*text-decoration: underline/);
    expect(css).toMatch(/:where\(a:hover\) \{\s*color: var\(--cube-link-inline-fgColor-hover\)/);
    expect(css).toMatch(/:where\(a:focus-visible\) \{\s*outline: var\(--cube-focusRing-width\)/);
    for (const mode of ["light", "dark"] as const) {
      expect(resolveVariable("--cube-link-inline-fgColor-hover", mode)).toBe(resolveVariable("--cube-fgColor-link-hover", mode));
    }
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <Prose>
        <h1>Title</h1>
        <p>
          Body with <a href="/x">a link</a> and <code>code</code>
        </p>
        <ul>
          <li>One</li>
        </ul>
      </Prose>,
    );
    await expectNoAxeViolations(container);
  });
});
