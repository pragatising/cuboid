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
import type { ComponentDoc, Node } from "../../engine/types";
import { fixtures, importFrom } from "./host";

export const { exports: exported, models } = modelsJson as unknown as { exports: Record<string, string>; models: Models };

/** One composed example: what it shows, the element, the code it is drawn from, and what the HTML content model says of it. */
export type Example = { row: Row; node: Node; printed: Printed; issues: Issue[] };

/**
 * The examples the engine composes for a component: each value of each prop shown at least once, in the fewest examples. `blocked` is
 * what a host has to supply before any can be made. Shared by the Playground (to draw them) and the Issues tab (to check them).
 */
/**
 * The example a component is drawn from when one is wanted (Anatomy, the Playground): the component as it is by default, with the most it
 * can show: the slots and parts of the richest of the composed examples. The other props stay at their defaults, because a typical use is
 * not one with a flag turned the other way for the sake of coverage. Never one that is in a state of its own (disabled, loading…).
 * Null when none can be composed.
 */
export function anatomyExample(composed: ReturnType<typeof composeExamples>): Example | null {
  if (!composed) return null;
  // The same composed examples give the same example, not a new one each time: whoever depends on it (an effect) must not see it change.
  if (chosen.has(composed)) return chosen.get(composed) ?? null;
  const example = pickExample(composed);
  chosen.set(composed, example);
  return example;
}

const chosen = new WeakMap<object, Example | null>();

function pickExample(composed: NonNullable<ReturnType<typeof composeExamples>>): Example | null {
  const usable = composed.rows.filter((example) => !composed.conditions.some((name) => name in (example.node.props ?? {})));
  const richest = usable.reduce<Example | null>((best, example) => (!best || example.printed.sources.size > best.printed.sources.size ? example : best), null);
  const baseline = composed.rows[0];
  if (!richest || !baseline || richest === baseline) return richest;
  // From the richest take what is content (slots hold nodes; children): the rest is the baseline's.
  const content = Object.fromEntries(Object.entries(richest.node.props ?? {}).filter(([, value]) => typeof value === "object"));
  const node: Node = { ...baseline.node, props: { ...baseline.node.props, ...content }, children: richest.node.children };
  if (!node.children) delete node.children;
  return { row: richest.row, node, printed: printExample(node, { importFrom }), issues: checkComposition(node, { models, exported }) };
}

export function composeExamples(component: string): { blocked: { prop: string }[]; rows: Example[]; conditions: string[]; contentFromOptional: string[]; doc: ComponentDoc } | null {
  const model = models[exported[component]];
  if (!model) return null;
  const { doc, conditions, scenarios, contentFromOptional } = recognise(model, models, exported);
  const { domains, blocked } = domainsOf(doc, fixtures);
  const unusable = [...conditions, ...scenarios];
  if (blocked.length > 0) return { blocked, rows: [], conditions: unusable, contentFromOptional, doc };
  // Nothing to vary (a Divider) is still a component: one example, with nothing set.
  const { rows } = domains.length === 0 ? { rows: [{ picks: {}, title: "Default", newValues: 0, newPairs: 0 }] } : cover(domains, { strength: 1, valid: allowedBy([[...conditions, ...scenarios], ...(fixtures.exclusive ?? [])]) });
  return {
    blocked,
    // The props that mean "cannot be used right now": an example that sets one is a state, not the component in use.
    conditions: unusable,
    contentFromOptional,
    doc,
    rows: rows.map((row) => {
      const node = buildNode(doc, row.picks);
      return { row, node, printed: printExample(node, { importFrom }), issues: checkComposition(node, { models, exported }) };
    }),
  };
}
