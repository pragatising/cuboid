import { useEffect, useInsertionEffect, useRef } from "react";
import type React from "react";

export type FocusReturnOptions = {
  /** Remember the focused element when this becomes true; give focus back when it becomes false (or on unmount). */
  enabled: boolean;
  /** The layer being closed. Focus is only given back if it was inside it, or has been lost to the page. */
  containerRef?: React.RefObject<Element | null>;
};

/**
 * Give focus back to where it was when a layer opened. Without it, closing a dialog drops keyboard users at the top of
 * the page. If the user has already moved focus somewhere else on purpose, it is left alone.
 */
export function useFocusReturn({ enabled, containerRef }: FocusReturnOptions) {
  const previous = useRef<HTMLElement | null>(null);
  const container = useRef(containerRef);
  useEffect(() => {
    container.current = containerRef;
  });

  // Remember the opener *before* anything in the layer takes focus. An insertion effect runs ahead of the commit's DOM
  // work, so it sees focus before an `autoFocus` inside the layer (or the layer's own effects) has moved it.
  useInsertionEffect(() => {
    if (!enabled) return;
    const opener = document.activeElement;
    previous.current = opener instanceof HTMLElement && opener !== document.body ? opener : null;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    return () => {
      const target = previous.current;
      previous.current = null;
      if (!target || !target.isConnected) return;
      const active = document.activeElement;
      const lost = !active || active === document.body;
      const inside = Boolean(active && container.current?.current?.contains(active));
      if (lost || inside) target.focus({ preventScroll: true });
    };
  }, [enabled]);
}
