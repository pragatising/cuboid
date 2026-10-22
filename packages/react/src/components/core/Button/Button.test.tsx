import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Button } from "./Button";
import baseClasses from "./ButtonBase.module.css";

behavesAsComponent({ Component: Button, dataComponent: "Button", baseClassName: baseClasses.ButtonBase, props: { children: "Save" } });

// Button is ButtonBase's labelled button: ButtonBase.test.tsx covers anatomy, sizes, variants and states in depth.
// These check that Button passes everything through under its own name.
describe("Button", () => {
  const button = () => screen.getByRole("button");

  it("is named Button, not ButtonBase", () => {
    render(<Button>Save</Button>);
    expect(button()).toHaveAttribute("data-component", "Button");
  });

  it("defaults to the secondary variant at size sm", () => {
    render(<Button>Save</Button>);
    expect(button()).toHaveAttribute("data-variant", "secondary");
    expect(button()).toHaveAttribute("data-size", "sm");
    expect(button().style.getPropertyValue("--button-bg-rest")).toBe(tokens.light.button.secondary.bgColor.rest);
  });

  it("passes the anatomy, size, variant and state props through", async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" size="lg" block leadingVisual={<svg data-testid="lead" />} onClick={onClick}>
        Save
      </Button>,
    );
    expect(button()).toHaveAttribute("data-variant", "primary");
    expect(button().style.height).toBe(tokens.light.size.control.lg.size);
    expect(button()).toHaveAttribute("data-block");
    expect(screen.getByTestId("lead")).toBeInTheDocument();
    await userEvent.click(button());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports loading, inactive and disabled", () => {
    const { rerender } = render(<Button loading>Save</Button>);
    expect(button()).toHaveAttribute("data-loading");
    rerender(<Button inactive>Save</Button>);
    expect(button()).toHaveAttribute("data-inactive");
    rerender(<Button disabled>Save</Button>);
    expect(button()).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Button variant="primary" leadingVisual={<svg />}>Save</Button>);
    await expectNoAxeViolations(container);
  });
});
