import React from "react";
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

function SelectionCheckIcon() {
  return (
    <svg
      className={styles.SelectionCheck}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      focusable={false}
    >
      <path
        d="M6.5 10.2 8.8 12.5 13.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SubmenuChevronIcon() {
  return (
    <svg
      className={styles.SubmenuChevron}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      focusable={false}
    >
      <path
        d="M8 6.5 12 10l-4 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Single row in an `ActionMenuList` — maps to Figma `ActionMenuItem`. */
export function ActionMenuItem({
  children,
  subtext,
  subtextIcon,
  selected = false,
  showSelectionCheck,
  leadingIcon,
  hasSubmenu = false,
  trailingIcon,
  keepOpenOnSelect = false,
  theme,
  className,
  disabled,
  type = "button",
  ...rest
}: ActionMenuItemProps) {
  const tokens = useTheme(theme);
  const showCheck = selected && showSelectionCheck !== false;

  const classNames = [
    styles.ActionMenuItem,
    selected ? styles["ActionMenuItem--selected"] : null,
    subtext ? styles["ActionMenuItem--withSubtext"] : null,
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
      data-keep-open={keepOpenOnSelect ? "true" : undefined}
      {...rest}
    >
      <span className={styles.ActionMenuItemInner}>
        {leadingIcon ? (
          <span className={styles.IconSlot}>{decorateIcon(leadingIcon, styles.IconSlot)}</span>
        ) : null}

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

        {trailingIcon ? (
          <span className={styles.TrailingSlot}>
            {decorateIcon(trailingIcon, styles.TrailingSlot)}
          </span>
        ) : null}

        {hasSubmenu ? (
          <span className={styles.TrailingSlot}>
            <SubmenuChevronIcon />
          </span>
        ) : null}

        {showCheck ? (
          <span className={styles.TrailingSlot}>
            <SelectionCheckIcon />
          </span>
        ) : null}
      </span>
    </button>
  );
}
