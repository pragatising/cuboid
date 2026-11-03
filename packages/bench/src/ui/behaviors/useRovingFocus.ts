import { useCallback } from "react";
import type React from "react";
import { useTypeAhead } from "./useTypeAhead";

export type RovingFocusOptions = {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Selector for the items inside the container. @default menu items, radios and checkboxes */
  itemSelector?: string;
  /** Which arrow keys move: Up/Down, or Left/Right. @default "vertical" */
  orientation?: "vertical" | "horizontal";
  /** Wrap from the last item to the first and back. @default true */
  loop?: boolean;
  /** Typing characters jumps to the next item whose text starts with them. @default true */
  typeahead?: boolean;
};

const DEFAULT_ITEMS = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';
const TYPEAHEAD_RESET_MS = 500;

const isEnabled = (item: HTMLElement) => !(item as HTMLButtonElement).disabled && item.getAttribute("aria-disabled") !== "true";
const isSelected = (item: HTMLElement) => item.getAttribute("aria-checked") === "true" || item.getAttribute("aria-selected") === "true" || item.hasAttribute("data-current");

/**
 * Arrow-key navigation through a set of items (a menu, a toolbar), the "roving" focus pattern: Up/Down (or Left/Right),
 * Home, End, and typeahead. Disabled items are skipped. Spread `onKeyDown` on the container.
 *
 * Returns imperative helpers too: `focusFirst` / `focusSelected` for when a menu opens.
 */
export function useRovingFocus({ containerRef, itemSelector = DEFAULT_ITEMS, orientation = "vertical", loop = true, typeahead = true }: RovingFocusOptions) {
  const { match } = useTypeAhead({ resetMs: TYPEAHEAD_RESET_MS });

  const items = useCallback(() => {
    const container = containerRef.current;
    return container ? Array.from(container.querySelectorAll<HTMLElement>(itemSelector)).filter(isEnabled) : [];
  }, [containerRef, itemSelector]);

  const focusFirst = useCallback(() => items()[0]?.focus(), [items]);
  const focusSelected = useCallback(() => {
    const all = items();
    (all.find(isSelected) ?? all[0])?.focus();
  }, [items]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const all = items();
      if (all.length === 0) return;
      const index = all.indexOf(document.activeElement as HTMLElement);
      const next = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
      const previous = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
      const move = (to: number) => {
        event.preventDefault();
        all[loop ? (to + all.length) % all.length : Math.min(all.length - 1, Math.max(0, to))]?.focus();
      };

      if (event.key === next) move(index + 1);
      else if (event.key === previous) move(index <= 0 ? (loop ? -1 : 0) : index - 1);
      else if (event.key === "Home") move(0);
      else if (event.key === "End") move(all.length - 1);
      else if (typeahead) {
        const found = match(event, all, index);
        if (found) {
          event.preventDefault();
          found.focus();
        }
      }
    },
    [items, loop, orientation, typeahead, match],
  );

  return { onKeyDown, focusFirst, focusSelected };
}
