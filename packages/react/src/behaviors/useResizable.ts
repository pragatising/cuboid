import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

export type ResizableOptions = {
  /** The separator's orientation (ARIA): a `vertical` bar is dragged along x and resizes a width; `horizontal` along y and a height. @default "vertical" */
  orientation?: "vertical" | "horizontal";
  /** The current size in px. */
  value: number;
  min: number;
  max: number;
  /** How far an arrow key moves it, in px. Shift moves it five times as far. @default 16 */
  step?: number;
  /** The panel grows when the pointer moves toward its start (a panel on the end edge). @default false */
  invert?: boolean;
  /** Called with the next size (clamped to `min`/`max`), by pointer or by keyboard. */
  onChange: (next: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Resizing by pointer drag **and by keyboard**: the WAI-ARIA window-splitter pattern. Returns the props to spread on the
 * handle element: a focusable `role="separator"` carrying `aria-orientation` and `aria-valuenow/min/max`, with
 * Arrow keys (Shift for bigger steps), Home and End. The pointer is captured for the drag, so it can leave the handle.
 */
export function useResizable({ orientation = "vertical", value: valueProp, min, max, step = 16, invert = false, onChange, onResizeStart, onResizeEnd }: ResizableOptions) {
  const [dragging, setDragging] = useState(false);
  const last = useRef(0);
  const latest = useRef({ value: valueProp, min, max, onChange, onResizeStart, onResizeEnd });
  useEffect(() => {
    latest.current = { value: valueProp, min, max, onChange, onResizeStart, onResizeEnd };
  });
  const sign = invert ? -1 : 1;
  const axis = orientation === "vertical" ? "clientX" : "clientY";

  // `track` is for a pointer drag, whose moves can arrive faster than React re-renders: the next move then builds on this one.
  // A keyboard step never guesses: the caller may refuse or clamp it, and only its next `value` settles that.
  const apply = useCallback((next: number, track = false) => {
    const { min: lo, max: hi, value: current, onChange: notify } = latest.current;
    const clamped = clamp(next, lo, hi);
    if (clamped === current) return;
    if (track) latest.current = { ...latest.current, value: clamped };
    notify(clamped);
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      last.current = event[axis];
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDragging(true);
      latest.current.onResizeStart?.();
    },
    [axis],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!dragging) return;
      const delta = event[axis] - last.current;
      last.current = event[axis];
      if (delta !== 0) apply(latest.current.value + sign * delta, true);
    },
    [apply, axis, dragging, sign],
  );

  const endDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    setDragging(false);
    latest.current = { ...latest.current, value: valueProp };
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    latest.current.onResizeEnd?.();
  }, [dragging, valueProp]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const growKey = orientation === "vertical" ? (invert ? "ArrowLeft" : "ArrowRight") : invert ? "ArrowUp" : "ArrowDown";
      const shrinkKey = orientation === "vertical" ? (invert ? "ArrowRight" : "ArrowLeft") : invert ? "ArrowDown" : "ArrowUp";
      const amount = step * (event.shiftKey ? 5 : 1);
      const { value: current, min: lo, max: hi } = latest.current;

      if (event.key === growKey) apply(current + amount);
      else if (event.key === shrinkKey) apply(current - amount);
      else if (event.key === "Home") apply(lo);
      else if (event.key === "End") apply(hi);
      else return;
      event.preventDefault();
    },
    [apply, invert, orientation, step],
  );

  return {
    dragging,
    /** Spread on the handle element. */
    separatorProps: {
      role: "separator" as const,
      tabIndex: 0,
      "aria-orientation": orientation,
      "aria-valuenow": Math.round(valueProp),
      "aria-valuemin": Math.round(min),
      "aria-valuemax": Math.round(max),
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown,
    },
  };
}
