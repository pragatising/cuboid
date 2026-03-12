/**
 * Converts any JSON-compatible value into a flat array of CodeLines.
 *
 * Two-pass design:
 *   1. walkValue() recurses through the data, building lines while respecting
 *      the current collapsedPaths set (collapsed subtrees are skipped).
 *   2. The caller re-runs buildLines() whenever collapsedPaths changes,
 *      which also recomputes sequential line numbers automatically.
 *
 * No external dependencies — pure TypeScript.
 */

// ── Token types ───────────────────────────────────────────────────────────────

export type TokenType =
  | "key"          // object key      → "name"
  | "string"       // plain string    → "Alice"
  | "string_url"   // URL string      → "https://…"
  | "string_email" // email string    → "user@example.com"
  | "string_uuid"  // UUID string     → "550e8400-…"
  | "number"       // number value    → 42
  | "boolean"      // true / false — purple, no sentiment implied
  | "null"         // null
  | "bracket"      // { } [ ]
  | "operator"     // : (key separator)
  | "punctuation"  // , (trailing comma)
  | "ellipsis";    // … (shown when a node is collapsed)

export interface Token {
  type: TokenType;
  value: string;
}

// ── Line descriptor ───────────────────────────────────────────────────────────

export interface CodeLine {
  /** 1-indexed. Recomputed every render pass so it stays correct after collapse. */
  lineNumber: number;
  /** Nesting depth — drives visual indentation. */
  depth: number;
  /** Ordered list of styled tokens that make up this line's content. */
  tokens: Token[];
  /**
   * Present on opening-bracket lines (the first line of an object/array).
   * Used as the key into collapsedPaths and as the toggle button's identifier.
   */
  collapseKey?: string;
  /**
   * True when collapseKey is set and the node is currently collapsed.
   * Drives which chevron is rendered (▶ vs ▼).
   */
  isCollapsed?: boolean;
  /**
   * "summary" rows are the `… N lines` placeholder emitted between the opening
   * and closing bracket of a collapsed node. Rendered with a muted highlight.
   */
  kind?: "summary";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build the full list of visible CodeLines for the given data and collapse state.
 * Call again whenever collapsedPaths changes.
 */
export function buildLines(
  data: unknown,
  collapsedPaths: Set<string>
): CodeLine[] {
  const lines: CodeLine[] = [];
  const counter = { n: 1 };
  walkValue(data, undefined, "root", 0, true, collapsedPaths, lines, counter);
  return lines;
}

/**
 * Collect every JSON path that CAN be collapsed (i.e. every non-empty object/array).
 * Used to initialise the fully-collapsed state.
 */
export function getAllCollapsiblePaths(
  data: unknown,
  path = "root"
): Set<string> {
  const paths = new Set<string>();
  if (Array.isArray(data) && data.length > 0) {
    paths.add(path);
    data.forEach((item, i) =>
      getAllCollapsiblePaths(item, `${path}[${i}]`).forEach((p) =>
        paths.add(p)
      )
    );
  } else if (isPlainObject(data)) {
    const entries = Object.entries(data as object);
    if (entries.length > 0) {
      paths.add(path);
      entries.forEach(([k, v]) =>
        getAllCollapsiblePaths(v, `${path}.${k}`).forEach((p) => paths.add(p))
      );
    }
  }
  return paths;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Count how many lines a subtree would produce when fully expanded.
 * Used to display "… N lines" in the summary row of a collapsed node.
 */
function countSubtreeLines(value: unknown): number {
  const lines: CodeLine[] = [];
  const counter = { n: 1 };
  walkValue(value, undefined, "__count__", 0, true, new Set(), lines, counter);
  return lines.length;
}

// String subtype detection — applied to raw string values (before quoting).
const RE_URL   = /^https?:\/\/[^\s"]+$/;
const RE_EMAIL = /^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/;
// UUID v1–v5: 8-4-4-4-12 hex digits
const RE_UUID  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function classifyString(raw: string): TokenType {
  if (RE_URL.test(raw))   return "string_url";
  if (RE_EMAIL.test(raw)) return "string_email";
  if (RE_UUID.test(raw))  return "string_uuid";
  return "string";
}

/** Tokens that prefix a value — object key with colon only. Array items have no prefix. */
function keyPrefix(key: string | number | undefined): Token[] {
  if (key === undefined || typeof key === "number") return [];
  return [
    { type: "key", value: `"${key}"` },
    { type: "operator", value: ": " },
  ];
}

function comma(isLast: boolean): Token[] {
  return isLast ? [] : [{ type: "punctuation", value: "," }];
}

// ── Walker ────────────────────────────────────────────────────────────────────

function walkValue(
  value: unknown,
  key: string | number | undefined,
  path: string,
  depth: number,
  isLast: boolean,
  collapsedPaths: Set<string>,
  lines: CodeLine[],
  counter: { n: number }
): void {
  if (Array.isArray(value)) {
    walkArray(value, key, path, depth, isLast, collapsedPaths, lines, counter);
  } else if (isPlainObject(value)) {
    walkObject(
      value as Record<string, unknown>,
      key,
      path,
      depth,
      isLast,
      collapsedPaths,
      lines,
      counter
    );
  } else {
    walkPrimitive(value, key, depth, isLast, lines, counter);
  }
}

function walkPrimitive(
  value: unknown,
  key: string | number | undefined,
  depth: number,
  isLast: boolean,
  lines: CodeLine[],
  counter: { n: number }
): void {
  const tokens: Token[] = [...keyPrefix(key)];

  if (value === null) {
    tokens.push({ type: "null", value: "null" });
  } else if (typeof value === "boolean") {
    tokens.push({ type: "boolean", value: String(value) });
  } else if (typeof value === "number") {
    tokens.push({ type: "number", value: String(value) });
  } else {
    const raw = String(value);
    tokens.push({
      type: classifyString(raw),
      value: `"${raw.replace(/"/g, '\\"')}"`,
    });
  }

  tokens.push(...comma(isLast));
  lines.push({ lineNumber: counter.n++, depth, tokens });
}

function walkArray(
  value: unknown[],
  key: string | number | undefined,
  path: string,
  depth: number,
  isLast: boolean,
  collapsedPaths: Set<string>,
  lines: CodeLine[],
  counter: { n: number }
): void {
  const prefix = keyPrefix(key);
  const isEmpty = value.length === 0;
  const isCollapsed = !isEmpty && collapsedPaths.has(path);

  if (isEmpty) {
    lines.push({
      lineNumber: counter.n++,
      depth,
      tokens: [...prefix, { type: "bracket", value: "[]" }, ...comma(isLast)],
    });
    return;
  }

  if (isCollapsed) {
    const count = countSubtreeLines(value);
    lines.push({
      lineNumber: counter.n++,
      depth,
      tokens: [
        ...prefix,
        { type: "bracket", value: "[" },
        { type: "ellipsis", value: ` … ${count} lines ` },
        { type: "bracket", value: "]" },
        ...comma(isLast),
      ],
      collapseKey: path,
      isCollapsed: true,
    });
    return;
  }

  // Opening bracket line — carries the collapse toggle
  lines.push({
    lineNumber: counter.n++,
    depth,
    tokens: [...prefix, { type: "bracket", value: "[" }],
    collapseKey: path,
    isCollapsed: false,
  });

  // Children — pass the numeric index so walkValue can emit the [i] label
  value.forEach((item, i) =>
    walkValue(
      item,
      i,
      `${path}[${i}]`,
      depth + 1,
      i === value.length - 1,
      collapsedPaths,
      lines,
      counter
    )
  );

  // Closing bracket line
  lines.push({
    lineNumber: counter.n++,
    depth,
    tokens: [{ type: "bracket", value: "]" }, ...comma(isLast)],
  });
}

function walkObject(
  value: Record<string, unknown>,
  key: string | number | undefined,
  path: string,
  depth: number,
  isLast: boolean,
  collapsedPaths: Set<string>,
  lines: CodeLine[],
  counter: { n: number }
): void {
  const prefix = keyPrefix(key);
  const entries = Object.entries(value);
  const isEmpty = entries.length === 0;
  const isCollapsed = !isEmpty && collapsedPaths.has(path);

  if (isEmpty) {
    lines.push({
      lineNumber: counter.n++,
      depth,
      tokens: [...prefix, { type: "bracket", value: "{}" }, ...comma(isLast)],
    });
    return;
  }

  if (isCollapsed) {
    const count = countSubtreeLines(value);
    lines.push({
      lineNumber: counter.n++,
      depth,
      tokens: [
        ...prefix,
        { type: "bracket", value: "{" },
        { type: "ellipsis", value: ` … ${count} lines ` },
        { type: "bracket", value: "}" },
        ...comma(isLast),
      ],
      collapseKey: path,
      isCollapsed: true,
    });
    return;
  }

  // Opening brace line — carries the collapse toggle
  lines.push({
    lineNumber: counter.n++,
    depth,
    tokens: [...prefix, { type: "bracket", value: "{" }],
    collapseKey: path,
    isCollapsed: false,
  });

  // Children
  entries.forEach(([k, v], i) =>
    walkValue(
      v,
      k,
      `${path}.${k}`,
      depth + 1,
      i === entries.length - 1,
      collapsedPaths,
      lines,
      counter
    )
  );

  // Closing brace line
  lines.push({
    lineNumber: counter.n++,
    depth,
    tokens: [{ type: "bracket", value: "}" }, ...comma(isLast)],
  });
}
