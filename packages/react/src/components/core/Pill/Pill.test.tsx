import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Pill } from "./Pill";
import classes from "./Pill.module.css";

behavesAsComponent({ Component: Pill, dataComponent: "Pill", baseClassName: classes.Pill, props: { children: "Label" } });

const root = (container: HTMLElement) => container.querySelector('[data-component="Pill"]') as HTMLElement;

describe("Pill", () => {
  it("renders its label in a span by default", () => {
    const { container } = render(<Pill>Label</Pill>);
    expect(root(container).tagName).toBe("SPAN");
    expect(root(container)).toHaveTextContent("Label");
  });

  it("uses the gray / light / filled recipe by default", () => {
    const { container } = render(<Pill>Label</Pill>);
    const recipe = tokens.light.pill.color.gray.light.filled;
    expect(root(container)).toHaveStyle({ color: recipe.fgColor, backgroundColor: recipe.bgColor });
  });

  it("uses the bordered recipe with bordered", () => {
    const { container } = render(<Pill shade="blue" intensity="bold" bordered>Label</Pill>);
    const recipe = tokens.light.pill.color.blue.bold.bordered;
    expect(root(container)).toHaveStyle({ color: recipe.fgColor, backgroundColor: recipe.bgColor, borderColor: recipe.borderColor });
  });

  it("takes geometry from the pill size tokens", () => {
    const { container } = render(<Pill>Label</Pill>);
    const el = root(container);
    expect(el.style.height).toBe(tokens.light.pill.sizes.height);
    expect(el.style.borderRadius).toBe(tokens.light.pill.sizes.borderRadius);
    expect(el.style.gap).toBe(tokens.light.pill.sizes.gap);
    expect(el.style.paddingBlock).toBe(tokens.light.pill.sizes.paddingBlock);
    expect(el.style.paddingInline).toBe(tokens.light.pill.sizes.paddingInline);
  });

  it.each(["sm", "md", "lg"] as const)("sets the %s text font while keeping the height fixed", (size) => {
    const { container } = render(<Pill size={size}>Label</Pill>);
    expect(root(container).style.height).toBe(tokens.light.pill.sizes.height);
    expect(root(container).style.lineHeight).toBe("1");
  });

  it("renders as an anchor with as=a", () => {
    render(<Pill as="a" href="/x">Label</Pill>);
    expect(screen.getByRole("link", { name: "Label" })).toHaveAttribute("href", "/x");
  });

  it("renders leading and trailing visuals around the label", () => {
    const { container } = render(
      <Pill leadingVisual={<i data-testid="lead" />} trailingVisual={<i data-testid="trail" />}>Label</Pill>,
    );
    expect(container.querySelector('[data-component="Pill.LeadingVisual"]')).toContainElement(screen.getByTestId("lead"));
    expect(container.querySelector('[data-component="Pill.TrailingVisual"]')).toContainElement(screen.getByTestId("trail"));
  });

  it("lets the consumer's style override the token styles", () => {
    const { container } = render(<Pill style={{ height: "40px" }}>Label</Pill>);
    expect(root(container)).toHaveStyle({ height: "40px" });
  });

  it("uses the dark tokens in dark mode", () => {
    const { container } = renderInMode(<Pill>Label</Pill>, "dark");
    expect(root(container)).toHaveStyle({ backgroundColor: tokens.dark.pill.color.gray.light.filled.bgColor });
  });

  it("re-renders with the new mode's tokens when the mode changes while mounted", () => {
    const { container } = render(<Pill>Label</Pill>);
    expect(root(container)).toHaveStyle({ backgroundColor: tokens.light.pill.color.gray.light.filled.bgColor });
    act(() => setMode("dark"));
    expect(root(container)).toHaveStyle({ backgroundColor: tokens.dark.pill.color.gray.light.filled.bgColor });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Pill>Label</Pill>);
    await expectNoAxeViolations(container);
  });

  it("sets the label weight from a fontWeight token, medium by default", () => {
    const { container, rerender } = render(<Pill>Label</Pill>);
    expect(root(container).style.fontWeight).toBe(String(tokens.light.fontWeight.medium));
    rerender(<Pill weight="semibold">Label</Pill>);
    expect(root(container).style.fontWeight).toBe(String(tokens.light.fontWeight.semibold));
  });


  it("takes a palette colour (or any token or CSS colour) for the label, surface and border", () => {
    const { container } = render(<Pill color="indigo.10" backgroundColor="indigo.0" borderColor="indigo.5">Label</Pill>);
    expect(root(container).style.color).not.toBe("");
    expect(root(container)).toHaveStyle({ color: tokens.light.display.indigo[10], backgroundColor: tokens.light.display.indigo[0], borderColor: tokens.light.display.indigo[5] });
  });
});
