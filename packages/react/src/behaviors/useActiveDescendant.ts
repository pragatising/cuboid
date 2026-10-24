import { useCallback, useLayoutEffect } from "react";
import type React from "react";

export type ActiveDescendantOptions = {
  /** The id of the `role="listbox"` whose options the input points at. */
  listId: string | undefined;
  /** The id of the active option: what the input's `aria-activedescendant` says. Kept by the caller. */
  activeId: string | undefined;
  setActiveId: ((id: string | undefined) => void) | undefined;
  /** Without it the hook does nothing. @default true */
  enabled?: boolean;
  /** Which option becomes active when there is none: the first, or the chosen one (`aria-selected`) if there is one. @default "first" */
  initial?: "first" | "selected";
  /**
   * Home and End jump to the first and last option. Off for a text field, where they move the caret.
   * @default false
   */
  homeEnd?: boolean;
};

const OPTION = '[role="option"]';
const isEnabled = (option: HTMLElement) => !(option as HTMLButtonElement).disabled && option.getAttribute("aria-disabled") !== "true";

/**
 * The keyboard half of a combobox whose input keeps focus while a listbox below it holds the options
 * (`aria-activedescendant`, not roving focus). Spread `onKeyDown` on the input: ArrowDown and ArrowUp move the active option
 * and wrap, skipping disabled ones, and Enter clicks it, so the list's own click handling chooses it.
 *
 * It also keeps the active option real: whenever the list changes under it, the first option (or, with `initial: "selected"`, the
 * chosen one) becomes active, and none is active when the list is empty. The caller keeps `activeId` in state and renders it as `aria-activedescendant`.
 */
export function useActiveDescendant({ listId, activeId, setActiveId, enabled = true, initial = "first", homeEnd = false }: ActiveDescendantOptions) {
  const options = useCallback(() => {
    const list = listId ? document.getElementById(listId) : null;
    return list ? Array.from(list.querySelectorAll<HTMLElement>(OPTION)).filter(isEnabled) : [];
  }, [listId]);

  useLayoutEffect(() => {
    if (!enabled || !setActiveId) return;
    const all = options();
    if (all.length === 0) {
      if (activeId !== undefined) setActiveId(undefined);
    } else if (!all.some((option) => option.id === activeId)) {
      const chosen = initial === "selected" ? all.find((option) => option.getAttribute("aria-selected") === "true") : undefined;
      setActiveId((chosen ?? all[0]).id);
    }
  });

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!enabled || !setActiveId || event.defaultPrevented) return;
      const all = options();
      if (all.length === 0) return;
      const index = all.findIndex((option) => option.id === activeId);
      const move = (to: number) => {
        event.preventDefault();
        const next = all[(to + all.length) % all.length];
        setActiveId(next.id);
        next.scrollIntoView?.({ block: "nearest" });
      };
      if (event.key === "ArrowDown") move(index + 1);
      else if (event.key === "ArrowUp") move(index < 0 ? all.length - 1 : index - 1);
      else if (homeEnd && event.key === "Home") move(-all.length);
      else if (homeEnd && event.key === "End") move(-1);
      else if (event.key === "Enter" && index >= 0) {
        event.preventDefault();
        all[index].click();
      }
    },
    [enabled, setActiveId, options, activeId, homeEnd],
  );

  return { onKeyDown };
}
