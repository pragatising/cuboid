import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { Icon } from "../Icon";
import { actionMenuVars } from "./actionMenuVars";
import classes from "./ActionMenuItem.module.css";

export type ActionMenuItemProps = Omit<React.ComponentPropsWithRef<"button">, "children"> & {
  children: React.ReactNode;
  subtext?: React.ReactNode;
  subtextIcon?: React.ReactNode;
  /** Marks the current selection: shows a trailing checkmark by default. */
  selected?: boolean;
  /** @default true when `selected` */
  showSelectionCheck?: boolean;
  leadingIcon?: React.ReactNode;
  /** Icon-only row: hides the label; use `aria-label` or string `children` for the accessible name. */
  iconOnly?: boolean;
  /** Renders a trailing chevron for submenu affordance. */
  hasSubmenu?: boolean;
  trailingIcon?: React.ReactNode;
  /** Keep the menu open after this item is activated (filter / multi-step menus). */
  keepOpenOnSelect?: boolean;
};

function decorateIcon(icon: React.ReactNode, className: string) {
  if (!React.isValidElement(icon)) return icon;
  const element = icon as React.ReactElement<{ className?: string }>;
  return React.cloneElement(element, {
    className: clsx(className, element.props.className),
    "aria-hidden": true,
    focusable: false,
  } as Partial<{ className: string }>);
}

/**
 * Single row of an action menu. Its colours and sizes come from the `actionMenu` tokens, set as element-scoped
 * variables on the row itself (see actionMenuVars.ts), so it also works outside an `ActionMenuList` (a sidebar's nav).
 */
export function ActionMenuItem({
  children,
  subtext,
  subtextIcon,
  selected = false,
  showSelectionCheck,
  leadingIcon,
  iconOnly = false,
  hasSubmenu = false,
  trailingIcon,
  keepOpenOnSelect = false,
  className,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: ActionMenuItemProps) {
  const tokens = useTokens();
  const showCheck = selected && showSelectionCheck !== false;
  const resolvedAriaLabel = iconOnly ? (ariaLabel ?? (typeof children === "string" ? children : undefined)) : ariaLabel;

  return (
    <button
      {...mergeProps(
        {
          "data-component": "ActionMenuItem",
          type: "button" as const,
          role: "menuitem",
          className: clsx(
            classes.ActionMenuItem,
            selected && classes["ActionMenuItem--selected"],
            subtext && classes["ActionMenuItem--withSubtext"],
            iconOnly && classes["ActionMenuItem--iconOnly"],
            className,
          ),
          disabled,
          "aria-disabled": disabled || undefined,
          "aria-checked": selected || undefined,
          "aria-label": resolvedAriaLabel,
          "data-keep-open": keepOpenOnSelect ? "true" : undefined,
          style: actionMenuVars(tokens),
        },
        props,
      )}
    >
      <span className={classes.ActionMenuItemInner}>
        {leadingIcon ? <span className={classes.IconSlot}>{decorateIcon(leadingIcon, classes.IconSlot)}</span> : null}

        {!iconOnly ? (
          <span className={classes.Content}>
            <span className={classes.Label}>{children}</span>
            {subtext ? (
              <span className={classes.SubtextRow}>
                {subtextIcon ? (
                  <span className={classes.SubtextIconSlot}>{decorateIcon(subtextIcon, classes.SubtextIconSlot)}</span>
                ) : null}
                <span className={classes.Subtext}>{subtext}</span>
              </span>
            ) : null}
          </span>
        ) : null}

        {trailingIcon ? <span className={classes.TrailingSlot}>{decorateIcon(trailingIcon, classes.TrailingSlot)}</span> : null}

        {hasSubmenu ? (
          <span className={classes.TrailingSlot}>
            <Icon name="chevron_right" />
          </span>
        ) : null}

        {showCheck ? (
          <span className={classes.TrailingSlot}>
            <Icon name="check" />
          </span>
        ) : null}
      </span>
    </button>
  );
}
