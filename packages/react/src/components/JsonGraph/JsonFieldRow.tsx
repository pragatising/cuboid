import React, { CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { GraphRow } from "../Graph/GraphRow";

export interface JsonFieldRowProps {
  /** The field key — rendered in `foreground.default`. */
  label: string;
  /** The field value — rendered in `foreground.muted`. */
  value: string;
  style?: CSSProperties;
}

/**
 * A key + value pair row.
 *
 * Key is in `foreground.default`, value in `foreground.muted`.
 * 8px gap separates key from value.
 */
export function JsonFieldRow({ label, value, style }: JsonFieldRowProps) {
  const tokens = useTheme();
  const text: CSSProperties = {
    fontFamily:   tokens.typography.fontFamily.base,
    fontSize:     tokens.typography.fontSize.sm,
    lineHeight:   String(tokens.typography.lineHeight.normal),
    whiteSpace:   "nowrap",
    overflow:     "hidden",
    textOverflow: "ellipsis",
  };
  return (
    <GraphRow
      style={{
        gap:          tokens.sizes.space[2],                 // 8px key↔value
        padding:      `${tokens.sizes.space[1]} ${tokens.sizes.space[2]}`,
        borderRadius: tokens.sizes.borderRadius.sm,
        ...style,
      }}
    >
      <span style={{ ...text, color: tokens.colors.global.text.default }}>
        {label}:
      </span>
      <span style={{ ...text, color: tokens.colors.global.text.muted }}>
        {value}
      </span>
    </GraphRow>
  );
}
