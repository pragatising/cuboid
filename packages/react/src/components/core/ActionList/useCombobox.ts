import { useCallback, useId, useMemo, useRef, useState } from "react";
import type React from "react";
import { useActiveDescendant, useControllableState } from "../../../behaviors";
import type { PopoverProps } from "../Popover";

export type ComboboxKind = "input" | "select";

export type ComboboxOptions = {
  /** `input`: a text field with suggestions (Autocomplete). `select`: a box that chooses one option (Select). */
  kind: ComboboxKind;
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Whether there is anything to show while open: options, or an empty state. Without it the popup stays closed. @default true */
  hasContent?: boolean;
  /** A disabled or read-only control never opens. @default false */
  disabled?: boolean;
  /** The control that keeps focus: it gets focus back after an option is chosen or the popup is dismissed. */
  controlRef: React.RefObject<HTMLElement | null>;
  /** Called with the option element that was chosen, by pointer or key. The popup then closes. */
  onChoose: (option: HTMLElement) => void;
};

const OPTION = '[role="option"]';

/**
 * The behavior of a combobox: a control that keeps focus while a `listbox` of options in a popup under it holds the choices,
 * with the active option named by `aria-activedescendant` (`useActiveDescendant`), not by moving focus. It owns the open
 * state, the active option, the keys, choosing, and the popup's wiring; the component owns its markup and what is chosen.
 *
 * Returns props objects to spread, named for the element they go on (`behaviours.md`):
 * - `controlProps` onto the control (the input, or the select's box): the combobox ARIA and `onKeyDown`;
 * - `popoverProps` onto the `Popover`, anchored to `anchorRef` (put it on the field's box) and as wide as it;
 * - `listProps` onto the `ActionList`: its `role="listbox"` and the id the control points at.
 * `activeOption` is the value for `ActiveOptionContext`, so the rows know which one is active.
 *
 * Keys: ArrowDown opens a closed `input` (a `select` also opens on ArrowUp, Enter and Space). Open, the arrows move (a
 * `select` also takes Home and End and starts on the chosen option), Enter chooses, Escape closes and keeps focus on the
 * control, Tab closes; a `select` chooses with Space too.
 */
export function useCombobox({ kind, open: openProp, defaultOpen = false, onOpenChange, hasContent = true, disabled = false, controlRef, onChoose }: ComboboxOptions) {
  const listId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen, onChange: onOpenChange, name: "open" });
  const [activeId, setActiveId] = useState<string | undefined>();
  const select = kind === "select";
  const expanded = open && hasContent && !disabled;

  const { onKeyDown: navigate } = useActiveDescendant({ listId, activeId, setActiveId, enabled: expanded, initial: select ? "selected" : "first", homeEnd: select });
  const activeOption = useMemo(() => ({ listId, activeId, setActiveId }), [listId, activeId]);

  // The latest handler, read at call time, so the callbacks below keep one identity.
  const chosen = useRef(onChoose);
  chosen.current = onChoose;

  const close = useCallback(() => {
    setOpen(false);
    controlRef.current?.focus({ preventScroll: true });
  }, [setOpen, controlRef]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (disabled || event.defaultPrevented) return;
    if (!expanded) {
      if (select ? ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key) : event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (select && event.key === " ") {
      event.preventDefault();
      if (activeId) document.getElementById(activeId)?.click();
    } else {
      navigate(event);
    }
  };

  const choose = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const option = (event.target as HTMLElement).closest<HTMLElement>(OPTION);
      if (!option || (option as HTMLButtonElement).disabled || option.getAttribute("aria-disabled") === "true") return;
      chosen.current(option);
      close();
    },
    [close],
  );

  const popoverProps: Pick<PopoverProps, "open" | "onOpenChange" | "anchorRef" | "matchAnchorWidth" | "autoFocus" | "returnFocusOnClose" | "onMouseDown" | "onClick"> = {
    open: expanded,
    onOpenChange: setOpen,
    anchorRef,
    matchAnchorWidth: true,
    autoFocus: false,
    returnFocusOnClose: false,
    // A press on an option must not take focus from the control.
    onMouseDown: (event) => event.preventDefault(),
    onClick: choose,
  };

  return {
    open,
    setOpen,
    expanded,
    anchorRef,
    activeOption,
    close,
    controlProps: {
      role: "combobox" as const,
      "aria-haspopup": "listbox" as const,
      "aria-expanded": expanded,
      "aria-controls": expanded ? listId : undefined,
      "aria-activedescendant": expanded ? activeId : undefined,
      onKeyDown,
    },
    popoverProps,
    listProps: { role: "listbox" as const, id: listId },
  };
}
