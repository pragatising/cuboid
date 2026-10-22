import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type React from "react";

export type AnchorPlacement = "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "right";

/**
 * `position: fixed` coordinates for a floating element placed against an anchor's bounding rect, `gap` px away.
 * `*-start` / `*-end` align the floating element's edge to the anchor's; plain `top` / `bottom` / `left` / `right` centre it.
 */
export function computeAnchoredPosition(rect: DOMRect, placement: AnchorPlacement, gap: number): React.CSSProperties {
  switch (placement) {
    case "bottom-start":
      return { top: rect.bottom + gap, left: rect.left };
    case "bottom-end":
      return { top: rect.bottom + gap, left: rect.right, transform: "translateX(-100%)" };
    case "bottom":
      return { top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: "translateX(-50%)" };
    case "top-start":
      return { top: rect.top - gap, left: rect.left, transform: "translateY(-100%)" };
    case "top-end":
      return { top: rect.top - gap, left: rect.right, transform: "translate(-100%, -100%)" };
    case "top":
      return { top: rect.top - gap, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)" };
    case "left":
      return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: "translate(-100%, -50%)" };
    case "right":
      return { top: rect.top + rect.height / 2, left: rect.right + gap, transform: "translateY(-50%)" };
  }
}

export type AnchoredPositionOptions = {
  /** The element to place the floating one against. */
  anchorRef: React.RefObject<Element | null>;
  placement: AnchorPlacement;
  /** Distance from the anchor, in px. @default 0 */
  gap?: number;
  /** Measure and listen only while the floating element is shown. */
  enabled: boolean;
};

const shallowEqual = (a: React.CSSProperties, b: React.CSSProperties) => {
  const keys = Object.keys(b) as (keyof React.CSSProperties)[];
  return keys.length === Object.keys(a).length && keys.every((key) => a[key] === b[key]);
};

/**
 * The `position: fixed` style that keeps a floating element against its anchor while it is `enabled`: measured when it
 * opens and again on scroll (any ancestor) and window resize. Used by Tooltip and Popover.
 */
export function useAnchoredPosition({ anchorRef, placement, gap = 0, enabled }: AnchoredPositionOptions) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  // The ref object may be a new one each render; what matters is the element it holds when we measure.
  const anchor = useRef(anchorRef);
  useEffect(() => {
    anchor.current = anchorRef;
  });

  const update = useCallback(() => {
    const element = anchor.current.current;
    if (!element) return;
    const next = computeAnchoredPosition(element.getBoundingClientRect(), placement, gap);
    // Scrolling fires this constantly: do not re-render when nothing moved.
    setStyle((previous) => (shallowEqual(previous, next) ? previous : next));
  }, [placement, gap]);

  useLayoutEffect(() => {
    if (!enabled) return;
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [enabled, update]);

  return { style, update };
}
