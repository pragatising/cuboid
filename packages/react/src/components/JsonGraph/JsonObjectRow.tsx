import React, { CSSProperties } from "react";
import { useTokens } from "../../mode";
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
 * Uses the `bgColor.canvas.inset` background to visually distinguish
 * nested-object rows from plain key-value rows. Place a `<GraphHandle>`
 * as children to attach an edge to the target card.
 */
export function JsonObjectRow({ label, children, style }: JsonObjectRowProps) {
  const { text, fgColor, bgColor, space, size, borderRadius } = useTokens();
  return (
    <GraphRow
      style={{
        gap:          space.xs,
        padding:      `${space.xxs} ${space.xs}`,
        paddingRight: size["20"],                         // 20px — room for handle dot
        borderRadius: borderRadius.sm,                      // 4px
        background:   bgColor.canvas.inset,
        ...style,
      }}
    >
      <span
        style={{
          font:       text.size.md,
          color:      fgColor.neutral.default,
          flex:       1,
        }}
      >
        {label}
      </span>
      {children}
    </GraphRow>
  );
}
