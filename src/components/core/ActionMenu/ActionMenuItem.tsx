import React from "react";
import { CheckIcon, ChevronRightIcon } from "../../../icons/material";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import { actionMenuCssVars } from "./actionMenuCssVars";
import styles from "./ActionMenuItem.module.css";

export interface ActionMenuItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: React.ReactNode;
  subtext?: React.ReactNode;
  subtextIcon?: React.ReactNode;
  /** Marks the current selection — shows trailing checkmark by default. */
  selected?: boolean;
  /** @default true when `selected` */
  showSelectionCheck?: boolean;
  leadingIcon?: React.ReactNode;
  /** Icon-only row — hides the label; use `aria-label` or string `children` for the accessible name. */
  iconOnly?: boolean;
  /** Renders a trailing chevron for submenu affordance. */
  hasSubmenu?: boolean;
  trailingIcon?: React.ReactNode;
  /** Keep the menu open after this item is activated (filter / multi-step menus). */
  keepOpenOnSelect?: boolean;
  theme?: CubeTheme;
}

function decorateIcon(icon: React.ReactNode, className: string) {
  if (!React.isValidElement(icon)) return icon;
  return React.cloneElement(icon as React.ReactElement<any>, {
    className: [className, (icon as any).props?.className].filter(Boolean).join(" "),
    "aria-hidden": true,
    focusable: false,
  });
}

/** Single row in an `ActionMenuList` — maps to Figma `ActionMenuItem`. */
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
  theme,
  className,
  disabled,
  type = "button",
  "aria-label": ariaLabel,
  ...rest
}: ActionMenuItemProps) {
  const tokens = useTheme(theme);
  const showCheck = selected && showSelectionCheck !== false;

  const resolvedAriaLabel = iconOnly
    ? (ariaLabel ?? (typeof children === "string" ? children : undefined))
    : ariaLabel;

  const classNames = [
    styles.ActionMenuItem,
    selected ? styles["ActionMenuItem--selected"] : null,
    subtext ? styles["ActionMenuItem--withSubtext"] : null,
    iconOnly ? styles["ActionMenuItem--iconOnly"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineVars = theme ? (actionMenuCssVars(tokens) as React.CSSProperties) : undefined;

  return (
    <button
      type={type}
      role="menuitem"
      className={classNames}
      style={inlineVars}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-checked={selected || undefined}
      aria-label={resolvedAriaLabel}
      data-keep-open={keepOpenOnSelect ? "true" : undefined}
      {...rest}
    >
      <span className={styles.ActionMenuItemInner}>
        {leadingIcon ? (
          <span className={styles.IconSlot}>{decorateIcon(leadingIcon, styles.IconSlot)}</span>
        ) : null}

        {!iconOnly ? (
          <span className={styles.Content}>
            <span className={styles.Label}>{children}</span>
            {subtext ? (
              <span className={styles.SubtextRow}>
                {subtextIcon ? (
                  <span className={styles.SubtextIconSlot}>
                    {decorateIcon(subtextIcon, styles.SubtextIconSlot)}
                  </span>
                ) : null}
                <span className={styles.Subtext}>{subtext}</span>
              </span>
            ) : null}
          </span>
        ) : null}

        {trailingIcon ? (
          <span className={styles.TrailingSlot}>
            {decorateIcon(trailingIcon, styles.TrailingSlot)}
          </span>
        ) : null}

        {hasSubmenu ? (
          <span className={styles.TrailingSlot}>
            <ChevronRightIcon />
          </span>
        ) : null}

        {showCheck ? (
          <span className={styles.TrailingSlot}>
            <CheckIcon />
          </span>
        ) : null}
      </span>
    </button>
  );
}
