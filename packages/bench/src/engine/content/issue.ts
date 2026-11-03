/**
 * A finding about a component, from any source: the HTML content model, a WCAG criterion, a system rule. One shape, so the Issues
 * tab can list them all and filter by type, severity and source.
 */
export type Issue = {
  /** Which rule found it: `html.content-model`, `html.nested-interactive`, `html.parent`. */
  rule: string;
  /** `error` breaks a platform rule; `warning` is guidance or best practice; `info` is a gap. */
  severity: "error" | "warning" | "info";
  source: "html" | "wcag" | "system";
  message: string;
  /** Where in the composition: `Button` › `leadingVisual` › `Table`. */
  path: string[];
  /** Where the rule comes from. */
  references: { name: string; url?: string; criterion?: string }[];
};
