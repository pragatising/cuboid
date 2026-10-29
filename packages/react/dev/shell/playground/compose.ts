import modelsJson from "../../generated/models.json";
import { cover } from "../../engine/cover";
import type { Row } from "../../engine/cover";
import { allowedBy, domainsOf } from "../../engine/domains";
import { checkComposition } from "../../engine/content/check";
import type { Issue } from "../../engine/content/issue";
import { buildNode, printExample } from "../../engine/print";
import type { Printed } from "../../engine/print";
import { recognise } from "../../engine/recognise/recognise";
import type { Models } from "../../engine/recognise/recognise";
import type { Node } from "../../engine/types";
import { fixtures, importFrom } from "./host";

export const { exports: exported, models } = modelsJson as unknown as { exports: Record<string, string>; models: Models };

/** One composed example: what it shows, the element, the code it is drawn from, and what the HTML content model says of it. */
export type Example = { row: Row; node: Node; printed: Printed; issues: Issue[] };

/**
 * The examples the engine composes for a component: each value of each prop shown at least once, in the fewest examples. `blocked` is
 * what a host has to supply before any can be made. Shared by the Playground (to draw them) and the Issues tab (to check them).
 */
export function composeExamples(component: string): { blocked: { prop: string }[]; rows: Example[] } | null {
  const model = models[exported[component]];
  if (!model) return null;
  const { doc, conditions, scenarios } = recognise(model, models, exported);
  const { domains, blocked } = domainsOf(doc, fixtures);
  if (domains.length === 0 || blocked.length > 0) return { blocked, rows: [] };
  const { rows } = cover(domains, { strength: 1, valid: allowedBy([[...conditions, ...scenarios], ...(fixtures.exclusive ?? [])]) });
  return {
    blocked,
    rows: rows.map((row) => {
      const node = buildNode(doc, row.picks);
      return { row, node, printed: printExample(node, { importFrom }), issues: checkComposition(node, { models, exported }) };
    }),
  };
}
