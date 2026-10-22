import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { ResizeHandle } from "./ResizeHandle";
import type { ResizeHandleProps } from "./ResizeHandle";
import classes from "./ResizeHandle.module.css";

const base = { edge: "right", value: 200, min: 100, max: 400, onValueChange: () => {} } as const;

behavesAsComponent({ Component: ResizeHandle, dataComponent: "ResizeHandle", baseClassName: classes.ResizeHandle, props: base });

const handle = () => screen.getByRole("separator");
const capture = () => {
  handle().setPointerCapture = vi.fn();
  handle().hasPointerCapture = vi.fn(() => true);
  handle().releasePointerCapture = vi.fn();
};
const setup = (props: Partial<ResizeHandleProps> = {}) => render(<ResizeHandle {...base} {...props} />);

describe("ResizeHandle: semantics (the WAI-ARIA window splitter)", () => {
  it("is a focusable separator named Resize by default, with its value and range", () => {
    setup();
    expect(screen.getByRole("separator", { name: "Resize" })).toHaveAttribute("tabindex", "0");
    expect(handle()).toHaveAttribute("aria-valuenow", "200");
    expect(handle()).toHaveAttribute("aria-valuemin", "100");
    expect(handle()).toHaveAttribute("aria-valuemax", "400");
  });

  it("takes a consumer's name", () => {
    setup({ "aria-label": "Resize sidebar" });
    expect(screen.getByRole("separator", { name: "Resize sidebar" })).toBeInTheDocument();
  });

  it.each([
    ["left", "vertical"],
    ["right", "vertical"],
    ["top", "horizontal"],
    ["bottom", "horizontal"],
  ] as const)("on the %s edge it is a %s separator", (edge, orientation) => {
    setup({ edge });
    expect(handle()).toHaveAttribute("aria-orientation", orientation);
    expect(handle()).toHaveAttribute("data-edge", edge);
  });

  it("has no axe violations", async () => {
    const { container } = setup({ "aria-label": "Resize sidebar" });
    await expectNoAxeViolations(container);
  });
});

describe("ResizeHandle: geometry comes from the resizeHandle token", () => {
  it("its hit area is the width on a left or right edge, the height on a top or bottom edge", () => {
    const { rerender } = setup({ edge: "right" });
    expect(handle().style.width).toBe(tokens.light.resizeHandle.hitArea);
    rerender(<ResizeHandle {...base} edge="bottom" />);
    expect(handle().style.height).toBe(tokens.light.resizeHandle.hitArea);
  });

  it("straddles the panel's edge, and shows the matching resize cursor", () => {
    const { rerender } = setup({ edge: "right" });
    expect(handle().style.right).toBe("0px");
    expect(handle().style.transform).toBe("translateX(50%)");
    expect(handle().style.cursor).toBe("col-resize");
    rerender(<ResizeHandle {...base} edge="top" />);
    expect(handle().style.top).toBe("0px");
    expect(handle().style.cursor).toBe("row-resize");
  });
});

describe("ResizeHandle: keyboard", () => {
  it("Arrow keys move by step, Shift by five, Home and End to the bounds", async () => {
    const onValueChange = vi.fn();
    setup({ onValueChange, step: 10 });
    handle().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(210);
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onValueChange).toHaveBeenLastCalledWith(250);
    await userEvent.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith(100);
    await userEvent.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith(400);
  });

  it("on a left edge the arrows point the way the panel grows (toward that edge)", async () => {
    const onValueChange = vi.fn();
    setup({ edge: "left", onValueChange, step: 10 });
    handle().focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith(210);
  });

  it("on a bottom edge it uses Up and Down", async () => {
    const onValueChange = vi.fn();
    setup({ edge: "bottom", onValueChange, step: 10 });
    handle().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith(210);
  });
});

describe("ResizeHandle: pointer", () => {
  it("reports the size the drag makes and the start and end of it", () => {
    const onValueChange = vi.fn();
    const onResizeStart = vi.fn();
    const onResizeEnd = vi.fn();
    setup({ onValueChange, onResizeStart, onResizeEnd });
    capture();
    fireEvent.pointerDown(handle(), { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientX: 130, pointerId: 1 });
    fireEvent.pointerUp(handle(), { pointerId: 1 });
    expect(onResizeStart).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenLastCalledWith(230);
    expect(onResizeEnd).toHaveBeenCalledOnce();
  });

  it("a left edge grows as the pointer moves toward it", () => {
    const onValueChange = vi.fn();
    setup({ edge: "left", onValueChange });
    capture();
    fireEvent.pointerDown(handle(), { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientX: 60, pointerId: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(240);
  });

  it("a top edge uses the vertical movement, growing as the pointer goes up", () => {
    const onValueChange = vi.fn();
    setup({ edge: "top", onValueChange });
    capture();
    fireEvent.pointerDown(handle(), { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientY: 70, pointerId: 1 });
    expect(onValueChange).toHaveBeenLastCalledWith(230);
  });

  it("ignores movement when not dragging", () => {
    const onValueChange = vi.fn();
    setup({ onValueChange });
    fireEvent.pointerMove(handle(), { clientX: 10, pointerId: 1 });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("marks itself while dragging", () => {
    setup();
    capture();
    fireEvent.pointerDown(handle(), { clientX: 1, pointerId: 1 });
    expect(handle()).toHaveAttribute("data-dragging");
    fireEvent.pointerUp(handle(), { pointerId: 1 });
    expect(handle()).not.toHaveAttribute("data-dragging");
  });
});
