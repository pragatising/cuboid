import { useEffect } from "react";

/** How many layers currently want the page's scroll locked, and what to put back when the last one lets go. */
let locks = 0;
let restore: (() => void) | null = null;

/**
 * Stop the page behind a modal layer from scrolling while `enabled`. Several modals can be open at once: the page unlocks
 * only when the last one closes. The scrollbar's width is added back as padding so the page does not jump sideways when it
 * disappears.
 */
export function useScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (locks === 0) {
      const { body, documentElement } = document;
      const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      const scrollbar = window.innerWidth - documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollbar > 0) body.style.paddingRight = `calc(${getComputedStyle(body).paddingRight} + ${scrollbar}px)`;
      restore = () => {
        body.style.overflow = previous.overflow;
        body.style.paddingRight = previous.paddingRight;
      };
    }
    locks += 1;

    return () => {
      locks -= 1;
      if (locks === 0) {
        restore?.();
        restore = null;
      }
    };
  }, [enabled]);
}
