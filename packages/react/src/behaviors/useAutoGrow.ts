import { useCallback, useEffect, useLayoutEffect } from "react";
import type React from "react";

export type AutoGrowOptions = {
  ref: React.RefObject<HTMLTextAreaElement | null>;
  /** @default true */
  enabled?: boolean;
  /** The value, so a controlled change is measured. */
  value?: string | number | readonly string[];
  /** Stop growing at this many lines and scroll instead. The element's own `rows` is the least. */
  maxRows?: number;
};

/**
 * A textarea that is as tall as its text. It measures the text (`scrollHeight`) and hands the height to the CSS as
 * `--textarea-height`, sets `data-capped` once `maxRows` is reached (so the CSS can let it scroll), and measures again when
 * the value changes, when the user types, and when the element's width changes (the text rewraps). Spread `onInput` on the
 * textarea. It does nothing where there is no layout (scrollHeight 0).
 */
export function useAutoGrow({ ref, enabled = true, value, maxRows }: AutoGrowOptions) {
  const measure = useCallback(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    element.style.setProperty("--textarea-height", "auto");
    const natural = element.scrollHeight;
    if (natural === 0) return;
    const style = getComputedStyle(element);
    const line = parseFloat(style.lineHeight);
    const chrome = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const cap = maxRows !== undefined && Number.isFinite(line) ? line * maxRows + chrome : undefined;
    const capped = cap !== undefined && natural > cap;
    element.style.setProperty("--textarea-height", `${capped ? cap : natural}px`);
    element.toggleAttribute("data-capped", capped);
  }, [ref, enabled, maxRows]);

  useLayoutEffect(measure, [measure, value]);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof ResizeObserver === "undefined") return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== width) {
        width = element.clientWidth;
        measure();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled, measure]);

  return { onInput: measure };
}
