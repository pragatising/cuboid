/**
 * The status of each component, read from the repo's own tracker (docs/backlog/react-migration-tracker.md: one row per component,
 * updated in the commit that changes it). Status is a fact about the work, not about the code, so it cannot be derived: it is read
 * from where it is already kept, not kept a second time.
 */
export type Status = "Done" | "Seam done" | "Todo" | "On hold" | "Deleted";

const STATUSES: Status[] = ["Done", "Seam done", "Todo", "On hold", "Deleted"];

/** `InputField, InputText, TextArea` is three components; `Header (was SiteHeader)` and `CodeBlock (+ CodeSurface, syntax)` are one. */
export function namesIn(cell: string): string[] {
  return cell
    .replace(/\([^)]*\)/g, "")
    .split(",")
    .map((name) => name.replace(/[`*]/g, "").trim())
    .filter(Boolean);
}

const statusIn = (cell: string): Status | null => {
  const text = cell.replace(/[*`]/g, "").trim();
  return STATUSES.find((status) => status === text) ?? null;
};

/**
 * Component name -> status, from the tracker's tables. A table counts when its header has a `Component` and a `Status` column; the
 * rows under it name components (one or several to a row) and say where each stands.
 */
export function readStatuses(markdown: string): Record<string, Status> {
  const found: Record<string, Status> = {};
  let columns: { component: number; status: number } | null = null;
  for (const line of markdown.split("\n")) {
    if (!line.startsWith("|")) {
      columns = null;
      continue;
    }
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const component = cells.findIndex((cell) => cell === "Component");
    const status = cells.findIndex((cell) => cell === "Status");
    if (component !== -1 && status !== -1) {
      columns = { component, status };
      continue;
    }
    if (!columns || cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
    const value = statusIn(cells[columns.status] ?? "");
    if (!value) continue;
    for (const name of namesIn(cells[columns.component] ?? "")) found[name] = value;
  }
  return found;
}
