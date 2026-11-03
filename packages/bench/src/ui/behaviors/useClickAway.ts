import { useEffect, useRef } from "react";
import type React from "react";

type ElementRef = React.RefObject<Element | null>;

/**
 * Call `handler` when a pointer goes down outside every one of `refs` (typically the floating panel and its anchor).
 * Listens in the capture phase, so an element that stops propagation cannot hide an outside press.
 */
export function useClickAway(refs: ElementRef | readonly ElementRef[], handler: (event: PointerEvent) => void, enabled = true) {
  const latest = useRef({ refs, handler });
  useEffect(() => {
    latest.current = { refs, handler };
  });

  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const list = Array.isArray(latest.current.refs) ? latest.current.refs : [latest.current.refs as ElementRef];
      if (list.some((ref) => ref.current?.contains(target))) return;
      latest.current.handler(event);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [enabled]);
}
