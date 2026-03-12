import React, { CSSProperties } from "react";

export interface GraphRowProps {
  children?: React.ReactNode;
  style?: CSSProperties;
  className?: string;
}

/**
 * A row inside a GraphCard.
 *
 * position: relative so a GraphHandle placed inside this row can use
 * position: absolute to anchor itself to the row's left or right edge,
 * vertically centred at the row's midpoint.
 */
export function GraphRow({ children, style, className }: GraphRowProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
