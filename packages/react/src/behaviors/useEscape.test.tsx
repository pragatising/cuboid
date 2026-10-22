import { fireEvent, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEscape } from "./useEscape";

const press = (init: KeyboardEventInit = {}) => fireEvent.keyDown(document, { key: "Escape", ...init });

describe("useEscape", () => {
  it("calls the handler on Escape, and only on Escape", () => {
    const handler = vi.fn();
    renderHook(() => useEscape(handler));
    fireEvent.keyDown(document, { key: "Enter" });
    expect(handler).not.toHaveBeenCalled();
    press();
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does nothing while disabled, and starts when enabled", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(({ on }) => useEscape(handler, on), { initialProps: { on: false } });
    press();
    expect(handler).not.toHaveBeenCalled();
    rerender({ on: true });
    press();
    expect(handler).toHaveBeenCalledOnce();
  });

  it("calls the latest handler without re-subscribing", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ h }) => useEscape(h), { initialProps: { h: first } });
    rerender({ h: second });
    press();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("only the most recently enabled listener answers, so Escape peels one layer at a time", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const { unmount: unmountOuter } = renderHook(() => useEscape(outer));
    const { unmount: unmountInner } = renderHook(() => useEscape(inner));
    press();
    expect(inner).toHaveBeenCalledOnce();
    expect(outer).not.toHaveBeenCalled();
    unmountInner();
    press();
    expect(outer).toHaveBeenCalledOnce();
    unmountOuter();
  });

  it("a listener enabled later goes on top, even if it was mounted first", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ on }) => useEscape(first, on), { initialProps: { on: false } });
    renderHook(() => useEscape(second));
    rerender({ on: true });
    press();
    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
  });

  it("ignores a keydown something already handled", () => {
    const handler = vi.fn();
    renderHook(() => useEscape(handler));
    const event = new KeyboardEvent("keydown", { key: "Escape", cancelable: true, bubbles: true });
    event.preventDefault();
    document.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores Escape pressed to cancel an IME composition", () => {
    const handler = vi.fn();
    renderHook(() => useEscape(handler));
    press({ isComposing: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("stops listening on unmount", () => {
    const handler = vi.fn();
    const { unmount } = render(<Probe handler={handler} />);
    unmount();
    press();
    expect(handler).not.toHaveBeenCalled();
  });
});

function Probe({ handler }: { handler: () => void }) {
  useEscape(handler);
  return null;
}
