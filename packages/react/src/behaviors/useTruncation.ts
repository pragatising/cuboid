import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type React from "react";

export type TruncationOptions = {
  ref: React.RefObject<HTMLElement | null>;
  /** @default true */
  enabled?: boolean;
  /** What the element shows, so a change of content is measured again. */
  content?: React.ReactNode;
};

const isCut = (element: HTMLElement) => element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

/**
 * Whether an element's content is cut off by its box (an ellipsis, a line clamp, a clipped overflow). It measures after
 * the content changes and again whenever the element's own size changes, so a column that is resized in either direction
 * is answered. Where there is no layout (the server, jsdom: every size is 0) nothing is cut, so the answer is `false`.
 *
 * It only reports. What to do about it (a tooltip with the full text, a tab stop, an expand control) is the caller's.
 */
export function useTruncation({ ref, enabled = true, content }: TruncationOptions) {
  const [truncated, setTruncated] = useState(false);

  const measure = useCallback(() => {
    const element = ref.current;
    setTruncated(enabled && element !== null && isCut(element));
  }, [ref, enabled]);

  useLayoutEffect(measure, [measure, content]);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled, measure]);

  return truncated;
}
