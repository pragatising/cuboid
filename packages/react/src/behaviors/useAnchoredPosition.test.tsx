import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { computeAnchoredPosition, placeFloating, useAnchoredPosition } from "./useAnchoredPosition";
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


describe("placeFloating: keeping a floating element in the window", () => {
  const viewport = { width: 1000, height: 800 };
  const at = (r: Partial<DOMRect>) => {
    const box = { top: 100, left: 100, width: 60, height: 30, ...r };
    return { ...box, bottom: box.top + box.height, right: box.left + box.width } as DOMRect;
  };
  const place = (anchor: Partial<DOMRect>, floating: { width: number; height: number }, placement: AnchorPlacement) => placeFloating({ anchor: at(anchor), floating, viewport, placement, gap: 4 });

  it("puts it where it was asked for when there is room", () => {
    expect(place({}, { width: 200, height: 100 }, "bottom-start")).toEqual({ top: 134, left: 100, placement: "bottom-start" });
    expect(place({ left: 500 }, { width: 200, height: 100 }, "bottom-end")).toEqual({ top: 134, left: 360, placement: "bottom-end" });
    expect(place({ left: 500 }, { width: 200, height: 100 }, "bottom")).toEqual({ top: 134, left: 430, placement: "bottom" });
    expect(place({ top: 300 }, { width: 200, height: 100 }, "top-start")).toMatchObject({ top: 196, left: 100, placement: "top-start" });
    expect(place({ left: 400, top: 300 }, { width: 200, height: 100 }, "right")).toEqual({ top: 265, left: 464, placement: "right" });
    expect(place({ left: 400, top: 300 }, { width: 200, height: 100 }, "left")).toEqual({ top: 265, left: 196, placement: "left" });
  });

  it("slides it along the anchor to stay inside at the right edge", () => {
    // The anchor ends at 960; a panel 280 wide from its left edge would end at 1180.
    expect(place({ left: 900 }, { width: 280, height: 100 }, "bottom-start")).toMatchObject({ left: 1000 - 280 - 8, top: 134, placement: "bottom-start" });
  });

  it("slides it the other way at the left edge", () => {
    expect(place({ left: 10, width: 40 }, { width: 280, height: 100 }, "bottom-end")).toMatchObject({ left: 8 });
    expect(place({ left: 10, width: 40 }, { width: 280, height: 100 }, "bottom")).toMatchObject({ left: 8 });
  });

  it("begins at the margin when it is wider than the window", () => {
    expect(place({ left: 300 }, { width: 1200, height: 100 }, "bottom-start")).toMatchObject({ left: 8 });
  });

  it("flips to the other side when its own has no room and the other has, keeping its alignment", () => {
    // The anchor is near the bottom: 62px under it, 692 over it.
    expect(place({ top: 700 }, { width: 200, height: 200 }, "bottom-start")).toEqual({ top: 700 - 4 - 200, left: 100, placement: "top-start" });
    expect(place({ top: 700, left: 500 }, { width: 200, height: 200 }, "bottom-end")).toMatchObject({ placement: "top-end", left: 360 });
    // And the other way, near the top.
    expect(place({ top: 20 }, { width: 200, height: 200 }, "top")).toMatchObject({ top: 20 + 30 + 4, placement: "bottom" });
  });

  it("flips at the side edges", () => {
    expect(place({ left: 930 }, { width: 200, height: 100 }, "right")).toMatchObject({ left: 930 - 4 - 200, placement: "left" });
    expect(place({ left: 20, width: 20 }, { width: 200, height: 100 }, "left")).toMatchObject({ left: 20 + 20 + 4, placement: "right" });
  });

  it("does not flip when the other side has no more room", () => {
    // 372 over the anchor, 382 under it, and a panel 900 tall: it stays under and is given the room.
    expect(place({ top: 380 }, { width: 200, height: 900 }, "bottom-start")).toEqual({ top: 414, left: 100, placement: "bottom-start", maxHeight: 378 });
  });

  it("gives a panel taller than the room on its side the height there is, so it scrolls, and keeps it against the anchor", () => {
    const above = place({ top: 600 }, { width: 200, height: 900 }, "top-start");
    expect(above.placement).toBe("top-start");
    expect(above.maxHeight).toBe(600 - 8 - 4);
    expect(above.top + above.maxHeight!).toBe(600 - 4);
  });

  it("keeps a side placement inside the window along the anchor, both ends", () => {
    expect(place({ top: 5, left: 400, height: 10 }, { width: 100, height: 200 }, "right")).toMatchObject({ top: 8 });
    expect(place({ top: 790, left: 400, height: 10 }, { width: 100, height: 200 }, "right")).toMatchObject({ top: 800 - 200 - 8 });
  });

  it("honours a margin of its own", () => {
    expect(placeFloating({ anchor: at({ left: 900 }), floating: { width: 280, height: 100 }, viewport, placement: "bottom-start", gap: 4, margin: 24 })).toMatchObject({ left: 1000 - 280 - 24 });
  });
});

