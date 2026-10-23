import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Callout } from "./Callout";
import classes from "./Callout.module.css";

behavesAsComponent({ Component: Callout, dataComponent: "Callout", baseClassName: classes.Callout, props: { children: "note" } });

const root = (container: HTMLElement) => container.querySelector('[data-component="Callout"]') as HTMLElement;

describe("Callout", () => {
  it("renders its children", () => {
    render(<Callout>A note</Callout>);
    expect(screen.getByText("A note")).toBeInTheDocument();
  });

  it("takes surface, padding and radius from the callout tokens", () => {
    const { container } = render(<Callout>note</Callout>);
    const el = root(container);
    expect(el).toHaveStyle({ backgroundColor: tokens.light.callout.bgColor, color: tokens.light.callout.fgColor });
    expect(el.style.borderRadius).toBe(tokens.light.callout.borderRadius);
    expect(el.style.paddingBlock).toBe(tokens.light.callout.paddingBlock);
    expect(el.style.paddingInline).toBe(tokens.light.callout.paddingInline);
  });

  it("uses a bgColor token when given backgroundColor", () => {
    const { container } = render(<Callout backgroundColor="canvas.insetStrong">note</Callout>);
    expect(root(container)).toHaveStyle({ backgroundColor: tokens.light.bgColor.canvas.insetStrong });
  });

  it("backgroundColor and color override the callout look, with a token or any CSS colour", () => {
    const { container } = render(<Callout backgroundColor="#ff0000" color="neutral.default">note</Callout>);
    expect(root(container)).toHaveStyle({ backgroundColor: "#ff0000", color: tokens.light.fgColor.neutral.default });
  });

  it("sets the surface and text from the variant's tokens", () => {
    const callout = tokens.light.callout as unknown as Record<string, unknown>;
    const variants = Object.keys(callout).filter((key) => typeof callout[key] === "object" && callout[key] !== null && "bgColor" in (callout[key] as object));
    for (const variant of variants) {
      const colors = callout[variant] as { bgColor: string; fgColor: string };
      const { container, unmount } = render(<Callout variant={variant as never}>note</Callout>);
      expect(root(container)).toHaveStyle({ backgroundColor: colors.bgColor, color: colors.fgColor });
      expect(root(container)).toHaveAttribute("data-variant", variant);
      unmount();
    }
  });

  it("takes any Box prop", () => {
    const { container } = render(<Callout {...({ marginBlockStart: "8px", maxWidth: "20rem" } as object)}>note</Callout>);
    expect(root(container).style.marginBlockStart).toBe("8px");
    expect(root(container).style.maxWidth).toBe("20rem");
  });

  it("lets the consumer's style override the token styles", () => {
    const { container } = render(<Callout style={{ backgroundColor: "#ff0000" }}>note</Callout>);
    expect(root(container)).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("uses the dark tokens in dark mode", () => {
    const { container } = renderInMode(<Callout>note</Callout>, "dark");
    expect(root(container)).toHaveStyle({ backgroundColor: tokens.dark.callout.bgColor });
  });

  it("re-renders with the new mode's tokens when the mode changes while mounted", () => {
    const { container } = render(<Callout>note</Callout>);
    act(() => setMode("dark"));
    expect(root(container)).toHaveStyle({ backgroundColor: tokens.dark.callout.bgColor });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Callout>note</Callout>);
    await expectNoAxeViolations(container);
  });
});
