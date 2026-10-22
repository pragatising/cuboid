import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { setMode } from "../../../mode";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { Tooltip } from "./Tooltip";
import classes from "./Tooltip.module.css";

behavesAsComponent({
  Component: Tooltip,
  dataComponent: "Tooltip",
  baseClassName: classes.Root,
  props: { content: "Hint", children: <button type="button">Anchor</button> },
});

const setup = (props: Partial<React.ComponentProps<typeof Tooltip>> = {}) =>
  render(
    <Tooltip content="Hint" showDelay={0} {...props}>
      <button type="button">Anchor</button>
    </Tooltip>,
  );

describe("Tooltip", () => {
  it("is hidden until the anchor is hovered", async () => {
    setup();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await userEvent.hover(screen.getByRole("button"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Hint");
  });

  it("shows on focus and hides on blur", async () => {
    setup();
    act(() => screen.getByRole("button").focus());
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
    act(() => screen.getByRole("button").blur());
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides on Escape", async () => {
    setup();
    await userEvent.hover(screen.getByRole("button"));
    await screen.findByRole("tooltip");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("describes the anchor while open", async () => {
    setup();
    const anchor = screen.getByRole("button");
    expect(anchor).not.toHaveAttribute("aria-describedby");
    await userEvent.hover(anchor);
    const tip = await screen.findByRole("tooltip");
    expect(anchor).toHaveAttribute("aria-describedby", tip.id);
  });

  it("styles the panel from the tooltip tokens", async () => {
    setup();
    await userEvent.hover(screen.getByRole("button"));
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveStyle({
      color: tokens.light.tooltip.color.foreground,
      backgroundColor: tokens.light.tooltip.color.background,
    });
    expect(tip.style.borderRadius).toBe(tokens.light.tooltip.sizes.borderRadius);
    expect(tip.style.maxWidth).toBe(tokens.light.tooltip.sizes.maxWidth);
    expect(tip.style.zIndex).toBe(String(tokens.light.zIndex.tooltip));
  });

  it("uses the narrow single-line width when compact", async () => {
    setup({ compact: true });
    await userEvent.hover(screen.getByRole("button"));
    expect((await screen.findByRole("tooltip")).style.maxWidth).toBe(tokens.light.tooltip.sizes.maxWidthSingleLine);
  });

  it("uses the dark tokens in dark mode", async () => {
    act(() => setMode("dark"));
    setup();
    await userEvent.hover(screen.getByRole("button"));
    expect(await screen.findByRole("tooltip")).toHaveStyle({ backgroundColor: tokens.dark.tooltip.color.background });
  });

  it("keeps the anchor's own handlers", async () => {
    let hovered = false;
    render(
      <Tooltip content="Hint" showDelay={0}>
        <button type="button" onMouseEnter={() => (hovered = true)}>Anchor</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole("button"));
    expect(hovered).toBe(true);
  });

  it("has no axe violations while open", async () => {
    const { container } = setup();
    await userEvent.hover(screen.getByRole("button"));
    await expectNoAxeViolations(await screen.findByRole("tooltip"));
    await expectNoAxeViolations(container);
  });
});
