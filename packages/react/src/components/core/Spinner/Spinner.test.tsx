import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Spinner } from "./Spinner";
import classes from "./Spinner.module.css";

behavesAsComponent({
  Component: Spinner,
  dataComponent: "Spinner",
  baseClassName: classes.Spinner,
  props: {},
});

describe("Spinner", () => {
  it("is decorative unless it has a label", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("svg")).not.toHaveAttribute("role");
  });

  it("is an image with that name when it has a label", () => {
    const { getByRole } = render(<Spinner label="Saving" />);
    expect(getByRole("img", { name: "Saving" })).not.toHaveAttribute("aria-hidden");
  });

  it("takes its width and height from the size token", () => {
    const { container } = render(<Spinner size="lg" />);
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.style.width).toBe(tokens.light.spinner.size.lg);
    expect(svg.style.height).toBe(tokens.light.spinner.size.lg);
  });

  it("leaves the size to its slot when it has none, so a button's rule is not overridden", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.style.width).toBe("");
    expect(svg).toHaveAttribute("width", "1em");
  });

  it("draws the ring the same thickness at every size", () => {
    const { container } = render(<Spinner size="xs" />);
    for (const shape of container.querySelectorAll("circle, path")) {
      expect(shape).toHaveAttribute("vector-effect", "non-scaling-stroke");
      expect((shape as SVGElement).style.strokeWidth).toBe(tokens.light.borderWidth.thick);
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Spinner label="Loading" />);
    await expectNoAxeViolations(container);
  });
});
