import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, ThemeTokens } from "../../../theme/types";
import styles from "./Icon.module.css";

export type IconSize = "xs" | "sm" | "md" | "lg";

type IconStop = keyof ThemeTokens["sizes"]["iconButton"];

const SIZE_TO_STOP: Record<IconSize, IconStop> = {
  xs: "extraSmall",
  sm: "small",
  md: "medium",
  lg: "large",
};

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
    ? (() => {
        const stop = SIZE_TO_STOP[size];
        const cssSeg = stop.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
        const geom = tokens.sizes.iconButton[stop];
        return {
          [`--cube-iconButton-${cssSeg}-icon`]: geom.icon,
        } as React.CSSProperties;
      })()
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
