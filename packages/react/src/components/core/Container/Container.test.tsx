import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Container } from "./Container";
import classes from "./Container.module.css";

behavesAsComponent({ Component: Container, dataComponent: "Container", baseClassName: classes.Container, props: { children: "x" } });

const root = (container: HTMLElement) => container.querySelector('[data-component="Container"]') as HTMLElement;

describe("Container", () => {
  it("is a div by default and renders its children", () => {
    const { container } = render(<Container>Hello</Container>);
    expect(root(container).tagName).toBe("DIV");
    expect(root(container)).toHaveTextContent("Hello");
  });

  it("renders as another element with as", () => {
    const { container } = render(<Container as="main">Hello</Container>);
    expect(root(container).tagName).toBe("MAIN");
  });

  it("is the page width, centred, with the token padding by default", () => {
    const { container } = render(<Container>x</Container>);
    const el = root(container);
    expect(el.style.maxWidth).toBe(tokens.light.container.maxWidth.page);
    expect(el.style.marginInline).toBe("auto");
    expect(el.style.paddingInline).toBe(tokens.light.container.paddingInline);
    expect(el.style.paddingBlock).toBe("0px"); // the container.paddingBlock token is "0"
  });

  it.each(["page", "content", "full"] as const)("takes the %s max width from the container tokens", (width) => {
    const { container } = render(<Container width={width}>x</Container>);
    expect(root(container).style.maxWidth).toBe(tokens.light.container.maxWidth[width]);
  });

  it("does not centre when center is false", () => {
    const { container } = render(<Container center={false}>x</Container>);
    expect(root(container).style.marginInline).toBe("0px");
  });

  it("takes a spacing token for padding, or false for none", () => {
    const { container, rerender } = render(<Container paddingInline="lg" paddingBlock="xs">x</Container>);
    expect(root(container).style.paddingInline).toBe(tokens.light.space.lg);
    expect(root(container).style.paddingBlock).toBe(tokens.light.space.xs);
    rerender(<Container paddingInline={false} paddingBlock={false}>x</Container>);
    expect(root(container).style.paddingInline).toBe("0px");
    expect(root(container).style.paddingBlock).toBe("0px");
  });

  it("fills the screen with minHeight=screen", () => {
    const { container } = render(<Container minHeight="screen">x</Container>);
    expect(root(container).style.minHeight).toBe(tokens.light.container.minHeight.screen);
  });

  it("lets the consumer's style win", () => {
    const { container } = render(<Container style={{ paddingInline: "1px" }}>x</Container>);
    expect(root(container).style.paddingInline).toBe("1px");
  });

  it("is a flex column (it is a Box)", () => {
    const { container } = render(<Container>x</Container>);
    expect(root(container).style.flexDirection).toBe("column");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Container>text</Container>);
    await expectNoAxeViolations(container);
  });
});
