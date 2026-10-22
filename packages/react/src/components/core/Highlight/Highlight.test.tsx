import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations, renderInMode } from "../../../test/testing";
import { Highlight } from "./Highlight";
import classes from "./Highlight.module.css";

behavesAsComponent({ Component: Highlight, dataComponent: "Highlight", baseClassName: classes.Highlight, props: { children: "text" } });

describe("Highlight", () => {
  it("is a mark element", () => {
    const { container } = render(<Highlight>text</Highlight>);
    expect(container.querySelector("mark")).toHaveTextContent("text");
  });

  it("is yellow by default", () => {
    const { container } = render(<Highlight>text</Highlight>);
    expect(container.querySelector("mark")).toHaveStyle({
      backgroundColor: tokens.light.highlight.yellow.bgColor,
      color: tokens.light.highlight.yellow.fgColor,
    });
  });

  it("uses the chosen colour's tokens", () => {
    const { container } = render(<Highlight color="blue">text</Highlight>);
    expect(container.querySelector("mark")).toHaveStyle({ backgroundColor: tokens.light.highlight.blue.bgColor });
  });

  it("takes padding and radius from the highlight tokens", () => {
    const { container } = render(<Highlight>text</Highlight>);
    const el = container.querySelector("mark") as HTMLElement;
    expect(el.style.paddingInline).toBe(tokens.light.highlight.paddingInline);
    expect(el.style.borderRadius).toBe(tokens.light.highlight.borderRadius);
  });

  it("lets the consumer's style override the token styles", () => {
    const { container } = render(<Highlight style={{ backgroundColor: "#ff0000" }}>text</Highlight>);
    expect(container.querySelector("mark")).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("uses the dark tokens in dark mode", () => {
    const { container } = renderInMode(<Highlight>text</Highlight>, "dark");
    expect(container.querySelector("mark")).toHaveStyle({ backgroundColor: tokens.dark.highlight.yellow.bgColor });
  });

  it("re-renders with the new mode's tokens when the mode changes while mounted", () => {
    const { container } = render(<Highlight>text</Highlight>);
    act(() => setMode("dark"));
    expect(container.querySelector("mark")).toHaveStyle({ backgroundColor: tokens.dark.highlight.yellow.bgColor });
  });

  it("has no axe violations", async () => {
    const { container } = render(<Highlight>text</Highlight>);
    await expectNoAxeViolations(container);
  });
});
