import { useCallback, useEffect, useRef } from "react";
import type React from "react";

export type TypeAheadOptions = {
  /** The text of an item to match against. @default its `textContent` */
  getText?: (item: HTMLElement) => string;
  /** How long a pause ends the word being typed. @default 500 */
  resetMs?: number;
};

/**
 * Typeahead for a list of items: typing characters finds the next item whose text starts with them. One repeated character cycles
 * through the matches; a longer prefix refines the current one. A pause (`resetMs`) starts a new word, and a space is part of the
 * word only once one has begun.
 *
 * `match(event, items, index)` takes the key event, the enabled items in order, and the index of the current one (-1 for none),
 * and returns the item to move to, or `undefined` when the key is not a typeahead key or nothing matches. `typing()` says whether
 * a word is in progress, so a caller can keep Space for the word instead of treating it as "choose".
 */
export function useTypeAhead({ getText = (item) => item.textContent ?? "", resetMs = 500 }: TypeAheadOptions = {}) {
  const buffer = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const text = useRef(getText);
  text.current = getText;
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const typing = useCallback(() => buffer.current !== "", []);

  const match = useCallback(
    (event: React.KeyboardEvent<HTMLElement>, items: HTMLElement[], index: number): HTMLElement | undefined => {
      if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return undefined;
      if (event.key === " " && !buffer.current) return undefined;
      buffer.current += event.key.toLowerCase();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => (buffer.current = ""), resetMs);
      const start = buffer.current.length === 1 ? index + 1 : Math.max(index, 0);
      for (let i = 0; i < items.length; i++) {
        const item = items[(start + i) % items.length];
        if (text.current(item).trim().toLowerCase().startsWith(buffer.current)) return item;
      }
      return undefined;
    },
    [resetMs],
  );

  return { match, typing };
}
