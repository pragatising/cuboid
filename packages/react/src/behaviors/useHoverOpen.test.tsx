import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHoverOpen } from "./useHoverOpen";
import type { HoverOpenOptions } from "./useHoverOpen";

function Harness(options: HoverOpenOptions) {
  const { open, onOpenChange, triggerProps } = useHoverOpen(options);
  return (
    <>
      <button data-testid="trigger" data-open={open} {...triggerProps}>
        trigger
      </button>
      <button onClick={() => onOpenChange(false)}>dismiss</button>
    </>
  );
}

const trigger = () => screen.getByTestId("trigger");
const isOpen = () => trigger().getAttribute("data-open") === "true";
const enter = () => fireEvent.pointerEnter(trigger(), { pointerType: "mouse" });
const leave = () => fireEvent.pointerLeave(trigger(), { pointerType: "mouse" });

describe("useHoverOpen", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens when the pointer has rested for the delay, not before", () => {
    render(<Harness delay={400} />);
    enter();
    act(() => void vi.advanceTimersByTime(399));
    expect(isOpen()).toBe(false);
    act(() => void vi.advanceTimersByTime(1));
    expect(isOpen()).toBe(true);
  });

  it("opens nothing for a pointer that passes through", () => {
    render(<Harness delay={400} />);
    enter();
    act(() => void vi.advanceTimersByTime(200));
    leave();
    act(() => void vi.advanceTimersByTime(1000));
    expect(isOpen()).toBe(false);
  });

  it("closes when the pointer leaves a hover-opened layer", () => {
    render(<Harness />);
    enter();
    act(() => void vi.advanceTimersByTime(400));
    leave();
    expect(isOpen()).toBe(false);
  });

  it("a click opens at once and pins: leaving does not close it, a second click does", () => {
    render(<Harness />);
    fireEvent.click(trigger());
    expect(isOpen()).toBe(true);
    leave();
    expect(isOpen()).toBe(true);
    fireEvent.click(trigger());
    expect(isOpen()).toBe(false);
  });

  it("a click while hover-open pins it", () => {
    render(<Harness />);
    enter();
    act(() => void vi.advanceTimersByTime(400));
    fireEvent.click(trigger());
    leave();
    expect(isOpen()).toBe(true);
  });

  it("keyboard focus opens and pins; blur closes", () => {
    render(<Harness />);
    act(() => trigger().focus());
    expect(isOpen()).toBe(true);
    leave();
    expect(isOpen()).toBe(true);
    act(() => trigger().blur());
    expect(isOpen()).toBe(false);
  });

  it("a layer's own dismissal (Escape, a press outside) closes it", () => {
    render(<Harness />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByText("dismiss"));
    expect(isOpen()).toBe(false);
  });

  it("a touch tap pins at once, and touch hover opens nothing", () => {
    render(<Harness />);
    fireEvent.pointerEnter(trigger(), { pointerType: "touch" });
    act(() => void vi.advanceTimersByTime(1000));
    expect(isOpen()).toBe(false);
    fireEvent.click(trigger());
    expect(isOpen()).toBe(true);
  });

  it("does nothing when disabled, and closes if it becomes disabled while open", () => {
    const { rerender } = render(<Harness enabled={false} />);
    enter();
    fireEvent.click(trigger());
    act(() => void vi.advanceTimersByTime(1000));
    expect(isOpen()).toBe(false);
    rerender(<Harness enabled />);
    fireEvent.click(trigger());
    expect(isOpen()).toBe(true);
    rerender(<Harness enabled={false} />);
    expect(isOpen()).toBe(false);
  });

  it("has no timer left when it unmounts", () => {
    const { unmount } = render(<Harness />);
    enter();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("useHoverOpen with a real user", () => {
  it("a click, which focuses first, opens it and leaves it open; the next click closes it", async () => {
    render(<Harness />);
    await userEvent.click(trigger());
    expect(isOpen()).toBe(true);
    await userEvent.click(trigger());
    expect(isOpen()).toBe(false);
  });

  it("opens from the keyboard", async () => {
    render(<Harness />);
    await userEvent.tab();
    expect(isOpen()).toBe(true);
  });
});