describe("useAnchoredPosition: given the floating element", () => {
  const sized = (width: number, height: number) => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => ({ width, height, top: 0, left: 0, right: width, bottom: height }) as DOMRect;
    return { current: el };
  };
  const anchorAt = (r: Partial<DOMRect>) => {
    const el = document.createElement("button");
    const box = { top: 100, left: 200, width: 60, height: 30, ...r };
    el.getBoundingClientRect = () => ({ ...box, bottom: box.top + box.height, right: box.left + box.width }) as DOMRect;
    return { current: el };
  };

  it("places it inside the window, with no transform, and says which side it is on", () => {
    // jsdom's window is 1024 x 768.
    const { result } = renderHook(() => useAnchoredPosition({ anchorRef: anchorAt({ left: 950, top: 700 }), floatingRef: sized(280, 200), placement: "bottom-start", gap: 4, enabled: true }));
    expect(result.current.style).toEqual({ top: 700 - 4 - 200, left: 1024 - 280 - 8 });
    expect(result.current.placement).toBe("top-start");
  });

  it("carries the height it was given when the panel is taller than the room, on the side with more of it", () => {
    // 372 over the anchor and 350 under it in a window 768 tall: it goes over, and takes what is there.
    const { result } = renderHook(() => useAnchoredPosition({ anchorRef: anchorAt({ top: 380 }), floatingRef: sized(200, 900), placement: "bottom-start", gap: 4, enabled: true }));
    expect(result.current.placement).toBe("top-start");
    expect(result.current.style).toEqual({ top: 8, left: 200, maxHeight: 372 - 4 });
  });

  it("places it as asked, with a transform, when it is not given the element (as before)", () => {
    const { result } = renderHook(() => useAnchoredPosition({ anchorRef: anchorAt({}), placement: "bottom-end", gap: 4, enabled: true }));
    expect(result.current.style).toEqual({ top: 134, left: 260, transform: "translateX(-100%)" });
    expect(result.current.placement).toBe("bottom-end");
  });
});

describe("useAnchoredPosition: a panel it has shortened", () => {
  // A panel that is 900px tall unless something caps it, as a real one with a scrolling list is: its measured height follows `max-height`.
  const capped = () => {
    const el = document.createElement("div");
    el.getBoundingClientRect = () => {
      const cap = el.style.maxHeight && el.style.maxHeight !== "none" ? parseFloat(el.style.maxHeight) : Infinity;
      const height = Math.min(900, cap);
      return { width: 200, height, top: 0, left: 0, right: 200, bottom: height } as DOMRect;
    };
    return { current: el };
  };
  const anchorAt = () => {
    const el = document.createElement("button");
    el.getBoundingClientRect = () => ({ top: 380, left: 200, width: 60, height: 30, bottom: 410, right: 260 }) as DOMRect;
    return { current: el };
  };

  it("measures what it would be without the cap it set, so it stays shortened instead of growing back and overlapping its anchor", () => {
    const panel = capped();
    const { result } = renderHook(() => useAnchoredPosition({ anchorRef: anchorAt(), floatingRef: panel, placement: "bottom-start", gap: 4, enabled: true }));
    const first = result.current.style;
    expect(first.maxHeight).toBe(368);
    // What the component does with the style: the cap is on the element, and its size changes with it.
    panel.current.style.maxHeight = `${first.maxHeight}px`;
    act(() => result.current.update());
    expect(result.current.style).toEqual(first);
    act(() => result.current.update());
    expect(result.current.style).toEqual(first);
    // It sits against its anchor: its top plus the height it was given meets the anchor.
    expect((first.top as number) + (first.maxHeight as number)).toBe(380 - 4);
  });

  it("measures down to the cap the panel has of its own, not above it", () => {
    const panel = capped();
    const { result } = renderHook(() => useAnchoredPosition({ anchorRef: anchorAt(), floatingRef: panel, placement: "bottom-start", gap: 4, enabled: true, maxHeight: 200 }));
    // Capped at 200 by itself, it fits over the anchor (372 of room): no shortening, and it goes where it was asked, under it? 350 under it is enough for 200.
    expect(result.current.placement).toBe("bottom-start");
    expect(result.current.style.maxHeight).toBeUndefined();
    expect(panel.current.style.maxHeight).toBe("");
  });
});
