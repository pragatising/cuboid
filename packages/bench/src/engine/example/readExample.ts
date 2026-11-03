import { javascriptLanguage } from "@codemirror/lang-javascript";
import type { SyntaxNode } from "@lezer/common";

/**
 * What one example says, as a tree: every element it writes is an instance, with its props and content as written. One function reads any example;
 * each Examples frame, the Anatomy example and any scenario has a tree of its own. The code is parsed (as the editor parses it), never run, so what
 * needs running to be known (a variable, a call, `items.map(…)`) is kept as the code that writes it.
 */
const parser = javascriptLanguage.configure({ dialect: "jsx ts" }).parser;

/** Where something is in the text of the example. */
export type Range = { from: number; to: number };

/** A prop's value as the example writes it. */
export type Written =
  /** `size="md"`, `open`, `count={3}`: a value that can be read. `source` is how it is written. */
  | { kind: "literal"; value: string | number | boolean; source: string }
  /** `trigger={<Button>Actions</Button>}`: an element, which is an instance of its own. */
  | { kind: "element"; instance: Instance; source: string }
  /** `onClick={() => setOpen(false)}`, `items={rows}`: known to be set, not to what. */
  | { kind: "expression"; source: string };

/** One attribute of an element: what it is set to, and where the attribute is (so it can be changed in the text). */
export type WrittenProp = Written & Range;

/** What is written between an element's tags. */
export type Child = Instance | { kind: "text"; text: string } | { kind: "expression"; source: string };

export type Instance = {
  /** Its address in the example: the root is `0`, its second child `0.1`, an element written as a prop `0.1@trigger`. */
  id: string;
  /** What it is written as: `Menu.Item`, `div`. Empty for a fragment. */
  tag: string;
  /** The public id of the component its tag is, when the example imports it from a configured package (see `componentResolver`): `Menu.Item`. */
  component?: string;
  props: Record<string, WrittenProp>;
  children: Child[];
  /** The lines between its tags, as written, with the indent they share taken off. Undefined when there are none. */
  childrenSource?: string;
  /** The whole element. */
  range: Range;
  /** The name in the opening tag: where a prop is added. */
  nameEnd: number;
  selfClosing: boolean;
};

export type ExampleTree = {
  source: string;
  /** The first element the example writes: what it draws. */
  root: Instance | undefined;
  /** Every instance, in the order they are written (an element written as a prop comes where the prop is). */
  instances: Instance[];
};

const text = (source: string, node: SyntaxNode) => source.slice(node.from, node.to);

/** A literal as the value it is, or undefined for anything that needs running to know. */
function literal(source: string, node: SyntaxNode): string | number | boolean | undefined {
  const raw = text(source, node);
  switch (node.name) {
    case "String":
      return raw.slice(1, -1);
    case "Number":
      return Number(raw);
    case "BooleanLiteral":
      return raw === "true";
    case "TemplateString":
      return raw.includes("${") ? undefined : raw.slice(1, -1);
    default:
      return undefined;
  }
}

const isElement = (node: SyntaxNode) => node.name === "JSXElement" || node.name === "JSXSelfClosingTag";

/** The lines between an element's opening and closing tags, with the indent they share taken off. */
function between(source: string, element: SyntaxNode): string | undefined {
  const open = element.getChild("JSXOpenTag");
  const close = element.getChild("JSXCloseTag");
  if (!open || !close) return undefined;
  const lines = source.slice(open.to, close.from).split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) return undefined;
  const indent = Math.min(...lines.map((line) => line.length - line.trimStart().length));
  return lines.map((line) => line.slice(indent)).join("\n");
}

