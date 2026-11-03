import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTruncation } from "./useTruncation";
import type { TruncationOptions } from "./useTruncation";

// jsdom has no layout: give the element the sizes a browser would have measured.
function size(element: Element, sizes: { scrollWidth: number; clientWidth: number; scrollHeight?: number; clientHeight?: number }) {
  for (const [key, value] of Object.entries({ scrollHeight: 20, clientHeight: 20, ...sizes })) Object.defineProperty(element, key, { configurable: true, value });
}

let observed: (() => void) | undefined;
const original = globalThis.ResizeObserver;
afterEach(() => {
  globalThis.ResizeObserver = original;
  observed = undefined;
});

function Harness({ content = "text", ...options }: Partial<Omit<TruncationOptions, "ref">>) {
  const ref = useRef<HTMLSpanElement>(null);
  const truncated = useTruncation({ ref, content, ...options });
  return (
    <span ref={ref} data-testid="box" data-truncated={truncated}>
      {content}
    </span>
  );
}

const box = () => screen.getByTestId("box");

describe("useTruncation", () => {
  it("is false where there is no layout (every size is 0)", () => {
    render(<Harness />);
    expect(box()).toHaveAttribute("data-truncated", "false");
  });

  it("is true when the content is wider than its box, and false when it fits", () => {
    const { rerender } = render(<Harness content="a" />);
    size(box(), { scrollWidth: 300, clientWidth: 100 });
    rerender(<Harness content="b" />);
    expect(box()).toHaveAttribute("data-truncated", "true");
    size(box(), { scrollWidth: 100, clientWidth: 100 });
    rerender(<Harness content="c" />);
    expect(box()).toHaveAttribute("data-truncated", "false");
  });

  it("is true when the content is taller than its box (a clamp)", () => {
    const { rerender } = render(<Harness content="a" />);
    size(box(), { scrollWidth: 100, clientWidth: 100, scrollHeight: 60, clientHeight: 40 });
    rerender(<Harness content="b" />);
    expect(box()).toHaveAttribute("data-truncated", "true");
  });

  it("measures again when the element is resized", () => {
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        observed = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    render(<Harness />);
    size(box(), { scrollWidth: 300, clientWidth: 100 });
    act(() => observed?.());
    expect(box()).toHaveAttribute("data-truncated", "true");
    size(box(), { scrollWidth: 100, clientWidth: 400 });
    act(() => observed?.());
    expect(box()).toHaveAttribute("data-truncated", "false");
  });

  it("reports nothing and observes nothing when disabled", () => {
    const observe = vi.fn();
    globalThis.ResizeObserver = class {
      observe = observe;
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    const { rerender } = render(<Harness enabled={false} content="a" />);
    size(box(), { scrollWidth: 300, clientWidth: 100 });
    rerender(<Harness enabled={false} content="b" />);
    expect(box()).toHaveAttribute("data-truncated", "false");
    expect(observe).not.toHaveBeenCalled();
  });
});
