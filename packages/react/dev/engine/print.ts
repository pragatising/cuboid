import type { Choice } from "./domains";
import type { ComponentDoc, Node, Value } from "./types";

/** The element a set of picks describes. The props keep the order the component declares them in; `children` is its content. */
export function buildNode(doc: ComponentDoc, picks: Record<string, Choice>): Node {
  const props: Record<string, Value> = {};
  const children: (Node | string)[] = [];
  for (const prop of doc.props) {
    const value = picks[prop.name]?.value;
    if (value === undefined) continue;
    if (prop.name === "children") children.push(...(Array.isArray(value) ? value : [value as Node | string]));
    else props[prop.name] = value;
  }
  // What is not one of the component's props (an attribute the host says every example carries) comes after them.
  for (const [name, choice] of Object.entries(picks)) if (!doc.props.some((p) => p.name === name) && choice.value !== undefined) props[name] = choice.value;
  return { tag: doc.name, props, ...(children.length ? { children } : {}) };
}

export type Printed = {
  /** The imports, a blank line, then the function. */
  code: string;
  /** For each displayed line, the line of the function it is (1-based), or null for an import or the blank line. */
  lineMap: (number | null)[];
  /** Where each element was written, in `data-src`'s format (see dev/storySource.ts), so hovering it can mark its code. */
  sources: Map<Node, string>;
};

const WIDTH = 80;
const INDENT = 2;

type Position = { line: number; column: number };

/** Builds text and knows where it is, so every element can say where it was written. */
class Writer {
  lines = [""];
  get position(): Position {
    return { line: this.lines.length, column: this.lines[this.lines.length - 1].length };
  }
  write(text: string) {
    this.lines[this.lines.length - 1] += text;
  }
  newline(indent: number) {
    this.lines.push(" ".repeat(indent));
  }
}

const range = (from: Position, to: Position) => `${from.line}:${from.column}-${to.line}:${to.column}`;

function attribute(w: Writer, name: string, value: Value, sources: Map<Node, string>) {
  if (value === true) return w.write(name);
  if (Array.isArray(value)) {
    w.write(`${name}={[`);
    value.forEach((item, index) => {
      if (index > 0) w.write(", ");
      if (typeof item === "string") w.write(JSON.stringify(item));
      else flat(w, item, sources);
    });
    return w.write("]}");
  }
  if (typeof value === "string") return w.write(value.includes('"') ? `${name}={${JSON.stringify(value)}}` : `${name}="${value}"`);
  if (typeof value === "object") {
    w.write(`${name}={`);
    flat(w, value, sources);
    return w.write("}");
  }
  w.write(`${name}={${String(value)}}`);
}

/** The attributes in the order given. `true` is a bare attribute, so `false` is spelled out. */
const entries = (node: Node) => Object.entries(node.props ?? {});

/** The element on one line. */
function flat(w: Writer, node: Node, sources: Map<Node, string>) {
  const start = w.position;
  w.write(`<${node.tag}`);
  for (const [name, value] of entries(node)) {
    w.write(" ");
    attribute(w, name, value, sources);
  }
  if (!node.children?.length) {
    w.write(" />");
    sources.set(node, range(start, w.position));
    return;
  }
  w.write(">");
  const opening = range(start, w.position);
  for (const child of node.children) typeof child === "string" ? w.write(child) : flat(w, child, sources);
  const closingStart = w.position;
  w.write(`</${node.tag}>`);
  sources.set(node, `${opening};${range(closingStart, w.position)}`);
}

/** How wide the element is on one line. */
function flatWidth(node: Node): number {
  const w = new Writer();
  flat(w, node, new Map());
  return w.lines[0].length;
}

/** The opening tag, on one line when it fits, with an attribute to a line when it does not. Returns where it began and ended. */
function opening(w: Writer, node: Node, indent: number, selfClosing: boolean, sources: Map<Node, string>): string {
  const start = w.position;
  const probe = new Writer();
  probe.write(`<${node.tag}`);
  for (const [name, value] of entries(node)) {
    probe.write(" ");
    attribute(probe, name, value, new Map());
  }
  probe.write(selfClosing ? " />" : ">");
  if (indent + probe.lines[0].length <= WIDTH) {
    w.write(`<${node.tag}`);
    for (const [name, value] of entries(node)) {
      w.write(" ");
      attribute(w, name, value, sources);
    }
    w.write(selfClosing ? " />" : ">");
  } else {
    w.write(`<${node.tag}`);
    for (const [name, value] of entries(node)) {
      w.newline(indent + INDENT);
      attribute(w, name, value, sources);
    }
    w.newline(indent);
    w.write(selfClosing ? "/>" : ">");
  }
  return range(start, w.position);
}

/** The element at this indent: on one line if it fits, otherwise its children on lines of their own. */
function block(w: Writer, node: Node, indent: number, sources: Map<Node, string>) {
  if (indent + flatWidth(node) <= WIDTH) return flat(w, node, sources);
  if (!node.children?.length) {
    sources.set(node, opening(w, node, indent, true, sources));
    return;
  }
  const open = opening(w, node, indent, false, sources);
  for (const child of node.children) {
    w.newline(indent + INDENT);
    typeof child === "string" ? w.write(child) : block(w, child, indent + INDENT, sources);
  }
  w.newline(indent);
  const closingStart = w.position;
  w.write(`</${node.tag}>`);
  sources.set(node, `${open};${range(closingStart, w.position)}`);
}

function tagsIn(node: Node, into: Set<string>) {
  into.add(node.tag.split(".")[0]);
  for (const value of Object.values(node.props ?? {}))
    for (const inner of Array.isArray(value) ? value : [value]) if (typeof inner === "object") tagsIn(inner, into);
  for (const child of node.children ?? []) if (typeof child === "object") tagsIn(child, into);
}

/** An example as a copyable function: `import { … } from "<package>"`, then the component that renders the element. */
export function printExample(root: Node, options: { importFrom: string; name?: string }): Printed {
  const sources = new Map<Node, string>();
  const w = new Writer();
  w.write(`export function ${options.name ?? "Example"}() {`);
  w.newline(INDENT);
  w.write("return (");
  w.newline(INDENT * 2);
  block(w, root, INDENT * 2, sources);
  w.newline(INDENT);
  w.write(");");
  w.newline(0);
  w.write("}");

  const tags = new Set<string>();
  tagsIn(root, tags);
  const imports = [`import { ${[...tags].sort().join(", ")} } from "${options.importFrom}";`, ""];
  return {
    code: [...imports, ...w.lines].join("\n"),
    lineMap: [...imports.map(() => null), ...w.lines.map((_, i) => i + 1)],
    sources,
  };
}
