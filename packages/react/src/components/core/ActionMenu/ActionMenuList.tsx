import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, ThemeTokens } from "../../../theme/types";
import { actionMenuCssVars } from "./actionMenuCssVars";
import styles from "./ActionMenuList.module.css";

export interface ActionMenuListProps {
  children: React.ReactNode;
  /** Accessible name when the menu has no visible title. */
  "aria-label"?: string;
  /** id of an element that labels the menu. */
  "aria-labelledby"?: string;
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export interface ActionMenuListRegionProps {
  children?: React.ReactNode;
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
}

export interface ActionMenuListSectionProps extends ActionMenuListRegionProps {
  label: React.ReactNode;
}

function regionStyle(
  theme: CubeTheme | undefined,
  tokens: ThemeTokens
): React.CSSProperties | undefined {
  return theme ? (actionMenuCssVars(tokens) as React.CSSProperties) : undefined;
}

function ActionMenuListHeader({
  children,
  theme,
  className,
  style,
}: ActionMenuListRegionProps) {
  const tokens = useTheme(theme);
  return (
    <div
      className={[styles.Header, className].filter(Boolean).join(" ")}
      style={{ ...regionStyle(theme, tokens), ...style }}
    >
      {children}
      <div className={styles.HeaderDivider} role="separator" />
    </div>
  );
}

function ActionMenuListFooter({
  children,
  theme,
  className,
  style,
}: ActionMenuListRegionProps) {
  const tokens = useTheme(theme);
  return (
    <div
      className={[styles.Footer, className].filter(Boolean).join(" ")}
      style={{ ...regionStyle(theme, tokens), ...style }}
    >
      {children}
    </div>
  );
}

function ActionMenuListSection({
  label,
  children,
  theme,
  className,
  style,
}: ActionMenuListSectionProps) {
  const tokens = useTheme(theme);
  return (
    <div
      className={[styles.Section, className].filter(Boolean).join(" ")}
      style={{ ...regionStyle(theme, tokens), ...style }}
      role="group"
      aria-label={typeof label === "string" ? label : undefined}
    >
      <div className={styles.SectionLabel}>{label}</div>
      <div className={styles.SectionItems}>{children}</div>
    </div>
  );
}

function isHeaderChild(child: React.ReactNode): boolean {
  return React.isValidElement(child) && child.type === ActionMenuListHeader;
}

function isFooterChild(child: React.ReactNode): boolean {
  return React.isValidElement(child) && child.type === ActionMenuListFooter;
}

/** Menu list container — maps to Figma `ActionMenu.List`. */
const ActionMenuListRoot = React.forwardRef<HTMLDivElement, ActionMenuListProps>(
  function ActionMenuList(
    {
      children,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      theme,
      className,
      style,
      onKeyDown,
      onClick,
    },
    ref
  ) {
    const tokens = useTheme(theme);
    const childArray = React.Children.toArray(children);
    const header = childArray.find((child) => isHeaderChild(child));
    const footer = childArray.find((child) => isFooterChild(child));
    const body = childArray.filter((child) => !isHeaderChild(child) && !isFooterChild(child));

    const inlineVars = theme ? (actionMenuCssVars(tokens) as React.CSSProperties) : undefined;

    return (
      <div
        ref={ref}
        role="menu"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={[styles.ActionMenuList, className].filter(Boolean).join(" ")}
        style={{ ...inlineVars, ...style }}
        onKeyDown={onKeyDown}
        onClick={onClick}
      >
        {header}
        <div className={styles.ListItems}>{body}</div>
        {footer}
      </div>
    );
  }
);

ActionMenuListRoot.displayName = "ActionMenuList";

export const ActionMenuList = Object.assign(ActionMenuListRoot, {
  Header: ActionMenuListHeader,
  Footer: ActionMenuListFooter,
  Section: ActionMenuListSection,
});