function instanceOf(source: string, node: SyntaxNode, id: string, resolve?: Resolve): Instance | undefined {
  // `<Icon />` is a `JSXElement` that holds a `JSXSelfClosingTag`, which is the element's own tag, not a child of it.
  const wrapper = node.name === "JSXElement" ? node : null;
  const opening = wrapper ? (wrapper.getChild("JSXOpenTag") ?? wrapper.getChild("JSXSelfClosingTag")) : node;
  if (!opening) return undefined;
  const name = opening.getChild("JSXMemberExpression") ?? opening.getChild("JSXIdentifier");
  const selfClosing = opening.name === "JSXSelfClosingTag";
  const props: Record<string, WrittenProp> = {};
  for (let child = opening.firstChild; child; child = child.nextSibling) {
    if (child.name !== "JSXAttribute") continue;
    const key = child.getChild("JSXIdentifier");
    if (!key) continue;
    const prop = text(source, key);
    const range = { from: child.from, to: child.to };
    const quoted = child.getChild("JSXAttributeValue");
    const escape = child.getChild("JSXEscape");
    if (quoted) props[prop] = { kind: "literal", value: text(source, quoted).slice(1, -1), source: text(source, quoted), ...range };
    else if (escape) {
      const inner = escape.firstChild?.nextSibling;
      if (!inner || inner.name === "}") continue;
      const written = text(source, inner);
      const element = isElement(inner) ? instanceOf(source, inner, `${id}@${prop}`, resolve) : undefined;
      const value = element ? undefined : literal(source, inner);
      props[prop] = element ? { kind: "element", instance: element, source: written, ...range } : value !== undefined ? { kind: "literal", value, source: written, ...range } : { kind: "expression", source: written, ...range };
    } else props[prop] = { kind: "literal", value: true, source: "", ...range };
  }
  const children: Child[] = [];
  if (wrapper && !selfClosing) {
    for (let child = wrapper.firstChild; child; child = child.nextSibling) {
      if (child.name === "JSXText") {
        const words = text(source, child).trim();
        if (words) children.push({ kind: "text", text: words });
      } else if (isElement(child)) {
        const inner = instanceOf(source, child, `${id}.${children.length}`, resolve);
        if (inner) children.push(inner);
      } else if (child.name === "JSXEscape") {
        const inner = child.firstChild?.nextSibling;
        if (inner && inner.name !== "}") children.push({ kind: "expression", source: text(source, inner) });
      }
    }
  }
  const tag = name ? text(source, name) : "";
  const component = tag ? resolve?.(tag) : undefined;
  return { id, tag, ...(component ? { component } : {}), props, children, childrenSource: wrapper && !selfClosing ? between(source, wrapper) : undefined, range: { from: node.from, to: node.to }, nameEnd: name ? name.to : opening.from + 1, selfClosing };
}

function collect(instance: Instance, into: Instance[]) {
  into.push(instance);
  // In the order written: the props are in the opening tag, before the content.
  const written = Object.values(instance.props).sort((a, b) => a.from - b.from);
  for (const prop of written) if (prop.kind === "element") collect(prop.instance, into);
  for (const child of instance.children) if ("id" in child) collect(child, into);
}

/** What a tag is, as a public id (`Menu.Item`), or undefined where it is not a component of a configured library. */
export type Resolve = (tag: string) => string | undefined;

/** The tree of one example: pass the text of the example (`exampleText`), or of a file whose first element is what it draws. `resolve` says what component a tag is. */
export function readExample(source: string, resolve?: Resolve): ExampleTree {
  let root: Instance | undefined;
  parser.parse(source).iterate({
    enter(cursor) {
      if (root || cursor.name !== "JSXElement") return;
      root = instanceOf(source, cursor.node, "0", resolve);
      return false;
    },
  });
  const instances: Instance[] = [];
  if (root) collect(root, instances);
  return { source, root, instances };
}

/** The instance with this id, or undefined. */
export const instanceAt = (tree: ExampleTree, id: string): Instance | undefined => tree.instances.find((instance) => instance.id === id);

/** Every instance written as this tag, in the order written (`Menu.Item` is three items). */
export const instancesOf = (tree: ExampleTree, tag: string): Instance[] => tree.instances.filter((instance) => instance.tag === tag);
