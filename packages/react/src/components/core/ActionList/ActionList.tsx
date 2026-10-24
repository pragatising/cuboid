import React, { useMemo } from "react";
import { clsx } from "clsx";
import { useProvidedRefOrCreate, useRovingFocus } from "../../../behaviors";
import { mergeProps } from "../../../utils/mergeProps";
import { Box } from "../Box";
import { ActionListContext } from "./ActionListContext";
import type { ActionListRole, ActionListSelectionMode } from "./ActionListContext";
import classes from "./ActionList.module.css";

export type ActionListProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "color"> & {
  /** `ActionMenu.Item`s and `ActionMenu.Section`s. */
  children: React.ReactNode;
  /**
   * `menu` is a list of actions; `listbox` is a list to choose from, whose items are options (`aria-selected`). The items follow it.
   * @default "menu"
   */
  role?: ActionListRole;
  /** Whether the items choose from the list: `single` makes them radios, `multiple` checkboxes. Unset, they are plain actions. */
  selectionMode?: ActionListSelectionMode;
};

export type ActionListSectionProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "children" | "color"> & {
  label: React.ReactNode;
  children?: React.ReactNode;
};

function ActionListSection({ label, children, className, ...props }: ActionListSectionProps) {
  return (
    <Box
      {...mergeProps(
        {
          "data-component": "ActionMenu.Section",
          className: clsx(classes.Section, className),
          role: "group",
          "aria-label": typeof label === "string" ? label : undefined,
        },
        props as object,
      )}
    >
      <div className={classes.SectionLabel}>{label}</div>
      <div className={classes.SectionItems}>{children}</div>
    </Box>
  );
}

/**
 * The list: a `role="menu"` (or, with `role="listbox"`, a list of options) of items. Up and Down, Home, End and typing a letter move between them (`useRovingFocus`).
 * It works on its own, or inside an `ActionMenu` (which adds the trigger, the popover and closing).
 */
function ActionListRoot({ children, className, selectionMode, role = "menu", ref, onKeyDown, ...props }: ActionListProps) {
  const listRef = useProvidedRefOrCreate<HTMLDivElement>(ref);
  const { onKeyDown: navigate } = useRovingFocus({ containerRef: listRef, itemSelector: role === "listbox" ? '[role="option"]' : undefined });
  const context = useMemo(() => ({ selectionMode, role }), [selectionMode, role]);

  return (
    <ActionListContext.Provider value={context}>
      <Box
        {...mergeProps(
          {
            "data-component": "ActionMenu.List",
            role,
            "aria-multiselectable": selectionMode === "multiple" ? true : undefined,
            className: clsx(classes.ActionList, className),
            onKeyDown: navigate,
          },
          { ...props, onKeyDown } as object,
        )}
        ref={listRef}
      >
        <div className={classes.ListItems}>{children}</div>
      </Box>
    </ActionListContext.Provider>
  );
}

export const ActionList = Object.assign(ActionListRoot, { Section: ActionListSection });
