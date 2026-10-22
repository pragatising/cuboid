import { useEffect, useRef } from "react";

/** Everything currently listening for Escape, oldest first. Only the last one (the one opened most recently) answers. */
const listening: object[] = [];

/**
 * Call `handler` when Escape is pressed, but only if this is the most recently enabled listener.
 *
 * Without the ordering a popover opened inside a sheet would close both on one Escape; with it, Escape peels one layer
 * at a time. A keydown that something already handled (`defaultPrevented`) or an IME composition is ignored.
 */
export function useEscape(handler: (event: KeyboardEvent) => void, enabled = true) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const me = {};
    listening.push(me);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.isComposing) return;
      if (listening[listening.length - 1] !== me) return;
      latest.current(event);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      listening.splice(listening.indexOf(me), 1);
    };
  }, [enabled]);
}
