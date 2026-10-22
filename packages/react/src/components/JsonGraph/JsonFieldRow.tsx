import React, { CSSProperties } from "react";
import { useTokens } from "../../mode";
import { GraphRow } from "../Graph/GraphRow";

export interface JsonFieldRowProps {
  /** The field key — rendered in `fgColor.neutral.default`. */
  label: string;
  /** The field value — rendered in `fgColor.neutral.muted`. */
  value: string;
  style?: CSSProperties;
}

/**
 * A key + value pair row.
 *
 * Key is in `fgColor.neutral.default`, value in `fgColor.neutral.muted`.
 * 8px gap separates key from value.
 */
export function JsonFieldRow({ label, value, style }: JsonFieldRowProps) {
  const { text: textTokens, fgColor, space, borderRadius } = useTokens();
  const text: CSSProperties = {
    font:         textTokens.size.md,
    whiteSpace:   "nowrap",
    overflow:     "hidden",
    textOverflow: "ellipsis",
  };
  return (
    <GraphRow
      style={{
        gap:          space.xs,                              // 8px key↔value
        padding:      `${space.xxs} ${space.xs}`,
        borderRadius: borderRadius.sm,
        ...style,
      }}
    >
      <span style={{ ...text, color: fgColor.neutral.default }}>
        {label}:
      </span>
      <span style={{ ...text, color: fgColor.neutral.muted }}>
        {value}
      </span>
    </GraphRow>
  );
}
