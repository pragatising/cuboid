import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme } from "../../../theme/types";
import styles from "./Divider.module.css";

export type DividerColor = "default" | "muted";

export interface DividerProps {
  /** Horizontal rule spanning the container width (default). */
  orientation?: "horizontal";
  color?: DividerColor;
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
}

function dividerCssVars(
  color: DividerColor,
  tokens: ReturnType<typeof useTheme>
): Record<string, string> {
  const border = tokens.colors.functional.border;
  return {
    "--divider-color": color === "muted" ? border.muted : border.default,
    "--divider-thickness": tokens.sizes.borderWidth.thin,
  };
}

/** Horizontal separator using functional border tokens. */
export function Divider({
  orientation = "horizontal",
  color = "default",
  theme,
  className,
  style,
}: DividerProps) {
  const tokens = useTheme(theme);

  return (
    <hr
      className={[styles.Divider, styles[`Divider--${orientation}`], className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...dividerCssVars(color, tokens), ...style }}
      aria-hidden={orientation === "horizontal" ? undefined : true}
    />
  );
}
