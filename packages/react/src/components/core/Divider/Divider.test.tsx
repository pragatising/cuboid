import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Divider } from "./Divider";
import classes from "./Divider.module.css";

behavesAsComponent({ Component: Divider, dataComponent: "Divider", baseClassName: classes.Divider });

describe("Divider", () => {
  it("is a separator", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("draws the default colour and thickness from the divider tokens", () => {
    render(<Divider />);
    const rule = screen.getByRole("separator");
    expect(rule).toHaveStyle({ backgroundColor: tokens.light.divider.color.default });
    // Inline style, not computed style: jsdom would normalise the rem token to px.
    expect(rule.style.height).toBe(tokens.light.divider.thickness);
  });

  it('draws the muted token for color="muted"', () => {
    render(<Divider color="muted" />);
    expect(screen.getByRole("separator")).toHaveStyle({ backgroundColor: tokens.light.divider.color.muted });
  });

  it("lets the consumer's style override the token styles", () => {
    render(<Divider style={{ height: "4px" }} />);
    expect(screen.getByRole("separator")).toHaveStyle({ height: "4px" });
  });

  it("uses the dark tokens in dark mode", () => {
    renderInMode(<Divider />, "dark");
    expect(screen.getByRole("separator")).toHaveStyle({ backgroundColor: tokens.dark.divider.color.default });
  });

  it("re-renders with the new mode's token when the mode changes while mounted", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toHaveStyle({ backgroundColor: tokens.light.divider.color.default });
    act(() => setMode("dark"));
    expect(screen.getByRole("separator")).toHaveStyle({ backgroundColor: tokens.dark.divider.color.default });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Divider />);
    await expectNoAxeViolations(container);
  });
});
