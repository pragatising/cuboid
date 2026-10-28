import React from "react";
import type { Node, Value } from "./types";

/**
 * The element a node describes. `sources` (from `printExample`) puts each element's place in the printed code on it as
 * `data-src`, so hovering the element can mark its code, as it does for a written example.
 */
export function toElement(
  node: Node,
  resolve: (tag: string) => React.ElementType | undefined,
  sources: Map<Node, string>,
): React.ReactNode {
  const type = resolve(node.tag);
  if (!type) return <span>{`<${node.tag}> is not exported`}</span>;
  const value = (v: Value): unknown =>
    Array.isArray(v) ? v.map((item, key) => (typeof item === "string" ? item : <React.Fragment key={key}>{toElement(item, resolve, sources)}</React.Fragment>)) : typeof v === "object" ? toElement(v, resolve, sources) : v;
  const props = Object.fromEntries(Object.entries(node.props ?? {}).map(([name, v]) => [name, value(v)]));
  const source = sources.get(node);
  const children = (node.children ?? []).map((child) => (typeof child === "string" ? child : toElement(child, resolve, sources)));
  return React.createElement(type, source ? { ...props, "data-src": source } : props, ...children);
}
