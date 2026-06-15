import React, { forwardRef } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import { functionalSurfaceCubeOverride } from "../../../theme/themeCubeOverride";
import { Stack, type StackProps } from "../Stack";
import styles from "./Box.module.css";
import type {
  BoxBackground,
  BoxBorder,
  BoxBorderRadius,
  BoxForeground,
  BoxOverflow,
} from "./boxTypes";

export type {
  BoxBackground,
  BoxBorder,
  BoxBorderRadius,
  BoxForeground,
  BoxOverflow,
} from "./boxTypes";

export interface BoxProps extends StackProps {
  /** Functional background role. */
  background?: BoxBackground;
  /** Border style — `none` (default), `default`, or `muted`. */
  border?: BoxBorder;
  /** Corner radius from `sizes.borderRadius`. */
  borderRadius?: BoxBorderRadius;
  /** Shorthand overflow — use `overflowX` / `overflowY` in `style` to override an axis. */
  overflow?: BoxOverflow;
  /** Functional foreground role for inherited text colour. */
  foreground?: BoxForeground;
}

function boxModifierClasses(props: {
  background?: BoxBackground;
  border?: BoxBorder;
  borderRadius?: BoxBorderRadius;
  overflow?: BoxOverflow;
  foreground?: BoxForeground;
}): string[] {
  const classes = [styles.Box];

  if (props.background) {
    classes.push(styles[`Box--bg-${props.background}` as keyof typeof styles]);
  }
  if (props.border === "default") {
    classes.push(styles["Box--border-default"]);
  } else if (props.border === "muted") {
    classes.push(styles["Box--border-muted"]);
  }
  if (props.borderRadius) {
    classes.push(styles[`Box--radius-${props.borderRadius}` as keyof typeof styles]);
  }
  if (props.overflow) {
    classes.push(styles[`Box--overflow-${props.overflow}` as keyof typeof styles]);
  }
  if (props.foreground) {
    classes.push(styles[`Box--fg-${props.foreground}` as keyof typeof styles]);
  }

  return classes;
}

/**
 * Generic styled surface + flex layout primitive.
 *
 * Surface styles use global `--cube-*` tokens via CSS module modifiers (same
 * pattern as {@link Button}). Local `theme` overrides re-bind those `--cube-*`
 * names on this element only.
 */
export const Box = forwardRef<HTMLElement, BoxProps>(function Box(
  {
    background,
    border = "none",
    borderRadius,
    overflow,
    foreground,
    theme,
    className,
    style,
    children,
    ...stackProps
  },
  ref,
) {
  const tokens = useTheme(theme);

  const classNames = [
    ...boxModifierClasses({ background, border, borderRadius, overflow, foreground }),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const themeOverride = theme
    ? (functionalSurfaceCubeOverride(tokens) as React.CSSProperties)
    : undefined;

  return (
    <Stack
      ref={ref}
      className={classNames}
      style={{ ...themeOverride, ...style }}
      {...stackProps}
    >
      {children}
    </Stack>
  );
});
