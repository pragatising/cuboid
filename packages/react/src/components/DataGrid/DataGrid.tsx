import type { CubeTheme } from "../../theme/types";

export interface DataGridProps {
  /** JSON-serializable row data (shape TBD) */
  data: unknown;
  /** Override any theme tokens for this instance */
  theme?: CubeTheme;
}

/**
 * Table-style JSON viewer — implementation TBD.
 */
export function DataGrid({ data }: DataGridProps) {
  return (
    <div style={{ fontFamily: "sans-serif", fontSize: 14, padding: 16 }}>
      <em>DataGrid placeholder — data received:</em>
      <pre style={{ marginTop: 8 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
