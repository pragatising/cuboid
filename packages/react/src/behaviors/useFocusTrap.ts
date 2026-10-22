import { useEffect, useRef } from "react";
import type React from "react";
import { useFocusReturn } from "./useFocusReturn";
import { getTabbableElements } from "./tabbable";

export type FocusTrapOptions = {
  enabled: boolean;
  /** The layer to keep focus inside. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Where focus goes when the trap turns on. @default the first tabbable element, else the container itself */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Give focus back to what had it before the trap turned on. @default true */
  returnFocus?: boolean;
};

/**
 * Keep keyboard focus inside a modal layer (a modal dialog, a sheet): move focus in when it turns on, wrap Tab and
 * Shift+Tab at the ends, pull focus back if it ends up outside, and (by default) give it back to the opener when it
 * turns off. This is what `aria-modal="true"` promises and does not do by itself.
 */
export function useFocusTrap({ enabled, containerRef, initialFocusRef, returnFocus = true }: FocusTrapOptions) {
  useFocusReturn({ enabled: enabled && returnFocus, containerRef });
  const initial = useRef(initialFocusRef);
  useEffect(() => {
    initial.current = initialFocusRef;
  });

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const first = initial.current?.current ?? getTabbableElements(container)[0];
    if (first) first.focus({ preventScroll: true });
    else {
      // Nothing to focus: the container takes it, so Tab has somewhere to start.
      if (!container.hasAttribute("tabindex")) container.tabIndex = -1;
      container.focus({ preventScroll: true });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const tabbables = getTabbableElements(container);
      if (tabbables.length === 0) {
        event.preventDefault();
        return;
      }
      const firstTabbable = tabbables[0];
      const lastTabbable = tabbables[tabbables.length - 1];
      const active = document.activeElement;
      if (!container.contains(active)) {
        event.preventDefault();
        firstTabbable.focus();
      } else if (event.shiftKey && (active === firstTabbable || active === container)) {
        event.preventDefault();
        lastTabbable.focus();
      } else if (!event.shiftKey && active === lastTabbable) {
        event.preventDefault();
        firstTabbable.focus();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !container.contains(event.target)) (getTabbableElements(container)[0] ?? container).focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [enabled, containerRef]);
}
