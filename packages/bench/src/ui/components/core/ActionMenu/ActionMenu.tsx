import React, { Children, isValidElement, useCallback, useEffect, useId, useMemo, useState } from "react";
import { useControllableState, useProvidedRefOrCreate, useRovingFocus } from "../../../behaviors";
import { EmptyState } from "../EmptyState";
import { Popover } from "../Popover";
import type { PopoverProps } from "../Popover";
import { ActionListItem } from "../ActionList/ActionListItem";
import { ActionList } from "../ActionList/ActionList";
import type { ActionListProps } from "../ActionList/ActionList";
import type { ActionListSelectionMode } from "../ActionList/ActionListContext";
import { ActionMenuSearch } from "./ActionMenuSearch";
import { ActiveOptionContext } from "../ActionList/ActiveOptionContext";

export type ActionMenuProps = Omit<PopoverProps, "role" | "triggerHasPopup" | "autoFocus" | "children" | "onSelect"> & {
  /**
   * `ActionMenu.Item`s and `ActionMenu.Section`s, with an optional `ActionMenu.Header`, `ActionMenu.Search`, `ActionMenu.Empty`
   * and `ActionMenu.Footer`; or one `ActionMenu.List`. With a `Search`, the list is a `listbox` of options and the search field
   * keeps focus. The `Empty` state shows in place of the list while there are no items.
   */
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
  selectionMode?: ActionListSelectionMode;
  /** The menu's accessible name, when no visible title gives it. */
  "aria-label"?: string;
  /** The id of an element that names the menu. */
  "aria-labelledby"?: string;
  /** Called with the activated item, for any item. */
  onSelect?: (item: HTMLElement) => void;
};

const isPart = (child: React.ReactNode, part: unknown) => isValidElement(child) && child.type === part;
const ITEM = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="option"]';

/**
 * A dropdown menu: a trigger, a `Popover`, and an `ActionMenu.List` of items. The trigger opens it (and ArrowDown does), focus
 * goes to the selected or first item, the arrow keys move, Escape closes it and gives focus back to the trigger, and choosing
 * an item closes it unless the item says `keepOpenOnSelect`.
 *
 * A header, search field and footer sit outside the list, so they are never read as items. With an `ActionMenu.Search` the menu
 * becomes a filterable choice list: the list is a `role="listbox"` of options, focus stays in the search field (a combobox)
 * and it points at the active option with `aria-activedescendant`. Filtering is the consumer's: render the matching items.
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
  const listId = useId();
  const [activeId, setActiveId] = useState<string | undefined>();

  const parts = Children.toArray(children);
  const header = parts.find((child) => isPart(child, Popover.Header));
  const footer = parts.find((child) => isPart(child, Popover.Footer));
  const search = parts.find((child) => isPart(child, ActionMenuSearch));
  const empty = parts.find((child) => isPart(child, EmptyState));
  const rest = parts.filter((child) => child !== header && child !== footer && child !== search && child !== empty);
  const hasSearch = search !== undefined;
  // The empty state replaces the list while there is nothing to list.
  const showEmpty = empty !== undefined && rest.length === 0;
  const searchContext = useMemo(() => (hasSearch ? { listId, activeId, setActiveId } : null), [hasSearch, listId, activeId]);

  // With a search field, focus belongs to it (it focuses itself); otherwise it goes to the selected or first item.
  useEffect(() => {
    if (open && autoFocusFirstItem && !hasSearch) focusSelected();
  }, [open, autoFocusFirstItem, hasSearch, focusSelected]);

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

  const naming = { "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy };
  // The list the search field controls: a listbox, with the id the field points at.
  // It stays in the DOM, hidden, while the empty state shows, so the search field's `aria-controls` still points at something.
  const searching = { ...(hasSearch ? ({ role: "listbox", id: listId } as const) : {}), ...(showEmpty ? { hidden: true } : {}) };

  const list =
    rest.length === 1 && isPart(rest[0], ActionList) ? (
      React.cloneElement(rest[0] as React.ReactElement<ActionListProps>, {
        selectionMode: selectionMode ?? (rest[0] as React.ReactElement<ActionListProps>).props.selectionMode,
        "aria-label": ariaLabel ?? (rest[0] as React.ReactElement<ActionListProps>).props["aria-label"],
        "aria-labelledby": ariaLabelledBy ?? (rest[0] as React.ReactElement<ActionListProps>).props["aria-labelledby"],
        ...searching,
      })
    ) : (
      <ActionList selectionMode={selectionMode} {...naming} {...searching}>
        {rest}
      </ActionList>
    );

  return (
    <Popover
      {...props}
      ref={panelRef}
      open={open}
      onOpenChange={setOpen}
      trigger={menuTrigger}
      triggerHasPopup={hasSearch ? "listbox" : "menu"}
      autoFocus={false}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {header}
      <ActiveOptionContext.Provider value={searchContext}>
        {search}
        {showEmpty ? empty : null}
        {list}
      </ActiveOptionContext.Provider>
      {footer}
    </Popover>
  );
}

export const ActionMenu = Object.assign(ActionMenuRoot, {
  List: ActionList,
  Item: ActionListItem,
  Section: ActionList.Section,
  Header: Popover.Header,
  Search: ActionMenuSearch,
  /** What shows in place of the list while it has no items: an `EmptyState`. */
  Empty: EmptyState,
  Footer: Popover.Footer,
});
