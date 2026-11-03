import type { Issue } from "../content/issue";
import { readTags, severityOf } from "./criteria";

/** What the mapping reads of an axe result: its shape, not its library. */
export type AxeResult = {
  id: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: { target: unknown[]; html: string; failureSummary?: string }[];
};
export type AxeResults = { violations: AxeResult[]; incomplete?: AxeResult[] };

/** `a, b` selector parts of one node, flattened (a target can be a path through iframes or shadow roots). */
const selectorOf = (target: unknown[]) => target.flat(Infinity).join(" ");

/** The first line of axe's own account of what to change, without its "Fix any of the following:" lead. */
const reasonOf = (summary: string | undefined) =>
  summary
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => line && !/^Fix (any|all) of the following/.test(line));

/**
 * WCAG findings, as issues. A violation is an error at A or AA (guidance for best practice, an info at AAA); what axe could not decide
 * on its own (`incomplete`) is an info that a person has to check. Each names its criterion, its level and axe's page for the rule.
 * `path` is where the composition was, and the element's selector is added to it.
 */
export function fromAxe(results: AxeResults, path: string[]): Issue[] {
  const issues: Issue[] = [];
  const add = (found: AxeResult[], decided: boolean) => {
    for (const rule of found) {
      const { criteria, version, level } = readTags(rule.tags);
      for (const node of rule.nodes) {
        const why = reasonOf(node.failureSummary);
        issues.push({
          rule: `wcag.${rule.id}`,
          severity: severityOf(level, decided),
          source: "wcag",
          message: `${decided ? "" : "Needs a person to check: "}${rule.help}${why && decided ? `: ${why}` : ""} (${selectorOf(node.target)})`,
          path: [...path, selectorOf(node.target)],
          references: [
            ...criteria.map((criterion) => ({ name: `WCAG ${version ?? "2"} ${level}: ${criterion}`, criterion })),
            ...(level === "best-practice" ? [{ name: "Best practice (not a WCAG criterion)" }] : []),
            { name: `axe: ${rule.id}`, url: rule.helpUrl },
          ],
        });
      }
    }
  };
  add(results.violations, true);
  add(results.incomplete ?? [], false);
  return issues;
}
