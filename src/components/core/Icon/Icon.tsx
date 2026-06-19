import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, IconSizesTokens } from "../../../theme/types";
import styles from "./Icon.module.css";

export type IconSize = keyof IconSizesTokens;

const SIZE_CLASS: Record<IconSize, string> = {
  xs: styles["Icon--size-xs"],
  sm: styles["Icon--size-sm"],
  md: styles["Icon--size-md"],
  lg: styles["Icon--size-lg"],
};

export interface IconProps {
  /** SVG element — use `fill="currentColor"` (or stroke) so color inherits from context. */
  children: React.ReactElement;
  size?: IconSize;
  /** When set, exposes `role="img"` + `aria-label`; otherwise the icon is decorative. */
  label?: string;
  theme?: CubeTheme;
  className?: string;
}

export function Icon({ children, size = "sm", label, theme, className }: IconProps) {
  const tokens = useTheme(theme);

  const inlineVars = theme
    ? ({
        [`--cube-icon-${size}`]: tokens.sizes.icon[size],
      } as React.CSSProperties)
    : undefined;

  const classNameMerged = [styles.Icon, SIZE_CLASS[size], className].filter(Boolean).join(" ");

  const svg = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        "aria-hidden": label ? undefined : true,
        focusable: false,
        ...((children as React.ReactElement<Record<string, unknown>>).props ?? {}),
      })
    : children;

  if (label) {
    return (
      <span
        className={classNameMerged}
        style={inlineVars}
        role="img"
        aria-label={label}
      >
        {svg}
      </span>
    );
  }

  return (
    <span className={classNameMerged} style={inlineVars} aria-hidden>
      {svg}
    </span>
  );
}
