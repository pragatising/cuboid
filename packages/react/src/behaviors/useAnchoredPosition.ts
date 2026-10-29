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

export type PlaceFloatingOptions = {
  anchor: DOMRect;
  /** The floating element's own size, as it is now. */
  floating: { width: number; height: number };
  /** The room there is: the window's size. */
  viewport: { width: number; height: number };
  placement: AnchorPlacement;
  /** Distance from the anchor, in px. */
  gap: number;
  /** The least space to leave between the floating element and the window's edge, in px. @default 8 */
  margin?: number;
};

export type FloatingPlacement = {
  /** `position: fixed` coordinates of the floating element's top-left corner. */
  top: number;
  left: number;
  /** The side it ended up on: the one asked for, or the opposite if that had no room. Alignment (`start`, `end`) is kept. */
  placement: AnchorPlacement;
  /** The height the room on that side allows, set only when the element is taller than that: it must scroll inside it. */
  maxHeight?: number;
};

const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" } as const;

/**
 * Where a floating element goes so that it is seen: against its anchor on the side asked for, or, when that side has not the room and
 * the opposite has more, on the opposite; and slid along the anchor's edge as far as it takes to stay inside the window. A panel taller
 * than the room on its side is given the height there is, so it scrolls instead of leaving the window. Pure: the same numbers, the same place.
 */
export function placeFloating({ anchor, floating, viewport, placement, gap, margin = 8 }: PlaceFloatingOptions): FloatingPlacement {
  const [side, align] = placement.split("-") as [keyof typeof OPPOSITE, "start" | "end" | undefined];
  const vertical = side === "top" || side === "bottom";
  const room = {
    top: anchor.top - margin,
    bottom: viewport.height - anchor.bottom - margin,
    left: anchor.left - margin,
    right: viewport.width - anchor.right - margin,
  };
  const needs = (vertical ? floating.height : floating.width) + gap;
  // Flip only when it does not fit where it was asked for and there is more room on the other side.
  const used = room[side] >= needs || room[OPPOSITE[side]] <= room[side] ? side : OPPOSITE[side];
  const usedVertical = used === "top" || used === "bottom";

  const along = (size: number, anchorStart: number, anchorSize: number, limit: number) => {
    const wanted = align === "start" ? anchorStart : align === "end" ? anchorStart + anchorSize - size : anchorStart + anchorSize / 2 - size / 2;
    // Slid into the window; where it is wider than the window it begins at the margin.
    return Math.max(margin, Math.min(wanted, limit - size - margin));
  };

  let top: number;
  let left: number;
  if (usedVertical) {
    top = used === "bottom" ? anchor.bottom + gap : anchor.top - gap - floating.height;
    left = along(floating.width, anchor.left, anchor.width, viewport.width);
  } else {
    left = used === "right" ? anchor.right + gap : anchor.left - gap - floating.width;
    top = Math.max(margin, Math.min(anchor.top + anchor.height / 2 - floating.height / 2, viewport.height - floating.height - margin));
  }

  const available = usedVertical ? room[used] - gap : viewport.height - 2 * margin;
  const clipped = floating.height > available;
  // A panel placed above its anchor that has to be shortened still sits against it: its top moves down to meet the height it was given.
  if (clipped && used === "top") top = anchor.top - gap - available;
  if (clipped && !usedVertical) top = margin;
  return { top, left, placement: used === side ? placement : (placement.replace(side, OPPOSITE[side]) as AnchorPlacement), ...(clipped ? { maxHeight: Math.max(available, 0) } : {}) };
}

export type AnchoredPositionOptions = {
  /** The element to place the floating one against. */
  anchorRef: React.RefObject<Element | null>;
  placement: AnchorPlacement;
  /** Distance from the anchor, in px. @default 0 */
  gap?: number;
  /** Measure and listen only while the floating element is shown. */
  enabled: boolean;
  /**
   * The floating element. Given it, its size is measured and the placement keeps it in the window: it flips to the side with room and slides
   * along the anchor to stay inside (`placeFloating`), and the style carries a `maxHeight` when it is taller than the room. Without it, it is
   * placed against the anchor as asked, wherever that is.
   */
  floatingRef?: React.RefObject<Element | null>;
  /** The least space to leave at the window's edge, in px, when `floatingRef` is given. @default 8 */
  margin?: number;
  /**
   * The height, in px, the floating element is capped at by itself (its own `max-height`). Its size is measured with the cap the placement
   * itself sets taken off, down to this one: otherwise a panel shortened to fit would measure as short and so as fitting, and grow again.
   */
  maxHeight?: number;
};

const shallowEqual = (a: React.CSSProperties, b: React.CSSProperties) => {
  const keys = Object.keys(b) as (keyof React.CSSProperties)[];
  return keys.length === Object.keys(a).length && keys.every((key) => a[key] === b[key]);
};

/**
 * The `position: fixed` style that keeps a floating element against its anchor while it is `enabled`: measured when it
 * opens and again on scroll (any ancestor) and window resize. Used by Tooltip and Popover.
 */
export function useAnchoredPosition({ anchorRef, placement, gap = 0, enabled, floatingRef, margin = 8, maxHeight }: AnchoredPositionOptions) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [placed, setPlaced] = useState<AnchorPlacement>(placement);
  // The ref objects may be new ones each render; what matters is the element they hold when we measure.
  const anchor = useRef(anchorRef);
  const floating = useRef(floatingRef);
  useEffect(() => {
    anchor.current = anchorRef;
    floating.current = floatingRef;
  });

  const update = useCallback(() => {
    const element = anchor.current.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const panel = floating.current?.current;
    let next: React.CSSProperties;
    let used = placement;
    if (panel) {
      // Measured as it would be if nothing here had shortened it: the height it asks for, or its own cap.
      const style = (panel as HTMLElement).style;
      const applied = style?.maxHeight;
      if (style) style.maxHeight = maxHeight !== undefined ? `${maxHeight}px` : "none";
      const size = panel.getBoundingClientRect();
      if (style) style.maxHeight = applied;
      const viewport = { width: Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth), height: Math.min(window.innerHeight, document.documentElement.clientHeight || window.innerHeight) };
      const found = placeFloating({ anchor: rect, floating: { width: size.width, height: size.height }, viewport, placement, gap, margin });
      next = { top: found.top, left: found.left, ...(found.maxHeight !== undefined ? { maxHeight: found.maxHeight } : {}) };
      used = found.placement;
    } else {
      next = computeAnchoredPosition(rect, placement, gap);
    }
    // Scrolling fires this constantly: do not re-render when nothing moved.
    setStyle((previous) => (shallowEqual(previous, next) ? previous : next));
    setPlaced(used);
  }, [placement, gap, margin, maxHeight]);

  useLayoutEffect(() => {
    if (!enabled) return;
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    // The panel's own size changes (a list is searched, a section opens): where it fits changes with it.
    const panel = floating.current?.current;
    const observer = panel && typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (panel) observer?.observe(panel);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [enabled, update]);

  return { style, update, placement: placed };
}
