import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Icon } from "./Icon";
import classes from "./Icon.module.css";

behavesAsComponent({
  Component: Icon,
  dataComponent: "Icon",
  baseClassName: classes.Icon,
  props: { name: "account_circle" },
});

const root = (container: HTMLElement) => container.querySelector('[data-component="Icon"]') as HTMLElement;

describe("Icon", () => {
  it("renders the glyph's ligature text", () => {
    const { container } = render(<Icon name="account_circle" />);
    expect(root(container)).toHaveTextContent("account_circle");
  });

  it("is decorative by default", () => {
    const { container } = render(<Icon name="close" />);
    expect(root(container)).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("is an image with an accessible name when given a label", () => {
    render(<Icon name="close" label="Close" />);
    expect(screen.getByRole("img", { name: "Close" })).toBeInTheDocument();
  });

  it("sizes itself from the icon tokens (default sm)", () => {
    const { container } = render(<Icon name="close" />);
    const el = root(container);
    expect(el.style.width).toBe(tokens.light.icon.sm);
    expect(el.style.height).toBe(tokens.light.icon.sm);
    expect(el.style.fontSize).toBe(tokens.light.icon.sm);
  });

  it.each(["xs", "sm", "md", "lg"] as const)("uses the %s icon token", (size) => {
    const { container } = render(<Icon name="close" size={size} />);
    expect(root(container).style.width).toBe(tokens.light.icon[size]);
  });

  it("inherits the ambient colour when no colour is given", () => {
    const { container } = render(<Icon name="close" />);
    expect(root(container).style.color).toBe("");
  });

  it("colours the glyph from an fgColor token path", () => {
    const { container } = render(<Icon name="close" color="success.strong" />);
    expect(root(container)).toHaveStyle({ color: tokens.light.fgColor.success.strong });
  });

  it("uses the dark token in dark mode", () => {
    const { container } = renderInMode(<Icon name="close" color="success.strong" />, "dark");
    expect(root(container)).toHaveStyle({ color: tokens.dark.fgColor.success.strong });
  });

  it("re-renders with the new mode's token when the mode changes while mounted", () => {
    const { container } = render(<Icon name="close" color="success.strong" />);
    expect(root(container)).toHaveStyle({ color: tokens.light.fgColor.success.strong });
    act(() => setMode("dark"));
    expect(root(container)).toHaveStyle({ color: tokens.dark.fgColor.success.strong });
  });

  it("sets the variable-font axes on the glyph, with defaults", () => {
    const { container } = render(<Icon name="close" />);
    expect(container.querySelector("span span")).toHaveStyle({
      fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
    });
  });

  it("lets per-call axes override the defaults", () => {
    const { container } = render(<Icon name="close" weight={600} grade={-25} opticalSize={40} fill />);
    expect(container.querySelector("span span")).toHaveStyle({
      fontVariationSettings: '"FILL" 1, "wght" 600, "GRAD" -25, "opsz" 40',
    });
  });

  it("has no axe violations (decorative and labelled)", async () => {
    const { container } = render(
      <>
        <Icon name="close" />
        <Icon name="close" label="Close" />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
