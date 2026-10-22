import React, { useMemo } from "react";
import { clsx } from "clsx";
import { useProvidedRefOrCreate, useRovingFocus } from "../../../behaviors";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { Box } from "../Box";
import { ActionMenuContext } from "./ActionMenuContext";
import type { ActionMenuSelectionMode } from "./ActionMenuContext";
import { actionMenuVars } from "./actionMenuVars";
import classes from "./ActionMenuList.module.css";

export type ActionMenuListProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "color"> & {
  /** `ActionMenu.Item`s and `ActionMenu.Section`s. */
  children: React.ReactNode;
  /** Whether the items choose from the list: `single` makes them radios, `multiple` checkboxes. Unset, they are plain actions. */
  selectionMode?: ActionMenuSelectionMode;
};

export type ActionMenuSectionProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "children" | "color"> & {
  label: React.ReactNode;
  children?: React.ReactNode;
};

function ActionMenuSection({ label, children, className, ...props }: ActionMenuSectionProps) {
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
 * The menu: a `role="menu"` list of items. Up and Down, Home, End and typing a letter move between them (`useRovingFocus`).
 * It works on its own, or inside an `ActionMenu` (which adds the trigger, the popover and closing).
 */
function ActionMenuListRoot({ children, className, selectionMode, ref, onKeyDown, ...props }: ActionMenuListProps) {
  const tokens = useTokens();
  const listRef = useProvidedRefOrCreate<HTMLDivElement>(ref);
  const { onKeyDown: navigate } = useRovingFocus({ containerRef: listRef });
  const context = useMemo(() => ({ selectionMode }), [selectionMode]);

  return (
    <ActionMenuContext.Provider value={context}>
      <Box
        {...mergeProps(
          {
            "data-component": "ActionMenu.List",
            role: "menu",
            "aria-multiselectable": selectionMode === "multiple" ? true : undefined,
            className: clsx(classes.ActionMenuList, className),
            style: actionMenuVars(tokens),
            onKeyDown: navigate,
          },
          { ...props, onKeyDown } as object,
        )}
        ref={listRef}
      >
        <div className={classes.ListItems}>{children}</div>
      </Box>
    </ActionMenuContext.Provider>
  );
}

export const ActionMenuList = Object.assign(ActionMenuListRoot, { Section: ActionMenuSection });
