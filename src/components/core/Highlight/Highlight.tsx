import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, HighlightColor } from "../../../theme/types";
import styles from "./Highlight.module.css";

export type { HighlightColor };

export interface HighlightProps {
  /** Background tint — maps to Figma `HighlightedText` `color`. Default `yellow`. */
  color?: HighlightColor;
  theme?: CubeTheme;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function highlightCssVars(
  color: HighlightColor,
  tokens: ReturnType<typeof useTheme>
): Record<string, string> {
  const recipe = tokens.colors.functional.highlight[color];
  const geom = tokens.sizes.highlight;

  return {
    "--cube-highlight-bg": recipe.bgColor,
    "--cube-highlight-fg": recipe.fgColor,
    "--cube-highlight-paddingInline": geom.paddingInline,
    "--cube-highlight-paddingBlock": geom.paddingBlock,
    "--cube-highlight-borderRadius": geom.borderRadius,
  };
}

/**
 * Inline marker emphasis inside body copy. Renders semantic `<mark>` and inherits
 * surrounding font metrics — pair with {@link Text} `variant="bodyMedium"`.
 */
export function Highlight({
  color = "yellow",
  theme,
  className,
  style,
  children,
}: HighlightProps) {
  const tokens = useTheme(theme);

  return (
    <mark
      className={[styles.Highlight, className].filter(Boolean).join(" ")}
      style={{ ...highlightCssVars(color, tokens), ...style }}
    >
      {children}
    </mark>
  );
}
