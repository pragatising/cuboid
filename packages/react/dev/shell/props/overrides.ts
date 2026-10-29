import { parseDefault } from "../../engine/domains";
import type { Node, Value } from "../../engine/types";

/** What has been changed from the example's own props, by prop name; `undefined` is "take it off" (it goes back to its default). */
export type Overrides = Record<string, Value | undefined>;

/**
 * The example with the changes made to the component in it: the first node of that tag, with each changed prop set, or taken off when it
 * was put back to its default. `children` is the content between the tags. Nothing else is touched, so a part around it (a shell) is as it was.
 */
export function withProps(root: Node, tag: string, overrides: Overrides): Node {
  if (Object.keys(overrides).length === 0) return root;
  let done = false;
  const apply = (node: Node): Node => {
    const props: Record<string, Value> = { ...node.props };
    let children = node.children;
    for (const [name, value] of Object.entries(overrides)) {
      if (name === "children") children = value === undefined ? undefined : Array.isArray(value) ? value : [value as Node | string];
      else if (value === undefined) delete props[name];
      else props[name] = value;
    }
    const { props: _old, children: _children, ...rest } = node;
    return { ...rest, ...(Object.keys(props).length ? { props } : {}), ...(children?.length ? { children } : {}) };
  };
  const walk = (node: Node): Node => {
    if (!done && node.tag === tag) {
      done = true;
      return apply(node);
    }
    if (!node.children) return node;
    const children = node.children.map((child) => (typeof child === "string" ? child : walk(child)));
    return children.every((child, i) => child === (node.children as unknown[])[i]) ? node : { ...node, children };
  };
  return walk(root);
}

/** What a prop is now: what was changed to, else what the example sets, else nothing (the default is the caller's to show). */
export function setValue(name: string, node: Node | null, overrides: Overrides): Value | undefined {
  if (name in overrides) return overrides[name];
  return name === "children" ? node?.children : node?.props?.[name];
}

/** What a choice or a switch shows: what it is set to, or the default the types say. */
export function shownValue(name: string, node: Node | null, overrides: Overrides, defaultText: string | undefined): string | number | boolean | Node | (Node | string)[] | undefined {
  return setValue(name, node, overrides) ?? parseDefault(defaultText);
}

/**
 * A prop's new value when it is chosen: its default is not written down (the code stays as short as it can be), anything else is.
 * `base` is what the example itself sets, so putting a prop back to what the example has needs no change either.
 */
export function chosen(value: Value, defaultText: string | undefined, node: Node | null, name: string): Value | undefined {
  return value === parseDefault(defaultText) && node?.props?.[name] === undefined ? undefined : value;
}
