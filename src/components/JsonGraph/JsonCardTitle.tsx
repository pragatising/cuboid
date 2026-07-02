import React, { CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";

export interface JsonCardTitleProps {
  children: React.ReactNode;
  style?: CSSProperties;
}

/**
 * Semi-bold card heading. Theme defaults, fully overrideable via `style`.
 *
 * Sets `position: relative` so a `JsonInputHandle` placed inside it can
 * anchor itself to the title row's left edge rather than the card's midpoint.
 */
export function JsonCardTitle({ children, style }: JsonCardTitleProps) {
  const tokens = useTheme();
  return (
    <div
      style={{
        position:   "relative",                              // anchor for JsonInputHandle
        fontFamily: tokens.typography.fontFamily.base,
        fontWeight: tokens.typography.fontWeight.semibold,
        fontSize:   tokens.typography.fontSize.sm,           // 14px
        lineHeight: String(tokens.typography.lineHeight.normal),
        color:      tokens.colors.global.text.default,
        padding:    `${tokens.sizes.space[1]} ${tokens.sizes.space[2]}`, // 4px 8px
        ...style,
      }}
    >
      {children}
    </div>
  );
}
