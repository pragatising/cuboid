import React, { Children, isValidElement, useCallback, useEffect } from "react";
import { useControllableState, useProvidedRefOrCreate, useRovingFocus } from "../../../behaviors";
import { Popover } from "../Popover";
import type { PopoverProps } from "../Popover";
import { ActionMenuItem } from "./ActionMenuItem";
import { ActionMenuList } from "./ActionMenuList";
import type { ActionMenuListProps } from "./ActionMenuList";
import type { ActionMenuSelectionMode } from "./ActionMenuContext";

export type ActionMenuProps = Omit<PopoverProps, "role" | "triggerHasPopup" | "autoFocus" | "children"> & {
  /** `ActionMenu.Item`s and `ActionMenu.Section`s, with an optional `ActionMenu.Header` and `ActionMenu.Footer`; or one `ActionMenu.List`. */
  children: React.ReactNode;
  /** Close after an item is activated. @default true */
  closeOnSelect?: boolean;
  /**
   * Focus the selected (or first) item when the menu opens. Turn it off for a combobox or typeahead trigger that must keep
   * focus and its keystrokes while the menu is a passive list of suggestions: it then does its own keyboard handling.
   * @default true
   */
  autoFocusFirstItem?: boolean;
  /** `single` makes the items radios, `multiple` checkboxes. Unset, they are plain actions. */
  selectionMode?: ActionMenuSelectionMode;
  /** The menu's accessible name, when no visible title gives it. */
  "aria-label"?: string;
  /** The id of an element that names the menu. */
  "aria-labelledby"?: string;
  /** Called with the activated item, for any item. */
  onSelect?: (item: HTMLElement) => void;
};

const isPart = (child: React.ReactNode, part: unknown) => isValidElement(child) && child.type === part;
const ITEM = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

/**
 * A dropdown menu: a trigger, a `Popover`, and an `ActionMenu.List` of items. The trigger opens it (and ArrowDown does), focus
 * goes to the selected or first item, the arrow keys move, Escape closes it and gives focus back to the trigger, and choosing
 * an item closes it unless the item says `keepOpenOnSelect`.
 *
 * A header and footer sit outside the `role="menu"` list, so a search field in the header is not read as a menu item.
 */
function ActionMenuRoot({
  trigger,
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
  closeOnSelect = true,
  autoFocusFirstItem = true,
  selectionMode,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  onSelect,
  ref,
  onKeyDown,
  onClick,
  ...props
}: ActionMenuProps) {
  const panelRef = useProvidedRefOrCreate<HTMLDivElement>(ref);
  const triggerRef = useProvidedRefOrCreate<HTMLElement>((trigger.props as { ref?: React.Ref<HTMLElement> }).ref);
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen ?? false, onChange: onOpenChange, name: "open" });
  const { focusSelected } = useRovingFocus({ containerRef: panelRef, itemSelector: ITEM });

  useEffect(() => {
    if (open && autoFocusFirstItem) focusSelected();
  }, [open, autoFocusFirstItem, focusSelected]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event);
      const item = (event.target as HTMLElement).closest<HTMLElement>(ITEM);
      if (!item || (item as HTMLButtonElement).disabled || item.getAttribute("aria-disabled") === "true") return;
      onSelect?.(item);
      if (closeOnSelect && item.dataset.keepOpen !== "true" && !event.defaultPrevented) setOpen(false);
    },
    [onClick, onSelect, closeOnSelect, setOpen],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.key === "Tab" && !event.defaultPrevented) {
        // Tab leaves the menu from the trigger: focus it before the menu goes, so Tab continues on from there instead of from nowhere.
        triggerRef.current?.focus({ preventScroll: true });
        setOpen(false);
      }
    },
    [onKeyDown, setOpen, triggerRef],
  );

  const menuTrigger = React.cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
    ref: triggerRef,
    onKeyDown: (event: React.KeyboardEvent) => {
      (trigger.props as { onKeyDown?: (event: React.KeyboardEvent) => void }).onKeyDown?.(event);
      if (!event.defaultPrevented && !open && event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
      }
    },
  });

  const parts = Children.toArray(children);
  const header = parts.find((child) => isPart(child, Popover.Header));
  const footer = parts.find((child) => isPart(child, Popover.Footer));
  const rest = parts.filter((child) => child !== header && child !== footer);
  const naming = { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy };

  const list =
    rest.length === 1 && isPart(rest[0], ActionMenuList) ? (
      React.cloneElement(rest[0] as React.ReactElement<ActionMenuListProps>, {
        selectionMode: selectionMode ?? (rest[0] as React.ReactElement<ActionMenuListProps>).props.selectionMode,
        "aria-label": ariaLabel ?? (rest[0] as React.ReactElement<ActionMenuListProps>).props["aria-label"],
        "aria-labelledby": ariaLabelledBy ?? (rest[0] as React.ReactElement<ActionMenuListProps>).props["aria-labelledby"],
      })
    ) : (
      <ActionMenuList selectionMode={selectionMode} {...naming}>
        {rest}
      </ActionMenuList>
    );

  return (
    <Popover
      {...props}
      ref={panelRef}
      open={open}
      onOpenChange={setOpen}
      trigger={menuTrigger}
      triggerHasPopup="menu"
      autoFocus={false}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {header}
      {list}
      {footer}
    </Popover>
  );
}

export const ActionMenu = Object.assign(ActionMenuRoot, {
  List: ActionMenuList,
  Item: ActionMenuItem,
  Section: ActionMenuList.Section,
  Header: Popover.Header,
  Footer: Popover.Footer,
});
