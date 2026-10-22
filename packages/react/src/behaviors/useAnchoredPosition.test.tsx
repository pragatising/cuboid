import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { computeAnchoredPosition, useAnchoredPosition } from "./useAnchoredPosition";
import type { AnchorPlacement } from "./useAnchoredPosition";

const rect = { top: 100, bottom: 130, left: 200, right: 260, width: 60, height: 30 } as DOMRect;

describe("computeAnchoredPosition", () => {
  const cases: [AnchorPlacement, object][] = [
    ["bottom-start", { top: 134, left: 200 }],
    ["bottom-end", { top: 134, left: 260, transform: "translateX(-100%)" }],
    ["bottom", { top: 134, left: 230, transform: "translateX(-50%)" }],
    ["top-start", { top: 96, left: 200, transform: "translateY(-100%)" }],
    ["top-end", { top: 96, left: 260, transform: "translate(-100%, -100%)" }],
    ["top", { top: 96, left: 230, transform: "translate(-50%, -100%)" }],
    ["left", { top: 115, left: 196, transform: "translate(-100%, -50%)" }],
    ["right", { top: 115, left: 264, transform: "translateY(-50%)" }],
  ];
  it.each(cases)("%s, 4px from the anchor", (placement, expected) => {
    expect(computeAnchoredPosition(rect, placement, 4)).toEqual(expected);
  });
});

describe("useAnchoredPosition", () => {
  const anchor = (r: Partial<DOMRect>) => {
    const el = document.createElement("button");
    el.getBoundingClientRect = () => ({ ...rect, ...r }) as DOMRect;
    return { current: el };
  };

  it("measures the anchor when enabled", () => {
    const { result } = renderHook(() => useAnchoredPosition({ anchorRef: anchor({}), placement: "bottom-start", gap: 4, enabled: true }));
    expect(result.current.style).toEqual({ top: 134, left: 200 });
  });

  it("measures nothing while disabled", () => {
    const { result } = renderHook(() => useAnchoredPosition({ anchorRef: anchor({}), placement: "bottom-start", enabled: false }));
    expect(result.current.style).toEqual({});
  });

  it("re-measures on scroll and on resize", () => {
    let bottom = 130;
    const el = document.createElement("button");
    el.getBoundingClientRect = () => ({ ...rect, bottom }) as DOMRect;
    const { result } = renderHook(() => useAnchoredPosition({ anchorRef: { current: el }, placement: "bottom-start", enabled: true }));
    expect(result.current.style.top).toBe(130);
    bottom = 150;
    act(() => void window.dispatchEvent(new Event("scroll")));
    expect(result.current.style.top).toBe(150);
    bottom = 170;
    act(() => void window.dispatchEvent(new Event("resize")));
    expect(result.current.style.top).toBe(170);
  });

  it("stops listening when disabled", () => {
    let bottom = 130;
    const el = document.createElement("button");
    el.getBoundingClientRect = () => ({ ...rect, bottom }) as DOMRect;
    const { result, rerender } = renderHook(({ enabled }) => useAnchoredPosition({ anchorRef: { current: el }, placement: "bottom-start", enabled }), { initialProps: { enabled: true } });
    rerender({ enabled: false });
    bottom = 999;
    act(() => void window.dispatchEvent(new Event("scroll")));
    expect(result.current.style.top).toBe(130);
  });

  it("follows a placement change", () => {
    const ref = anchor({});
    const { result, rerender } = renderHook(({ placement }: { placement: AnchorPlacement }) => useAnchoredPosition({ anchorRef: ref, placement, enabled: true }), { initialProps: { placement: "bottom-start" as AnchorPlacement } });
    rerender({ placement: "top-start" });
    expect(result.current.style.transform).toBe("translateY(-100%)");
  });
});
