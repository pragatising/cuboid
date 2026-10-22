import React, { CSSProperties } from "react";
import { useTokens } from "../../mode";

export interface JsonCardTitleProps {
  children: React.ReactNode;
  style?: CSSProperties;
}

/**
 * Semi-bold card heading. Token defaults, fully overrideable via `style`.
 *
 * Sets `position: relative` so a `JsonInputHandle` placed inside it can
 * anchor itself to the title row's left edge rather than the card's midpoint.
 */
export function JsonCardTitle({ children, style }: JsonCardTitleProps) {
  const { text, fontWeight, fgColor, space } = useTokens();
  return (
    <div
      style={{
        position:   "relative",                              // anchor for JsonInputHandle
        font:       text.size.md,                            // 14px
        fontWeight: fontWeight.semibold,
        color:      fgColor.neutral.default,
        padding:    `${space.xxs} ${space.xs}`,              // 4px 8px
        ...style,
      }}
    >
      {children}
    </div>
  );
}
