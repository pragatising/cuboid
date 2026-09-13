/**
 * Derives column headers and normalized rows from a JSON value.
 *
 * Supported shapes:
 *  - Array of objects  → columns from union of all keys, rows are the objects
 *  - Plain object      → two columns "Key" / "Value", one row per entry
 *  - Anything else     → single column "Value", single row
 */
export interface GridData {
  columns: string[];
  rows: Record<string, unknown>[];
}

export function flattenJson(data: unknown): GridData {
  if (Array.isArray(data) && data.length > 0 && isPlainObject(data[0])) {
    const columns = unionKeys(data as Record<string, unknown>[]);
    return { columns, rows: data as Record<string, unknown>[] };
  }

  if (isPlainObject(data)) {
    const obj = data as Record<string, unknown>;
    return {
      columns: ["Key", "Value"],
      rows: Object.entries(obj).map(([k, v]) => ({ Key: k, Value: v })),
    };
  }

  return { columns: ["Value"], rows: [{ Value: data }] };
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function unionKeys(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      seen.add(key);
    }
  }
  return Array.from(seen);
}

/**
 * Converts a cell value to a human-readable string for display in the table.
 * Objects / arrays are pretty-printed as compact JSON.
 */
export function cellToString(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
