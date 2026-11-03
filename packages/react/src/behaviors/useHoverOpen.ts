import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

export type HoverOpenOptions = {
  /** @default true */
  enabled?: boolean;
  /** How long the pointer rests on the trigger before it opens, in ms, so one passing through opens nothing. @default 400 */
  delay?: number;
};

/**
 * Something that opens when the pointer rests on its trigger, and also when the trigger is pressed or focused. It is the three ways a person
 * asks to see more: hover (after `delay`, closing when the pointer leaves), click, and keyboard focus. A click or focus pins it: it then
 * stays until it is dismissed (Escape, a press outside: hand `onOpenChange` to the layer), the trigger is pressed again, or focus leaves.
 * Touch has no hover, so a tap pins it at once.
 *
 * Returns `open`, `onOpenChange` for the layer's own dismissals, and `triggerProps` to spread on the trigger.
 */
export function useHoverOpen({ enabled = true, delay = 400 }: HoverOpenOptions = {}) {
  const [open, setOpenState] = useState(false);
  const pinned = useRef(false);
  // A press focuses the trigger before it clicks it: the focus has already opened it, so that click must not close it again.
  const openedByFocus = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clear = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
  };
  const close = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    pinned.current = false;
    openedByFocus.current = false;
    setOpenState(false);
  }, []);
  const pin = () => {
    clear();
    pinned.current = true;
    setOpenState(true);
  };

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!enabled) close();
  }, [enabled, close]);

  const triggerProps = {
    onPointerEnter: (event: React.PointerEvent) => {
      if (!enabled || event.pointerType === "touch" || pinned.current) return;
      clear();
      timer.current = setTimeout(() => setOpenState(true), delay);
    },
    onPointerLeave: () => {
      clear();
      if (!pinned.current) setOpenState(false);
    },
    onClick: () => {
      if (!enabled) return;
      if (openedByFocus.current) openedByFocus.current = false;
      else if (pinned.current) close();
      else pin();
    },
    onFocus: () => {
      if (!enabled) return;
      openedByFocus.current = true;
      pin();
    },
    onBlur: () => close(),
  };

  return { open: enabled && open, onOpenChange: (next: boolean) => (next ? pin() : close()), triggerProps };
}
