import type { Node, Value } from "../types";
import type { Instance } from "./readExample";

/** An instance as the node it draws: its tag, the props that can be read, and its text and elements. An expression among the content is kept as its code, in braces and cut short. */
export function nodeOf(instance: Instance, tag = instance.tag): Node {
  const props: Record<string, Value> = {};
  for (const [name, prop] of Object.entries(instance.props)) {
    if (prop.kind === "literal") props[name] = prop.value;
    else if (prop.kind === "element") props[name] = nodeOf(prop.instance);
  }
  const children = instance.children.map((child): Node | string => {
    if ("id" in child) return nodeOf(child);
    if (child.kind === "text") return child.text;
    const written = child.source.replace(/\s+/g, " ");
    return { tag: `{${written.length > 24 ? `${written.slice(0, 24)}…` : written}}` };
  });
  return { tag, ...(Object.keys(props).length ? { props } : {}), ...(children.length ? { children } : {}) };
}

/**
 * What the instance writes, as the code has it, by prop: each attribute as it is written (`"md"`, `false`, `() => close()`, `<Button>Open</Button>`; nothing for a bare
 * one), and its content (`children`) as the lines between its tags. The view shows an element or an expression as that code, and an attribute the component does not list
 * (`disabled` on a button) as written.
 */
export function writtenOf(instance: Instance): Record<string, string> {
  const written: Record<string, string> = {};
  if (instance.childrenSource) written.children = instance.childrenSource;
  for (const [name, prop] of Object.entries(instance.props)) written[name] = prop.source;
  return written;
}
