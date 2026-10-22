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
