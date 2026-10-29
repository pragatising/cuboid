import { checkComposition } from "../../engine/content/check";
import { humanise } from "../../engine/domains";
import type { Node, Value } from "../../engine/types";
import { HTML } from "../../engine/content/html";
import { rootHostOf } from "../../engine/recognise/role";
import { composeExamples, exported, models } from "../playground/compose";
import { fixtures } from "../playground/host";
import { withProps } from "./overrides";

/** Something a slot can be filled with: what it is called in the menu, and what goes in the code. */
export type Candidate = { id: string; label: string; value: Value };

/** The simplest way to draw a component (its first example: nothing optional set, what it must have supplied), or null if it cannot be drawn alone. */
const simplest = new Map<string, Node | null>();
function simplestOf(name: string): Node | null {
  if (!simplest.has(name))
    simplest.set(name, composeExamples(name)?.rows[0]?.node ?? null);
  return simplest.get(name) ?? null;
}

const found = new Map<string, Candidate[]>();

/**
 * What can go in a slot of the component in this example. Every component the library exports is tried in it: it is a candidate when it
 * can be drawn alone and the example with it in the slot breaks no rule of the HTML content model (a `Table` does not fit a button's leading
 * visual, nor does another button). Text is always one, since text fits wherever anything does. Worked out when the menu is opened, and kept.
 */
export function slotCandidates(
  component: string,
  base: Node,
  slot: string,
  control = false,
): Candidate[] {
  const key = `${component}.${slot}.${control}`;
  const known = found.get(key);
  if (known) return known;
  // A slot that must be one control (it is cloned with the props that make it open something) cannot be text.
  const candidates: Candidate[] = control
    ? []
    : [{ id: "text", label: "Text", value: humanise(slot) }];
  for (const name of Object.keys(exported)
    .filter((n) => /^[A-Z]/.test(n) && n !== component)
    .sort()) {
    const drawn = simplestOf(name);
    if (!drawn) continue;
    const node = control ? asControl(name, drawn) : drawn;
    if (!node) continue;
    const errors = checkComposition(
      withProps(base, component, { [slot]: node }),
      { models, exported },
    ).filter((issue) => issue.severity === "error");
    if (errors.length === 0)
      candidates.push({ id: name, label: name, value: node });
  }
  found.set(key, candidates);
  return candidates;
}

/**
 * The node as one control: as the host says (a button, a link; a pill given `as="button"`), and nothing otherwise (a sheet, a layout). Without
 * a list from the host, as it is when what the component draws first is an interactive element.
 */
function asControl(name: string, node: Node): Node | null {
  // When the host says which components are controls, that is the list: the engine reads what a component draws first, which is not
  // always what it is (a sheet's first element is its close button).
  if (fixtures.controls) {
    if (!(name in fixtures.controls)) return null;
    const extra = fixtures.controls[name];
    return extra ? { ...node, props: { ...node.props, ...extra } } : node;
  }
  const model = models[exported[name]];
  const root = model ? rootHostOf(model, models) : null;
  return root && HTML[root.tag]?.categories.includes("interactive")
    ? node
    : null;
}

/** What a slot's current content is called: the component in it, `Text`, or nothing. */
export function nameOf(value: Value | undefined): string | null {
  if (value === undefined || value === false) return null;
  if (typeof value === "string") return "Text";
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "object" ? first.tag : "Text";
}
