import React, { CSSProperties } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, SpaceKey } from "../../../theme/types";

export interface StackProps {
  /** HTML element or component to render as (default: div) */
  as?: React.ElementType;
  /** Flex direction */
  direction?: "horizontal" | "vertical";
  /** Gap between children — references the space scale (e.g. 3 = 12px) */
  gap?: SpaceKey | 0;
  /** Padding on the container — references the space scale */
  padding?: SpaceKey | 0;
  /** align-items */
  align?: CSSProperties["alignItems"];
  /** justify-content */
  justify?: CSSProperties["justifyContent"];
  /** Allow children to wrap */
  wrap?: boolean;
  /** Override any theme tokens */
  theme?: CubeTheme;
  style?: CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Flex-based layout primitive. Replaces raw <div> usage for arranging
 * children horizontally or vertically with consistent spacing.
 */
export function Stack({
  as: As = "div",
  direction = "vertical",
  gap,
  padding,
  align,
  justify,
  wrap = false,
  theme,
  style,
  className,
  children,
}: StackProps) {
  const tokens = useTheme(theme);
  const { space } = tokens.sizes;

  const gapValue = gap === 0 ? "0px" : gap !== undefined ? space[gap] : undefined;
  const paddingValue = padding === 0 ? "0px" : padding !== undefined ? space[padding] : undefined;

  return (
    <As
      className={className}
      style={{
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        gap: gapValue,
        padding: paddingValue,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? "wrap" : undefined,
        ...style,
      }}
    >
      {children}
    </As>
  );
}
