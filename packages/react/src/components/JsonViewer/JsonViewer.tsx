import React from "react";
import type { CubeTheme } from "../../theme/types";

export type JsonViewerMode = "table" | "code";

export interface JsonViewerProps {
  /** The JSON data to display */
  data: unknown;
  /** Which view to start in (defaults to "code") */
  defaultMode?: JsonViewerMode;
  /** Override any theme tokens for this instance */
  theme?: CubeTheme;
}

/**
 * Top-level component that toggles between JsonCodeView and DataGrid views.
 * Toggle UI and wiring TBD — requirements coming soon.
 */
export function JsonViewer({ data, defaultMode = "code" }: JsonViewerProps) {
  return (
    <div style={{ fontFamily: "sans-serif", fontSize: 14, padding: 16 }}>
      <em>JsonViewer placeholder — mode: {defaultMode}</em>
      <pre style={{ marginTop: 8 }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
