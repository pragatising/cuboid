import React, { CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { GraphRow } from "../Graph/GraphRow";

export interface JsonObjectRowProps {
  /**
   * The field key that links to a nested object or array card.
   * Rendered as plain text — the row's inset background signals it's a link.
   */
  label: string;
  /**
   * Slot for a `<GraphHandle side="right" />`.
   * The row reserves right-padding automatically so the dot doesn't overlap text.
   */
  children?: React.ReactNode;
  style?: CSSProperties;
}

/**
 * A row that represents a link to a nested object or array card.
 *
 * Uses `base.gray[0]` (canvas/inset) background to visually distinguish
 * nested-object rows from plain key-value rows. Place a `<GraphHandle>`
 * as children to attach an edge to the target card.
 */
export function JsonObjectRow({ label, children, style }: JsonObjectRowProps) {
  const tokens = useTheme();
  return (
    <GraphRow
      style={{
        gap:          tokens.sizes.space[2],
        padding:      `${tokens.sizes.space[1]} ${tokens.sizes.space[2]}`,
        paddingRight: tokens.sizes.space[5],                // 20px — room for handle dot
        borderRadius: tokens.sizes.borderRadius.sm,         // 4px
        background:   tokens.colors.base.gray[0],           // canvas/inset #f6f8fa
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: tokens.typography.fontFamily.base,
          fontSize:   tokens.typography.fontSize.sm,
          lineHeight: String(tokens.typography.lineHeight.normal),
          color:      tokens.colors.functional.foreground.default,
          flex:       1,
        }}
      >
        {label}
      </span>
      {children}
    </GraphRow>
  );
}
