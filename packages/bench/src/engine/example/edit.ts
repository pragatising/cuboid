import type { ExampleTree } from "./readExample";

/** A value an edit can write into the text: a literal. An element or code is not written back here. */
export type EditValue = string | number | boolean | undefined;

/** What has been changed in an example: the new value of a prop, by instance and name; `undefined` takes the attribute off. */
export type Edits = Record<string, Record<string, EditValue | object>>;

/** An attribute as it is written: a bare word for `true`, quotes for plain text, braces for the rest. */
export function printAttribute(name: string, value: string | number | boolean): string {
  if (value === true) return name;
  if (typeof value === "string") return /["{}\n]/.test(value) ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`;
  return `${name}={${JSON.stringify(value)}}`;
}

const leadingSpace = (source: string, from: number) => {
  let at = from;
  while (at > 0 && /[ \t\n]/.test(source[at - 1])) at--;
  return at;
};

/**
 * The example's text with the changes written into the instances they are for: a changed prop replaces the attribute that was there (or is added after the tag's
 * name), and one taken off loses its attribute and the space before it. Only the instance an edit names changes: its siblings, written the same, are left as they were.
 */
export function applyEdits(tree: ExampleTree, edits: Edits): string {
  const changes: { from: number; to: number; insert: string }[] = [];
  for (const instance of tree.instances) {
    for (const [name, value] of Object.entries(edits[instance.id] ?? {})) {
      // A value that is an element or code is not a literal to write: it is changed in the code itself.
      if (name === "children" || (typeof value === "object" && value !== null)) continue;
      const existing = instance.props[name];
      if (existing) changes.push(value === undefined ? { from: leadingSpace(tree.source, existing.from), to: existing.to, insert: "" } : { from: existing.from, to: existing.to, insert: printAttribute(name, value as string | number | boolean) });
      else if (value !== undefined) changes.push({ from: instance.nameEnd, to: instance.nameEnd, insert: ` ${printAttribute(name, value as string | number | boolean)}` });
    }
  }
  let code = tree.source;
  // From the end back, so a change does not move the places of the ones before it.
  for (const change of changes.sort((a, b) => b.from - a.from)) code = code.slice(0, change.from) + change.insert + code.slice(change.to);
  return code;
}
