import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { Box } from "../Box";
import { Icon } from "../Icon";
import { useActionMenuContext } from "./ActionMenuContext";
import { actionMenuVars } from "./actionMenuVars";
import classes from "./ActionMenuItem.module.css";

export type ActionMenuItemProps = Omit<React.ComponentPropsWithRef<"button">, "children" | "color" | "role"> & {
  /** The item's label. */
  children: React.ReactNode;
  /** A second line under the label. */
  description?: React.ReactNode;
  /** A small visual before the description. */
  descriptionVisual?: React.ReactNode;
  /** A visual before the label, usually an `Icon`. Hidden from assistive technology. */
  leadingVisual?: React.ReactNode;
  /** A visual after the label. Hidden from assistive technology. */
  trailingVisual?: React.ReactNode;
  /**
   * Whether the item is chosen: shows a trailing check and makes it a checkbox (or a radio, in a `selectionMode="single"`
   * list) with `aria-checked`. Leave unset for a plain action.
   */
  selected?: boolean;
  /** Show the check when `selected`. @default true */
  showSelectionCheck?: boolean;
  /** Only the leading visual is shown; the label becomes the accessible name. */
  iconOnly?: boolean;
  /** Shows a trailing chevron: the item opens something further. */
  hasSubmenu?: boolean;
  /** Keep the menu open after this item is activated (filters, multi-step menus). */
  keepOpenOnSelect?: boolean;
};

function decorate(visual: React.ReactNode, className: string) {
  if (!React.isValidElement(visual)) return visual;
  const element = visual as React.ReactElement<{ className?: string }>;
  return React.cloneElement(element, {
    className: clsx(className, element.props.className),
    "aria-hidden": true,
    focusable: false,
  } as Partial<{ className: string }>);
}

/**
 * One row of an action menu. Its colours and sizes are the `actionMenu` tokens, set as element-scoped variables on the row
 * itself (actionMenuVars.ts), so it also works outside an `ActionMenu.List` (a sidebar's nav).
 */
function ActionMenuItem({
  children,
  description,
  descriptionVisual,
  leadingVisual,
  trailingVisual,
  selected,
  showSelectionCheck = true,
  iconOnly = false,
  hasSubmenu = false,
  keepOpenOnSelect = false,
  className,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: ActionMenuItemProps) {
  const tokens = useTokens();
  const { selectionMode } = useActionMenuContext();
  const checkable = selected !== undefined || selectionMode !== undefined;
  const role = selectionMode === "single" ? "menuitemradio" : checkable ? "menuitemcheckbox" : "menuitem";
  const checked = selected === true;
  const name = iconOnly ? (ariaLabel ?? (typeof children === "string" ? children : undefined)) : ariaLabel;

  return (
    <Box
      as="button"
      {...mergeProps(
        {
          "data-component": "ActionMenu.Item",
          type: "button" as const,
          role,
          className: clsx(
            classes.ActionMenuItem,
            checked && classes["ActionMenuItem--selected"],
            description && classes["ActionMenuItem--withSubtext"],
            iconOnly && classes["ActionMenuItem--iconOnly"],
            className,
          ),
          disabled,
          "aria-disabled": disabled || undefined,
          "aria-checked": checkable ? checked : undefined,
          "aria-label": name,
          "data-keep-open": keepOpenOnSelect ? "true" : undefined,
          style: actionMenuVars(tokens),
        },
        props as object,
      )}
    >
      <span className={classes.ActionMenuItemInner}>
        {leadingVisual ? <span className={classes.IconSlot}>{decorate(leadingVisual, classes.IconSlot)}</span> : null}

        {!iconOnly ? (
          <span className={classes.Content}>
            <span className={classes.Label}>{children}</span>
            {description ? (
              <span className={classes.SubtextRow}>
                {descriptionVisual ? <span className={classes.SubtextIconSlot}>{decorate(descriptionVisual, classes.SubtextIconSlot)}</span> : null}
                <span className={classes.Subtext}>{description}</span>
              </span>
            ) : null}
          </span>
        ) : null}

        {trailingVisual ? <span className={classes.TrailingSlot}>{decorate(trailingVisual, classes.TrailingSlot)}</span> : null}

        {hasSubmenu ? (
          <span className={classes.TrailingSlot}>
            <Icon name="chevron_right" />
          </span>
        ) : null}

        {checked && showSelectionCheck ? (
          <span className={classes.TrailingSlot}>
            <Icon name="check" />
          </span>
        ) : null}
      </span>
    </Box>
  );
}

export { ActionMenuItem };
