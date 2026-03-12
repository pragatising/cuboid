import React from "react";
import type { DataGridTheme } from "../../theme/types";

export interface DataGridProps {
  /** The JSON data to render as a table */
  data: unknown;
  /** Override any theme tokens for this instance */
  theme?: DataGridTheme;
}

/**
 * Renders JSON data as an HTML table.
 * Implementation TBD — requirements coming soon.
 */
export function DataGrid({ data }: DataGridProps) {
  return (
    <div style={{ fontFamily: "sans-serif", fontSize: 14, padding: 16 }}>
      <em>DataGrid placeholder — data received:</em>
      <pre style={{ marginTop: 8 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
