import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import tokens from "@sragatiping/cuboid-primitives";
import { behavesAsComponent, expectNoAxeViolations } from "../../../test/testing";
import { ResizeHandle } from "./ResizeHandle";
import classes from "./ResizeHandle.module.css";

behavesAsComponent({
  Component: ResizeHandle,
  dataComponent: "ResizeHandle",
  baseClassName: classes.ResizeHandle,
  props: { edge: "end", onResizeDelta: () => {} },
});

const drag = (handle: HTMLElement, from: number, to: number, axis: "clientX" | "clientY" = "clientX") => {
  // jsdom has no pointer capture
  handle.setPointerCapture = vi.fn();
  handle.hasPointerCapture = vi.fn(() => true);
  handle.releasePointerCapture = vi.fn();
  fireEvent.pointerDown(handle, { [axis]: from, pointerId: 1 });
  fireEvent.pointerMove(handle, { [axis]: to, pointerId: 1 });
  fireEvent.pointerUp(handle, { pointerId: 1 });
};

describe("ResizeHandle", () => {
  it("is a button named Resize by default", () => {
    render(<ResizeHandle edge="end" onResizeDelta={() => {}} />);
    expect(screen.getByRole("button", { name: "Resize" })).toBeInTheDocument();
  });

  it("takes its hit area from the resizeHandle token: width when vertical, height when horizontal", () => {
    const { rerender } = render(<ResizeHandle edge="end" onResizeDelta={() => {}} />);
    expect(screen.getByRole("button").style.width).toBe(tokens.light.resizeHandle.hitArea);
    rerender(<ResizeHandle edge="bottom" orientation="horizontal" onResizeDelta={() => {}} />);
    expect(screen.getByRole("button").style.height).toBe(tokens.light.resizeHandle.hitArea);
  });

  it("reports the horizontal pointer delta, and start and end of the drag", () => {
    const onResizeDelta = vi.fn();
    const onResizeStart = vi.fn();
    const onResizeEnd = vi.fn();
    render(<ResizeHandle edge="end" onResizeDelta={onResizeDelta} onResizeStart={onResizeStart} onResizeEnd={onResizeEnd} />);
    drag(screen.getByRole("button"), 100, 130);
    expect(onResizeStart).toHaveBeenCalledOnce();
    expect(onResizeDelta).toHaveBeenCalledWith(30);
    expect(onResizeEnd).toHaveBeenCalledOnce();
  });

  it("reports the vertical delta when horizontal", () => {
    const onResizeDelta = vi.fn();
    render(<ResizeHandle edge="top" orientation="horizontal" onResizeDelta={onResizeDelta} />);
    drag(screen.getByRole("button"), 50, 20, "clientY");
    expect(onResizeDelta).toHaveBeenCalledWith(-30);
  });

  it("ignores pointer moves when not dragging", () => {
    const onResizeDelta = vi.fn();
    render(<ResizeHandle edge="end" onResizeDelta={onResizeDelta} />);
    fireEvent.pointerMove(screen.getByRole("button"), { clientX: 10, pointerId: 1 });
    expect(onResizeDelta).not.toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ResizeHandle edge="end" onResizeDelta={() => {}} />);
    await expectNoAxeViolations(container);
  });
});
