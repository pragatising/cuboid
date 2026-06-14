import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { resolveGlobalColorOrCss } from "../../../theme/globalColor";
import type { CubeTheme, GlobalColorPath } from "../../../theme/types";
import styles from "./Divider.module.css";

export type DividerColor = GlobalColorPath;

export interface DividerProps {
  /** Horizontal rule spanning the container width (default). */
  orientation?: "horizontal";
  /**
   * Line color from `colors.global`, or any CSS color string.
   * @default "border.gray.2"
   */
  color?: DividerColor;
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
}

function dividerCssVars(
  color: GlobalColorPath,
  tokens: ReturnType<typeof useTheme>
): Record<string, string> {
  return {
    "--divider-color": resolveGlobalColorOrCss(color, tokens.colors.global, {
      default: "border.gray.2",
      muted: "border.grayAlpha.2",
    }),
    "--divider-thickness": tokens.sizes.borderWidth.thin,
  };
}

/** Horizontal separator using global border tokens. */
export function Divider({
  orientation = "horizontal",
  color = "border.gray.2",
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
